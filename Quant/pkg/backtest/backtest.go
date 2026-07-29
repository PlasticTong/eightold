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
	Date        time.Time `json:"date"`
	Side        string    `json:"side"`
	Price       float64   `json:"price"`
	Qty         float64   `json:"quantity"`
	Fee         float64   `json:"fee"`
	GrossValue  float64   `json:"gross_value"`
	RealizedPnL float64   `json:"realized_pnl"`
	Reason      string    `json:"reason"`
	Closed      bool      `json:"closed_position"`
}

// EquityPoint records marked-to-market account equity at a daily close.
type EquityPoint struct {
	Date     time.Time `json:"date"`
	Equity   float64   `json:"equity"`
	Cash     float64   `json:"cash"`
	Position float64   `json:"position"`
	Drawdown float64   `json:"drawdown"`
}

// Result contains the key teaching metrics and the simulated fills.
type Result struct {
	Strategy        string        `json:"strategy"`
	InitialCash     float64       `json:"initial_cash"`
	FinalEquity     float64       `json:"final_equity"`
	TotalReturn     float64       `json:"total_return"`
	BenchmarkReturn float64       `json:"benchmark_return"`
	CAGR            float64       `json:"cagr"`
	MaxDrawdown     float64       `json:"max_drawdown"`
	Volatility      float64       `json:"annualized_volatility"`
	Sharpe          float64       `json:"sharpe"`
	Calmar          float64       `json:"calmar"`
	WinRate         float64       `json:"win_rate"`
	ClosedTrades    int           `json:"closed_trades"`
	TotalFees       float64       `json:"total_fees"`
	Turnover        float64       `json:"turnover"`
	Halted          bool          `json:"risk_halted"`
	Trades          []Trade       `json:"trades,omitempty"`
	Equity          []EquityPoint `json:"equity,omitempty"`
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
	strategy := &SMACrossStrategy{
		FastPeriod: config.FastPeriod,
		SlowPeriod: config.SlowPeriod,
	}
	return Run(bars, strategy, EngineConfig{
		InitialCash:    config.InitialCash,
		CommissionRate: config.Commission,
		SlippageRate:   config.Slippage,
		MaxPositionPct: 1,
	})
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
