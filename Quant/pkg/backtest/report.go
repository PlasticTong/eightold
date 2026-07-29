package backtest

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

// WriteReports writes a machine-readable summary plus trades and equity CSVs.
func WriteReports(directory string, result Result) error {
	if directory == "" {
		return fmt.Errorf("report directory cannot be empty")
	}
	if err := os.MkdirAll(directory, 0o755); err != nil {
		return fmt.Errorf("create report directory: %w", err)
	}

	summary := result
	summary.Trades = nil
	summary.Equity = nil
	if err := writeJSON(filepath.Join(directory, "summary.json"), summary); err != nil {
		return err
	}
	if err := writeTrades(filepath.Join(directory, "trades.csv"), result.Trades); err != nil {
		return err
	}
	if err := writeEquity(filepath.Join(directory, "equity.csv"), result.Equity); err != nil {
		return err
	}
	return nil
}

func writeJSON(path string, value any) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create %s: %w", filepath.Base(path), err)
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(value); err != nil {
		return fmt.Errorf("write %s: %w", filepath.Base(path), err)
	}
	return nil
}

func writeTrades(path string, trades []Trade) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create trades.csv: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	if err := writer.Write([]string{
		"date", "side", "price", "quantity", "fee", "gross_value", "realized_pnl", "closed_position", "reason",
	}); err != nil {
		return fmt.Errorf("write trades.csv header: %w", err)
	}
	for _, trade := range trades {
		if err := writer.Write([]string{
			trade.Date.Format("2006-01-02"),
			trade.Side,
			formatFloat(trade.Price),
			formatFloat(trade.Qty),
			formatFloat(trade.Fee),
			formatFloat(trade.GrossValue),
			formatFloat(trade.RealizedPnL),
			strconv.FormatBool(trade.Closed),
			trade.Reason,
		}); err != nil {
			return fmt.Errorf("write trades.csv: %w", err)
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return fmt.Errorf("flush trades.csv: %w", err)
	}
	return nil
}

func writeEquity(path string, points []EquityPoint) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("create equity.csv: %w", err)
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	if err := writer.Write([]string{"date", "equity", "cash", "position", "drawdown"}); err != nil {
		return fmt.Errorf("write equity.csv header: %w", err)
	}
	for _, point := range points {
		if err := writer.Write([]string{
			point.Date.Format("2006-01-02"),
			formatFloat(point.Equity),
			formatFloat(point.Cash),
			formatFloat(point.Position),
			formatFloat(point.Drawdown),
		}); err != nil {
			return fmt.Errorf("write equity.csv: %w", err)
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return fmt.Errorf("flush equity.csv: %w", err)
	}
	return nil
}

func formatFloat(value float64) string {
	return strconv.FormatFloat(value, 'f', 8, 64)
}
