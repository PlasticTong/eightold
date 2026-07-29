package backtest

import (
	"math"
	"time"
)

func buildResult(
	bars []Bar,
	strategy string,
	initialCash float64,
	halted bool,
	trades []Trade,
	equity []EquityPoint,
) Result {
	finalEquity := equity[len(equity)-1].Equity
	totalReturn := finalEquity/initialCash - 1
	maximumDrawdown := maxDrawdown(equity)
	growth := annualizedGrowth(initialCash, finalEquity, bars[0].Date, bars[len(bars)-1].Date)
	sharpe := annualizedSharpe(equity)
	calmar := 0.0
	if maximumDrawdown > 0 {
		calmar = growth / maximumDrawdown
	}

	var totalFees, grossTurnover float64
	var winners, closedTrades int
	for _, trade := range trades {
		totalFees += trade.Fee
		grossTurnover += trade.GrossValue
		if trade.Side == "SELL" && trade.Closed {
			closedTrades++
			if trade.RealizedPnL > 0 {
				winners++
			}
		}
	}
	winRate := 0.0
	if closedTrades > 0 {
		winRate = float64(winners) / float64(closedTrades)
	}

	return Result{
		Strategy:        strategy,
		InitialCash:     initialCash,
		FinalEquity:     finalEquity,
		TotalReturn:     totalReturn,
		BenchmarkReturn: bars[len(bars)-1].Close/bars[0].Close - 1,
		CAGR:            growth,
		MaxDrawdown:     maximumDrawdown,
		Volatility:      annualizedVolatility(equity),
		Sharpe:          sharpe,
		Calmar:          calmar,
		WinRate:         winRate,
		ClosedTrades:    closedTrades,
		TotalFees:       totalFees,
		Turnover:        grossTurnover / initialCash,
		Halted:          halted,
		Trades:          trades,
		Equity:          equity,
	}
}

func dailyReturns(points []EquityPoint) []float64 {
	returns := make([]float64, 0, len(points)-1)
	for index := 1; index < len(points); index++ {
		previous := points[index-1].Equity
		if previous > 0 {
			returns = append(returns, points[index].Equity/previous-1)
		}
	}
	return returns
}

func meanAndSampleStdDev(values []float64) (float64, float64) {
	if len(values) == 0 {
		return 0, 0
	}
	var mean float64
	for _, value := range values {
		mean += value
	}
	mean /= float64(len(values))
	if len(values) < 2 {
		return mean, 0
	}

	var sumSquared float64
	for _, value := range values {
		difference := value - mean
		sumSquared += difference * difference
	}
	return mean, math.Sqrt(sumSquared / float64(len(values)-1))
}

func annualizedVolatility(points []EquityPoint) float64 {
	_, standardDeviation := meanAndSampleStdDev(dailyReturns(points))
	return standardDeviation * math.Sqrt(252)
}

func annualizedGrowth(initial, final float64, start, end time.Time) float64 {
	if initial <= 0 || final <= 0 || !end.After(start) {
		return 0
	}
	years := end.Sub(start).Hours() / 24 / 365.25
	if years <= 0 {
		return 0
	}
	return math.Pow(final/initial, 1/years) - 1
}
