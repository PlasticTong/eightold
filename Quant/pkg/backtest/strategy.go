package backtest

import (
	"errors"
	"fmt"
	"math"
)

// Strategy turns information known at a bar's close into a target exposure.
// Target must return a value in [0, 1]. The engine executes changes at the
// following bar's open, so strategies cannot accidentally trade on future data.
type Strategy interface {
	Name() string
	Prepare([]Bar) error
	Target(index int) (target float64, reason string)
}

// SMACrossStrategy stays long while the fast average is above the slow average.
type SMACrossStrategy struct {
	FastPeriod int
	SlowPeriod int

	fast []float64
	slow []float64
}

func (strategy *SMACrossStrategy) Name() string {
	return fmt.Sprintf("sma-cross(%d,%d)", strategy.FastPeriod, strategy.SlowPeriod)
}

func (strategy *SMACrossStrategy) Prepare(bars []Bar) error {
	if strategy.FastPeriod <= 0 || strategy.SlowPeriod <= 0 || strategy.FastPeriod >= strategy.SlowPeriod {
		return errors.New("SMA periods must satisfy 0 < fast < slow")
	}
	if len(bars) <= strategy.SlowPeriod {
		return errors.New("not enough bars for the selected slow period")
	}

	closes := make([]float64, len(bars))
	for index, bar := range bars {
		closes[index] = bar.Close
	}

	var err error
	strategy.fast, err = SMA(closes, strategy.FastPeriod)
	if err != nil {
		return err
	}
	strategy.slow, err = SMA(closes, strategy.SlowPeriod)
	return err
}

func (strategy *SMACrossStrategy) Target(index int) (float64, string) {
	if index < 0 || index >= len(strategy.fast) ||
		math.IsNaN(strategy.fast[index]) || math.IsNaN(strategy.slow[index]) {
		return 0, "SMA warm-up"
	}
	if strategy.fast[index] > strategy.slow[index] {
		return 1, "fast SMA above slow SMA"
	}
	return 0, "fast SMA not above slow SMA"
}

// MomentumStrategy stays long when the lookback return is above Threshold.
type MomentumStrategy struct {
	Lookback  int
	Threshold float64

	closes []float64
}

func (strategy *MomentumStrategy) Name() string {
	return fmt.Sprintf("momentum(%d,%.4f)", strategy.Lookback, strategy.Threshold)
}

func (strategy *MomentumStrategy) Prepare(bars []Bar) error {
	if strategy.Lookback <= 0 {
		return errors.New("momentum lookback must be positive")
	}
	if len(bars) <= strategy.Lookback {
		return errors.New("not enough bars for the selected momentum lookback")
	}
	if strategy.Threshold <= -1 {
		return errors.New("momentum threshold must be greater than -1")
	}

	strategy.closes = make([]float64, len(bars))
	for index, bar := range bars {
		strategy.closes[index] = bar.Close
	}
	return nil
}

func (strategy *MomentumStrategy) Target(index int) (float64, string) {
	if index < strategy.Lookback || index >= len(strategy.closes) {
		return 0, "momentum warm-up"
	}
	momentum := strategy.closes[index]/strategy.closes[index-strategy.Lookback] - 1
	if momentum > strategy.Threshold {
		return 1, fmt.Sprintf("%d-bar momentum %.4f above threshold", strategy.Lookback, momentum)
	}
	return 0, fmt.Sprintf("%d-bar momentum %.4f not above threshold", strategy.Lookback, momentum)
}

// BuyAndHoldStrategy is a simple baseline that enters once and stays invested.
type BuyAndHoldStrategy struct{}

func (BuyAndHoldStrategy) Name() string {
	return "buy-and-hold"
}

func (BuyAndHoldStrategy) Prepare(bars []Bar) error {
	if len(bars) < 2 {
		return errors.New("buy-and-hold requires at least two bars")
	}
	return nil
}

func (BuyAndHoldStrategy) Target(index int) (float64, string) {
	return 1, "buy-and-hold baseline"
}
