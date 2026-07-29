package backtest

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

type targetStrategy struct {
	targets []float64
}

func (strategy targetStrategy) Name() string {
	return "test-targets"
}

func (strategy targetStrategy) Prepare(bars []Bar) error {
	return nil
}

func (strategy targetStrategy) Target(index int) (float64, string) {
	if index >= len(strategy.targets) {
		return strategy.targets[len(strategy.targets)-1], "hold target"
	}
	return strategy.targets[index], "test target"
}

func TestRunExecutesNextOpenAndRespectsPositionLimit(t *testing.T) {
	bars := testBars([]float64{100, 100, 101}, []float64{100, 100, 101})
	result, err := Run(bars, targetStrategy{targets: []float64{1, 1, 1}}, EngineConfig{
		InitialCash:    1000,
		MaxPositionPct: 0.5,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Trades) != 1 {
		t.Fatalf("got %d trades, want 1", len(result.Trades))
	}
	trade := result.Trades[0]
	if !trade.Date.Equal(bars[1].Date) {
		t.Fatalf("trade date = %s, want next bar %s", trade.Date, bars[1].Date)
	}
	if trade.Qty != 5 {
		t.Fatalf("quantity = %.4f, want 5", trade.Qty)
	}
	if result.Equity[1].Cash != 500 {
		t.Fatalf("cash = %.2f, want 500", result.Equity[1].Cash)
	}
}

func TestRunStopLossExitsAndWaitsForStrategyReset(t *testing.T) {
	bars := testBars(
		[]float64{100, 100, 80, 82, 84},
		[]float64{100, 90, 81, 83, 85},
	)
	result, err := Run(bars, targetStrategy{targets: []float64{1, 1, 1, 1, 1}}, EngineConfig{
		InitialCash:    1000,
		MaxPositionPct: 1,
		StopLossPct:    0.05,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Trades) != 2 {
		t.Fatalf("got %d trades, want buy and stop-loss sell: %+v", len(result.Trades), result.Trades)
	}
	exit := result.Trades[1]
	if exit.Side != "SELL" || exit.Reason != "stop loss" {
		t.Fatalf("unexpected exit: %+v", exit)
	}
	if !exit.Date.Equal(bars[2].Date) {
		t.Fatalf("stop exit date = %s, want %s", exit.Date, bars[2].Date)
	}
}

func TestRunMaximumDrawdownHaltsNewTrades(t *testing.T) {
	bars := testBars(
		[]float64{100, 100, 85, 120, 130},
		[]float64{100, 90, 85, 120, 130},
	)
	result, err := Run(bars, targetStrategy{targets: []float64{1, 1, 1, 1, 1}}, EngineConfig{
		InitialCash:    1000,
		MaxPositionPct: 1,
		MaxDrawdownPct: 0.05,
	})
	if err != nil {
		t.Fatal(err)
	}
	if !result.Halted {
		t.Fatal("expected maximum drawdown circuit breaker")
	}
	if len(result.Trades) != 2 || result.Trades[1].Reason != "maximum drawdown circuit breaker" {
		t.Fatalf("unexpected trades after circuit breaker: %+v", result.Trades)
	}
}

func TestRunRejectsInvalidStrategyTarget(t *testing.T) {
	_, err := Run(
		testBars([]float64{10, 10}, []float64{10, 10}),
		targetStrategy{targets: []float64{1.2}},
		EngineConfig{InitialCash: 1000, MaxPositionPct: 1},
	)
	if err == nil || !strings.Contains(err.Error(), "must be in [0, 1]") {
		t.Fatalf("expected invalid target error, got %v", err)
	}
}

func TestWriteReports(t *testing.T) {
	result := Result{
		Strategy: "test",
		Trades: []Trade{{
			Date: time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
			Side: "BUY", Price: 10, Qty: 2, GrossValue: 20, Reason: "test",
		}},
		Equity: []EquityPoint{{
			Date:   time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC),
			Equity: 1000, Cash: 980, Position: 2,
		}},
	}
	directory := t.TempDir()
	if err := WriteReports(directory, result); err != nil {
		t.Fatal(err)
	}

	for _, name := range []string{"summary.json", "trades.csv", "equity.csv"} {
		path := filepath.Join(directory, name)
		content, err := os.ReadFile(path)
		if err != nil {
			t.Fatalf("read %s: %v", name, err)
		}
		if len(content) == 0 {
			t.Fatalf("%s is empty", name)
		}
	}
}

func testBars(opens, closes []float64) []Bar {
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	bars := make([]Bar, len(opens))
	for index := range opens {
		high := maxFloat(opens[index], closes[index]) + 1
		low := minFloat(opens[index], closes[index]) - 1
		bars[index] = Bar{
			Date:   start.AddDate(0, 0, index),
			Open:   opens[index],
			High:   high,
			Low:    low,
			Close:  closes[index],
			Volume: 1000,
		}
	}
	return bars
}

func minFloat(left, right float64) float64 {
	if left < right {
		return left
	}
	return right
}
