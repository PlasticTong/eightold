package backtest

import (
	"errors"
	"fmt"
	"math"
)

const targetTolerance = 1e-9

// EngineConfig contains execution, sizing and portfolio risk assumptions.
// Zero disables an optional risk rule.
type EngineConfig struct {
	InitialCash       float64
	CommissionRate    float64
	MinimumCommission float64
	SlippageRate      float64
	MaxPositionPct    float64
	LotSize           float64
	StopLossPct       float64
	TakeProfitPct     float64
	MaxDrawdownPct    float64
}

type pendingOrder struct {
	target float64
	reason string
}

type account struct {
	cash             float64
	quantity         float64
	positionCost     float64
	entryPrice       float64
	peakEquity       float64
	blockedUntilFlat bool
	halted           bool
}

// Run executes a single-asset, long-only event-driven backtest.
//
// Event order:
//  1. execute the prior close's target at today's open;
//  2. mark the account at today's close;
//  3. evaluate portfolio risk;
//  4. ask the strategy for the next target.
func Run(bars []Bar, strategy Strategy, config EngineConfig) (Result, error) {
	if err := validateEngineInputs(bars, strategy, config); err != nil {
		return Result{}, err
	}
	if err := strategy.Prepare(bars); err != nil {
		return Result{}, fmt.Errorf("prepare strategy: %w", err)
	}

	state := account{
		cash:       config.InitialCash,
		peakEquity: config.InitialCash,
	}
	var pending *pendingOrder
	lastTarget := 0.0
	trades := make([]Trade, 0)
	equity := make([]EquityPoint, 0, len(bars))

	for index, bar := range bars {
		if pending != nil {
			trade := rebalanceAtOpen(&state, bar, pending.target, pending.reason, config)
			if trade != nil {
				trades = append(trades, *trade)
			}
			pending = nil
		}

		currentEquity := state.cash + state.quantity*bar.Close
		if currentEquity > state.peakEquity {
			state.peakEquity = currentEquity
		}
		drawdown := 0.0
		if state.peakEquity > 0 {
			drawdown = (state.peakEquity - currentEquity) / state.peakEquity
		}
		equity = append(equity, EquityPoint{
			Date:     bar.Date,
			Equity:   currentEquity,
			Cash:     state.cash,
			Position: state.quantity,
			Drawdown: drawdown,
		})

		if !state.halted && config.MaxDrawdownPct > 0 && drawdown >= config.MaxDrawdownPct {
			state.halted = true
			lastTarget = 0
			if state.quantity > 0 && index+1 < len(bars) {
				pending = &pendingOrder{target: 0, reason: "maximum drawdown circuit breaker"}
			}
			continue
		}
		if state.halted {
			continue
		}

		if state.quantity > 0 {
			positionReturn := bar.Close/state.entryPrice - 1
			switch {
			case config.StopLossPct > 0 && positionReturn <= -config.StopLossPct:
				state.blockedUntilFlat = true
				lastTarget = 0
				if index+1 < len(bars) {
					pending = &pendingOrder{target: 0, reason: "stop loss"}
				}
				continue
			case config.TakeProfitPct > 0 && positionReturn >= config.TakeProfitPct:
				state.blockedUntilFlat = true
				lastTarget = 0
				if index+1 < len(bars) {
					pending = &pendingOrder{target: 0, reason: "take profit"}
				}
				continue
			}
		}

		target, reason := strategy.Target(index)
		if math.IsNaN(target) || math.IsInf(target, 0) || target < 0 || target > 1 {
			return Result{}, fmt.Errorf("strategy target at index %d must be in [0, 1], got %v", index, target)
		}

		if state.blockedUntilFlat {
			if target <= targetTolerance {
				state.blockedUntilFlat = false
				lastTarget = 0
			}
			continue
		}
		if math.Abs(target-lastTarget) <= targetTolerance {
			continue
		}

		lastTarget = target
		if index+1 < len(bars) {
			pending = &pendingOrder{target: target, reason: reason}
		}
	}

	return buildResult(bars, strategy.Name(), config.InitialCash, state.halted, trades, equity), nil
}

func validateEngineInputs(bars []Bar, strategy Strategy, config EngineConfig) error {
	if strategy == nil {
		return errors.New("strategy cannot be nil")
	}
	if len(bars) < 2 {
		return errors.New("backtest requires at least two bars")
	}
	for index, bar := range bars {
		if bar.Open <= 0 || bar.High <= 0 || bar.Low <= 0 || bar.Close <= 0 {
			return fmt.Errorf("bar %d prices must be positive", index)
		}
		if bar.High < math.Max(bar.Open, bar.Close) || bar.Low > math.Min(bar.Open, bar.Close) || bar.High < bar.Low {
			return fmt.Errorf("bar %d has inconsistent OHLC values", index)
		}
		if bar.Volume < 0 {
			return fmt.Errorf("bar %d volume cannot be negative", index)
		}
		if index > 0 && !bar.Date.After(bars[index-1].Date) {
			return fmt.Errorf("bar %d date must be later than the previous bar", index)
		}
	}
	if config.InitialCash <= 0 {
		return errors.New("initial cash must be positive")
	}
	if config.CommissionRate < 0 || config.CommissionRate >= 1 {
		return errors.New("commission rate must be in [0, 1)")
	}
	if config.MinimumCommission < 0 {
		return errors.New("minimum commission cannot be negative")
	}
	if config.SlippageRate < 0 || config.SlippageRate >= 1 {
		return errors.New("slippage rate must be in [0, 1)")
	}
	if config.MaxPositionPct <= 0 || config.MaxPositionPct > 1 {
		return errors.New("max position percent must be in (0, 1]")
	}
	if config.LotSize < 0 {
		return errors.New("lot size cannot be negative")
	}
	for name, value := range map[string]float64{
		"stop loss":        config.StopLossPct,
		"take profit":      config.TakeProfitPct,
		"maximum drawdown": config.MaxDrawdownPct,
	} {
		if value < 0 || value >= 1 {
			return fmt.Errorf("%s must be in [0, 1)", name)
		}
	}
	return nil
}

func rebalanceAtOpen(state *account, bar Bar, target float64, reason string, config EngineConfig) *Trade {
	targetValue := (state.cash + state.quantity*bar.Open) * target * config.MaxPositionPct
	currentValue := state.quantity * bar.Open

	if targetValue > currentValue+targetTolerance {
		return buyAtOpen(state, bar, targetValue-currentValue, reason, config)
	}
	if targetValue < currentValue-targetTolerance {
		return sellAtOpen(state, bar, currentValue-targetValue, reason, config)
	}
	return nil
}

func buyAtOpen(state *account, bar Bar, desiredValue float64, reason string, config EngineConfig) *Trade {
	price := bar.Open * (1 + config.SlippageRate)
	quantity := roundDown(desiredValue/price, config.LotSize)
	if quantity <= 0 {
		return nil
	}

	quantity = affordableQuantity(state.cash, price, quantity, config)
	quantity = roundDown(quantity, config.LotSize)
	if quantity <= 0 {
		return nil
	}

	gross := quantity * price
	fee := commission(gross, config)
	totalCost := gross + fee
	if totalCost > state.cash+1e-8 {
		return nil
	}

	oldQuantity := state.quantity
	state.cash -= totalCost
	if math.Abs(state.cash) < 1e-9 {
		state.cash = 0
	}
	state.quantity += quantity
	state.positionCost += totalCost
	state.entryPrice = (state.entryPrice*oldQuantity + price*quantity) / state.quantity

	return &Trade{
		Date:       bar.Date,
		Side:       "BUY",
		Price:      price,
		Qty:        quantity,
		Fee:        fee,
		GrossValue: gross,
		Reason:     reason,
	}
}

func sellAtOpen(state *account, bar Bar, desiredValue float64, reason string, config EngineConfig) *Trade {
	price := bar.Open * (1 - config.SlippageRate)
	quantity := roundDown(desiredValue/price, config.LotSize)
	if quantity > state.quantity {
		quantity = state.quantity
	}
	if state.quantity-quantity < maxFloat(config.LotSize, targetTolerance) {
		quantity = state.quantity
	}
	if quantity <= 0 {
		return nil
	}

	gross := quantity * price
	fee := commission(gross, config)
	costShare := state.positionCost * (quantity / state.quantity)
	realizedPnL := gross - fee - costShare

	state.cash += gross - fee
	state.quantity -= quantity
	state.positionCost -= costShare
	closed := false
	if state.quantity <= targetTolerance {
		closed = true
		state.quantity = 0
		state.positionCost = 0
		state.entryPrice = 0
	}

	return &Trade{
		Date:        bar.Date,
		Side:        "SELL",
		Price:       price,
		Qty:         quantity,
		Fee:         fee,
		GrossValue:  gross,
		RealizedPnL: realizedPnL,
		Reason:      reason,
		Closed:      closed,
	}
}

func affordableQuantity(cash, price, desired float64, config EngineConfig) float64 {
	if cash <= config.MinimumCommission {
		return 0
	}
	quantity := math.Min(desired, cash/(price*(1+config.CommissionRate)))
	for range 2 {
		gross := quantity * price
		fee := commission(gross, config)
		if gross+fee <= cash {
			return quantity
		}
		quantity = (cash - fee) / price
		if quantity <= 0 {
			return 0
		}
	}
	return quantity
}

func commission(gross float64, config EngineConfig) float64 {
	if gross <= 0 {
		return 0
	}
	return math.Max(gross*config.CommissionRate, config.MinimumCommission)
}

func roundDown(value, lotSize float64) float64 {
	if lotSize <= 0 {
		return value
	}
	return math.Floor((value+targetTolerance)/lotSize) * lotSize
}

func maxFloat(left, right float64) float64 {
	if left > right {
		return left
	}
	return right
}
