# Go 量化系统运行示例

该示例使用 `examples/data/synthetic.csv` 中自行构造的行情，不需要联网，也不依赖第三方库。双均线策略和动量策略共用同一套撮合、账户、风控及报告模块。

## 运行

```bash
cd Quant
go run ./cmd/backtest \
  -strategy sma \
  -csv examples/data/synthetic.csv \
  -fast 3 \
  -slow 7 \
  -cash 10000 \
  -commission 0.001 \
  -slippage 0.0005 \
  -max-position 0.8 \
  -stop-loss 0.08 \
  -max-drawdown 0.20 \
  -out reports/sma
```

参数含义：

| 参数 | 含义 |
|---|---|
| `strategy` | `sma`、`momentum` 或 `buy-hold` |
| `fast` / `slow` | 快慢均线周期 |
| `cash` | 初始资金 |
| `commission` | 单边手续费率 |
| `slippage` | 单边滑点率 |
| `max-position` | 持仓市值占权益的上限 |
| `stop-loss` | 单次持仓止损比例，`0` 表示关闭 |
| `max-drawdown` | 组合回撤熔断比例，`0` 表示关闭 |
| `out` | JSON/CSV 报告目录 |

策略使用第 `T` 天收盘数据计算交叉，在第 `T+1` 天开盘成交。这样不会假装自己能提前知道当天最终收盘价。

指定 `-out` 后会生成：

- `summary.json`：绩效摘要；
- `trades.csv`：成交价格、费用、原因和已实现盈亏；
- `equity.csv`：每日权益、现金、持仓和回撤。

切换为动量策略：

```bash
go run ./cmd/backtest \
  -strategy momentum \
  -lookback 10 \
  -threshold 0.02 \
  -out reports/momentum
```

示例只允许持有一个多头仓位。最终权益按最后一个交易日收盘价进行市值计算。

## 实验建议

1. 先把手续费和滑点改成 `0`，记录收益；
2. 恢复真实成本，观察差异；
3. 修改 `max-position`、`stop-loss` 和 `max-drawdown`，观察风险与收益的变化；
4. 比较 `sma`、`momentum` 和 `buy-hold`，不要只看收益率；
5. 尝试多组参数，但不要用同一份数据既选参数又报告成绩；
6. 修改行情，使价格长期震荡，观察趋势策略为什么容易反复亏损。
