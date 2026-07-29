package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/PlasticTong/eightold/Quant/pkg/backtest"
)

func main() {
	csvPath := flag.String("csv", "examples/data/synthetic.csv", "OHLCV CSV file")
	strategyName := flag.String("strategy", "sma", "strategy: sma, momentum, buy-hold")
	fast := flag.Int("fast", 3, "fast SMA period")
	slow := flag.Int("slow", 7, "slow SMA period")
	lookback := flag.Int("lookback", 10, "momentum lookback bars")
	threshold := flag.Float64("threshold", 0.02, "momentum return threshold")
	cash := flag.Float64("cash", 10000, "initial cash")
	commission := flag.Float64("commission", 0.001, "one-way commission rate")
	minimumCommission := flag.Float64("minimum-commission", 0, "minimum commission per fill")
	slippage := flag.Float64("slippage", 0.0005, "one-way slippage rate")
	maxPosition := flag.Float64("max-position", 0.8, "maximum position as account equity fraction")
	lotSize := flag.Float64("lot-size", 0, "quantity lot size; 0 allows fractional quantity")
	stopLoss := flag.Float64("stop-loss", 0.08, "exit after this loss; 0 disables")
	takeProfit := flag.Float64("take-profit", 0, "exit after this gain; 0 disables")
	maxDrawdown := flag.Float64("max-drawdown", 0.20, "portfolio circuit breaker; 0 disables")
	outputDirectory := flag.String("out", "", "optional report directory")
	flag.Parse()

	file, err := os.Open(*csvPath)
	if err != nil {
		log.Fatalf("打开行情文件失败：%v", err)
	}
	defer file.Close()

	bars, err := backtest.LoadCSV(file)
	if err != nil {
		log.Fatalf("读取行情失败：%v", err)
	}

	var strategy backtest.Strategy
	switch strings.ToLower(strings.TrimSpace(*strategyName)) {
	case "sma", "sma-cross":
		strategy = &backtest.SMACrossStrategy{FastPeriod: *fast, SlowPeriod: *slow}
	case "momentum":
		strategy = &backtest.MomentumStrategy{Lookback: *lookback, Threshold: *threshold}
	case "buy-hold", "buy_and_hold":
		strategy = backtest.BuyAndHoldStrategy{}
	default:
		log.Fatalf("未知策略 %q，可选值：sma、momentum、buy-hold", *strategyName)
	}

	result, err := backtest.Run(bars, strategy, backtest.EngineConfig{
		InitialCash:       *cash,
		CommissionRate:    *commission,
		MinimumCommission: *minimumCommission,
		SlippageRate:      *slippage,
		MaxPositionPct:    *maxPosition,
		LotSize:           *lotSize,
		StopLossPct:       *stopLoss,
		TakeProfitPct:     *takeProfit,
		MaxDrawdownPct:    *maxDrawdown,
	})
	if err != nil {
		log.Fatalf("回测失败：%v", err)
	}

	fmt.Println("eightold Go 量化回测系统")
	fmt.Println("=======================")
	fmt.Printf("行情区间：%s 至 %s（%d 根 K 线）\n",
		bars[0].Date.Format("2006-01-02"),
		bars[len(bars)-1].Date.Format("2006-01-02"),
		len(bars),
	)
	if len(bars) < 252 {
		fmt.Println("提示：样本少于 252 根日线，年化收益、Sharpe 和 Calmar 仅供演示。")
	}
	fmt.Printf("策略：%s\n", result.Strategy)
	fmt.Printf("仓位上限：%.0f%%，止损：%.1f%%，组合熔断：%.1f%%\n",
		*maxPosition*100, *stopLoss*100, *maxDrawdown*100,
	)
	fmt.Printf("初始资金：%.2f\n", result.InitialCash)
	fmt.Printf("最终权益：%.2f\n", result.FinalEquity)
	fmt.Printf("总收益率：%.2f%%\n", result.TotalReturn*100)
	fmt.Printf("买入持有收益：%.2f%%\n", result.BenchmarkReturn*100)
	fmt.Printf("年化收益：%.2f%%\n", result.CAGR*100)
	fmt.Printf("年化波动率：%.2f%%\n", result.Volatility*100)
	fmt.Printf("最大回撤：%.2f%%\n", result.MaxDrawdown*100)
	fmt.Printf("年化 Sharpe：%.2f\n", result.Sharpe)
	fmt.Printf("Calmar：%.2f\n", result.Calmar)
	fmt.Printf("已平仓胜率：%.2f%%（%d 笔）\n", result.WinRate*100, result.ClosedTrades)
	fmt.Printf("累计手续费：%.2f，换手率：%.2f\n", result.TotalFees, result.Turnover)
	fmt.Printf("成交次数：%d\n", len(result.Trades))
	if result.Halted {
		fmt.Println("风险状态：已触发最大回撤熔断，后续不再开仓")
	}

	if *outputDirectory != "" {
		if err := backtest.WriteReports(*outputDirectory, result); err != nil {
			log.Fatalf("写出报告失败：%v", err)
		}
		fmt.Printf("报告目录：%s（summary.json、trades.csv、equity.csv）\n", *outputDirectory)
	}

	if len(result.Trades) == 0 {
		fmt.Println("当前参数没有产生成交。")
	} else {
		fmt.Println("\n成交记录")
		for _, trade := range result.Trades {
			fmt.Printf("%s %-4s 价格=%8.4f 数量=%8.4f 手续费=%6.2f 已实现盈亏=%8.2f 原因=%s\n",
				trade.Date.Format("2006-01-02"),
				trade.Side,
				trade.Price,
				trade.Qty,
				trade.Fee,
				trade.RealizedPnL,
				trade.Reason,
			)
		}
	}
}
