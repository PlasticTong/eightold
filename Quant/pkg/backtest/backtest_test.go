package backtest

import (
	"math"
	"strings"
	"testing"
	"time"
)

func TestSMA(t *testing.T) {
	values := []float64{1, 2, 3, 4, 5}
	result, err := SMA(values, 3)
	if err != nil {
		t.Fatal(err)
	}
	if !math.IsNaN(result[0]) || !math.IsNaN(result[1]) {
		t.Fatalf("warm-up values should be NaN: %v", result)
	}
	want := []float64{2, 3, 4}
	for index, expected := range want {
		if result[index+2] != expected {
			t.Fatalf("result[%d] = %v, want %v", index+2, result[index+2], expected)
		}
	}
}

func TestLoadCSVRejectsUnsortedDates(t *testing.T) {
	input := `date,open,high,low,close,volume
2026-01-02,10,11,9,10,100
2026-01-01,10,11,9,10,100
`
	_, err := LoadCSV(strings.NewReader(input))
	if err == nil || !strings.Contains(err.Error(), "later than") {
		t.Fatalf("expected date ordering error, got %v", err)
	}
}

func TestRunSMACrossExecutesAtNextOpen(t *testing.T) {
	closes := []float64{10, 9, 8, 9, 10, 11, 10, 9, 8}
	start := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	bars := make([]Bar, len(closes))
	for index, closePrice := range closes {
		bars[index] = Bar{
			Date:   start.AddDate(0, 0, index),
			Open:   closePrice,
			High:   closePrice + 1,
			Low:    closePrice - 1,
			Close:  closePrice,
			Volume: 1000,
		}
	}

	result, err := RunSMACross(bars, Config{
		InitialCash: 1000,
		FastPeriod:  2,
		SlowPeriod:  3,
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(result.Trades) != 2 {
		t.Fatalf("got %d trades, want 2: %+v", len(result.Trades), result.Trades)
	}
	if got, want := result.Trades[0].Date, bars[5].Date; !got.Equal(want) {
		t.Fatalf("buy date = %s, want next open %s", got, want)
	}
	if got, want := result.Trades[1].Date, bars[8].Date; !got.Equal(want) {
		t.Fatalf("sell date = %s, want next open %s", got, want)
	}
	if result.Trades[0].Side != "BUY" || result.Trades[1].Side != "SELL" {
		t.Fatalf("unexpected trade sides: %+v", result.Trades)
	}
}

func TestRunSMACrossValidatesPeriods(t *testing.T) {
	bars := make([]Bar, 10)
	_, err := RunSMACross(bars, Config{
		InitialCash: 1000,
		FastPeriod:  5,
		SlowPeriod:  5,
	})
	if err == nil {
		t.Fatal("expected invalid period error")
	}
}
