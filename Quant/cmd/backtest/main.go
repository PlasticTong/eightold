package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/PlasticTong/eightold/Quant/pkg/backtest"
)

func main() {
	csvPath := flag.String("csv", "examples/data/synthetic.csv", "OHLCV CSV file")
	fast := flag.Int("fast", 3, "fast SMA period")
	slow := flag.Int("slow", 7, "slow SMA period")
	cash := flag.Float64("cash", 10000, "initial cash")
	commission := flag.Float64("commission", 0.001, "one-way commission rate")
	slippage := flag.Float64("slippage", 0.0005, "one-way slippage rate")
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

	result, err := backtest.RunSMACross(bars, backtest.Config{
		InitialCash: *cash,
		FastPeriod:  *fast,
		SlowPeriod:  *slow,
		Commission:  *commission,
		Slippage:    *slippage,
	})
	if err != nil {
		log.Fatalf("回测失败：%v", err)
	}

	fmt.Println("Go 双均线离线回测")
	fmt.Println("=================")
	fmt.Printf("行情区间：%s 至 %s（%d 根 K 线）\n",
		bars[0].Date.Format("2006-01-02"),
		bars[len(bars)-1].Date.Format("2006-01-02"),
		len(bars),
	)
	fmt.Printf("均线参数：fast=%d slow=%d\n", *fast, *slow)
	fmt.Printf("初始资金：%.2f\n", result.InitialCash)
	fmt.Printf("最终权益：%.2f\n", result.FinalEquity)
	fmt.Printf("总收益率：%.2f%%\n", result.TotalReturn*100)
	fmt.Printf("最大回撤：%.2f%%\n", result.MaxDrawdown*100)
	fmt.Printf("年化 Sharpe：%.2f\n", result.Sharpe)
	fmt.Printf("成交次数：%d\n", len(result.Trades))

	if len(result.Trades) == 0 {
		fmt.Println("当前参数没有产生交叉成交。")
		return
	}

	fmt.Println("\n成交记录")
	for _, trade := range result.Trades {
		fmt.Printf("%s %-4s 价格=%8.4f 数量=%8.4f 手续费=%6.2f\n",
			trade.Date.Format("2006-01-02"),
			trade.Side,
			trade.Price,
			trade.Qty,
			trade.Fee,
		)
	}
}
