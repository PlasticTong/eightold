# 量化系统架构与扩展方法

当前系统是一个单标的、只做多、基于日线 OHLCV 的事件驱动回测器。它的重点是把策略、交易执行和风险控制拆开。

## 数据流

```text
OHLCV CSV
    │
    ▼
数据校验 LoadCSV
    │
    ▼
策略 Strategy.Target
    │  第 T 根 K 线收盘产生目标仓位
    ▼
待执行订单 pendingOrder
    │  第 T+1 根 K 线开盘
    ▼
撮合与成本 rebalanceAtOpen
    │  滑点 / 手续费 / 最低佣金 / 整数手
    ▼
账户 account
    │  现金 / 数量 / 成本 / 权益
    ▼
风险控制
    │  止损 / 止盈 / 最大回撤熔断
    ▼
绩效与报告
       JSON 摘要 / 成交 CSV / 权益 CSV
```

## 关键接口

策略只需要实现三个方法：

```go
type Strategy interface {
    Name() string
    Prepare([]Bar) error
    Target(index int) (target float64, reason string)
}
```

- `Prepare`：只用历史行情预计算指标；
- `Target`：返回 `0` 到 `1` 的目标暴露；
- `reason`：写入成交记录，方便解释为什么交易。

例如，目标 `0.5` 表示策略希望使用一半允许的仓位。若 `MaxPositionPct=0.8`，实际持仓上限就是账户权益的 `40%`。

## 为什么使用目标仓位

“买入/卖出”命令容易让策略和账户状态耦合。目标仓位表达的是策略最终想要什么：

```text
0.0  空仓
0.5  使用一半允许仓位
1.0  使用全部允许仓位
```

引擎根据当前现金、持仓和价格计算差额，因此以后可以扩展分批建仓、组合权重和定期再平衡。

## 时间顺序

引擎每根 K 线严格执行：

1. 开盘执行上一根 K 线收盘产生的目标；
2. 收盘按市价计算账户权益；
3. 检查止损、止盈和最大回撤；
4. 策略读取当前及以前的数据，产生下一目标。

这能避免最常见的前视偏差：用当日收盘数据产生信号，却假设自己已经以同一个收盘价成交。

## 新增自己的策略

在 `pkg/backtest/strategy.go` 中新增类型并实现 `Strategy`：

```go
type MyStrategy struct {
    closes []float64
}

func (strategy *MyStrategy) Name() string {
    return "my-strategy"
}

func (strategy *MyStrategy) Prepare(bars []Bar) error {
    strategy.closes = make([]float64, len(bars))
    for index, bar := range bars {
        strategy.closes[index] = bar.Close
    }
    return nil
}

func (strategy *MyStrategy) Target(index int) (float64, string) {
    if index < 20 {
        return 0, "warm-up"
    }
    if strategy.closes[index] > strategy.closes[index-20] {
        return 1, "20-bar trend is positive"
    }
    return 0, "20-bar trend is not positive"
}
```

然后在 `cmd/backtest/main.go` 的策略选择中注册它，并为边界条件和下一根 K 线成交补测试。

## 目前不做什么

- 不连接券商、交易所或任何实盘 API；
- 不保存密钥和账户信息；
- 不模拟涨跌停、停牌、订单簿和部分成交；
- 不处理多标的资金竞争；
- 不声称历史结果可以预测未来。

如果继续升级，合理顺序是：多标的数据对齐 → 组合仓位 → 更真实的成交模型 → walk-forward → 模拟盘。实盘连接应当是最后一步，并且需要独立风控、对账、监控和人工停机机制。
