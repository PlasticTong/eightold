package backtest

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"math"
	"strconv"
	"strings"
	"time"
)

// Bar is one OHLCV candle. The teaching engine currently expects daily bars.
type Bar struct {
	Date   time.Time
	Open   float64
	High   float64
	Low    float64
	Close  float64
	Volume float64
}

// Config controls the assumptions used by the SMA crossover backtest.
type Config struct {
	InitialCash float64
	FastPeriod  int
	SlowPeriod  int
	Commission  float64
	Slippage    float64
}

// Trade is one simulated fill.
type Trade struct {
	Date  time.Time
	Side  string
	Price float64
	Qty   float64
	Fee   float64
}

// EquityPoint records marked-to-market account equity at a daily close.
type EquityPoint struct {
	Date   time.Time
	Equity float64
}

// Result contains the key teaching metrics and the simulated fills.
type Result struct {
	InitialCash float64
	FinalEquity float64
	TotalReturn float64
	MaxDrawdown float64
	Sharpe      float64
	Trades      []Trade
	Equity      []EquityPoint
}

// LoadCSV reads date,open,high,low,close,volume columns.
func LoadCSV(reader io.Reader) ([]Bar, error) {
	csvReader := csv.NewReader(reader)
	csvReader.TrimLeadingSpace = true
	csvReader.FieldsPerRecord = -1

	header, err := csvReader.Read()
	if err != nil {
		return nil, fmt.Errorf("read CSV header: %w", err)
	}

	columns := make(map[string]int, len(header))
	for index, name := range header {
		columns[strings.ToLower(strings.TrimSpace(name))] = index
	}

	required := []string{"date", "open", "high", "low", "close", "volume"}
	for _, name := range required {
		if _, ok := columns[name]; !ok {
			return nil, fmt.Errorf("CSV missing required column %q", name)
		}
	}

	var bars []Bar
	line := 1
	for {
		line++
		record, readErr := csvReader.Read()
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return nil, fmt.Errorf("read CSV line %d: %w", line, readErr)
		}

		value := func(name string) (string, error) {
			index := columns[name]
			if index >= len(record) {
				return "", fmt.Errorf("line %d has no %s value", line, name)
			}
			return strings.TrimSpace(record[index]), nil
		}

		dateText, err := value("date")
		if err != nil {
			return nil, err
		}
		date, err := time.Parse("2006-01-02", dateText)
		if err != nil {
			return nil, fmt.Errorf("line %d invalid date: %w", line, err)
		}

		parseNumber := func(name string) (float64, error) {
			text, fieldErr := value(name)
			if fieldErr != nil {
				return 0, fieldErr
			}
			number, parseErr := strconv.ParseFloat(text, 64)
			if parseErr != nil {
				return 0, fmt.Errorf("line %d invalid %s: %w", line, name, parseErr)
			}
			return number, nil
		}

		open, err := parseNumber("open")
		if err != nil {
			return nil, err
		}
		high, err := parseNumber("high")
		if err != nil {
			return nil, err
		}
		low, err := parseNumber("low")
		if err != nil {
			return nil, err
		}
		closePrice, err := parseNumber("close")
		if err != nil {
			return nil, err
		}
		volume, err := parseNumber("volume")
		if err != nil {
			return nil, err
		}

		if open <= 0 || high <= 0 || low <= 0 || closePrice <= 0 {
			return nil, fmt.Errorf("line %d prices must be positive", line)
		}
		if high < math.Max(open, closePrice) || low > math.Min(open, closePrice) || high < low {
			return nil, fmt.Errorf("line %d has inconsistent OHLC values", line)
		}
		if volume < 0 {
			return nil, fmt.Errorf("line %d volume cannot be negative", line)
		}
		if len(bars) > 0 && !date.After(bars[len(bars)-1].Date) {
			return nil, fmt.Errorf("line %d date must be later than the previous row", line)
		}

		bars = append(bars, Bar{
			Date: date, Open: open, High: high, Low: low, Close: closePrice, Volume: volume,
		})
	}

	if len(bars) == 0 {
		return nil, errors.New("CSV contains no price rows")
	}
	return bars, nil
}

// SMA returns a series with NaN values before a complete window is available.
func SMA(values []float64, period int) ([]float64, error) {
	if period <= 0 {
		return nil, errors.New("SMA period must be positive")
	}

	result := make([]float64, len(values))
	for index := range result {
		result[index] = math.NaN()
	}

	var windowSum float64
	for index, value := range values {
		windowSum += value
		if index >= period {
			windowSum -= values[index-period]
		}
		if index >= period-1 {
			result[index] = windowSum / float64(period)
		}
	}
	return result, nil
}

// RunSMACross executes signals at the next bar's open to avoid look-ahead.
func RunSMACross(bars []Bar, config Config) (Result, error) {
	if err := validateConfig(bars, config); err != nil {
		return Result{}, err
	}

	closes := make([]float64, len(bars))
	for index, bar := range bars {
		closes[index] = bar.Close
	}
	fast, _ := SMA(closes, config.FastPeriod)
	slow, _ := SMA(closes, config.SlowPeriod)

	cash := config.InitialCash
	var quantity float64
	var pending string
	trades := make([]Trade, 0)
	equity := make([]EquityPoint, 0, len(bars))

	for index, bar := range bars {
		switch pending {
		case "BUY":
			if quantity == 0 {
				price := bar.Open * (1 + config.Slippage)
				quantity = cash / (price * (1 + config.Commission))
				gross := quantity * price
				fee := gross * config.Commission
				cash -= gross + fee
				if math.Abs(cash) < 1e-9 {
					cash = 0
				}
				trades = append(trades, Trade{
					Date: bar.Date, Side: "BUY", Price: price, Qty: quantity, Fee: fee,
				})
			}
		case "SELL":
			if quantity > 0 {
				price := bar.Open * (1 - config.Slippage)
				gross := quantity * price
				fee := gross * config.Commission
				cash += gross - fee
				trades = append(trades, Trade{
					Date: bar.Date, Side: "SELL", Price: price, Qty: quantity, Fee: fee,
				})
				quantity = 0
			}
		}
		pending = ""

		currentEquity := cash + quantity*bar.Close
		equity = append(equity, EquityPoint{Date: bar.Date, Equity: currentEquity})

		if index == 0 || math.IsNaN(fast[index]) || math.IsNaN(slow[index]) ||
			math.IsNaN(fast[index-1]) || math.IsNaN(slow[index-1]) {
			continue
		}

		crossedUp := fast[index-1] <= slow[index-1] && fast[index] > slow[index]
		crossedDown := fast[index-1] >= slow[index-1] && fast[index] < slow[index]
		if crossedUp && quantity == 0 {
			pending = "BUY"
		} else if crossedDown && quantity > 0 {
			pending = "SELL"
		}
	}

	finalEquity := equity[len(equity)-1].Equity
	return Result{
		InitialCash: config.InitialCash,
		FinalEquity: finalEquity,
		TotalReturn: finalEquity/config.InitialCash - 1,
		MaxDrawdown: maxDrawdown(equity),
		Sharpe:      annualizedSharpe(equity),
		Trades:      trades,
		Equity:      equity,
	}, nil
}

func validateConfig(bars []Bar, config Config) error {
	if config.InitialCash <= 0 {
		return errors.New("initial cash must be positive")
	}
	if config.FastPeriod <= 0 || config.SlowPeriod <= 0 || config.FastPeriod >= config.SlowPeriod {
		return errors.New("periods must satisfy 0 < fast < slow")
	}
	if len(bars) <= config.SlowPeriod {
		return errors.New("not enough bars for the selected slow period")
	}
	if config.Commission < 0 || config.Commission >= 1 {
		return errors.New("commission must be in [0, 1)")
	}
	if config.Slippage < 0 || config.Slippage >= 1 {
		return errors.New("slippage must be in [0, 1)")
	}
	return nil
}

func maxDrawdown(points []EquityPoint) float64 {
	if len(points) == 0 {
		return 0
	}
	peak := points[0].Equity
	var maximum float64
	for _, point := range points {
		if point.Equity > peak {
			peak = point.Equity
		}
		if peak <= 0 {
			continue
		}
		drawdown := (peak - point.Equity) / peak
		if drawdown > maximum {
			maximum = drawdown
		}
	}
	return maximum
}

func annualizedSharpe(points []EquityPoint) float64 {
	if len(points) < 3 {
		return 0
	}
	returns := make([]float64, 0, len(points)-1)
	for index := 1; index < len(points); index++ {
		previous := points[index-1].Equity
		if previous > 0 {
			returns = append(returns, points[index].Equity/previous-1)
		}
	}
	if len(returns) < 2 {
		return 0
	}

	var mean float64
	for _, value := range returns {
		mean += value
	}
	mean /= float64(len(returns))

	var variance float64
	for _, value := range returns {
		difference := value - mean
		variance += difference * difference
	}
	variance /= float64(len(returns) - 1)
	if variance == 0 {
		return 0
	}
	return mean / math.Sqrt(variance) * math.Sqrt(252)
}
