# Quant 量化交易实验室

这是一个独立的 Go 量化研究与回测系统，不属于 `Go/`、`CS-Base/` 或 AI 目录。

当前版本是可以运行、测试和扩展的离线 MVP：

- 不连接真实交易账户；
- 不提供买卖建议；
- 示例行情为自行构造的数据；
- 示例代码为本仓库原创实现，不复制第三方量化框架源码。
- 策略信号在收盘后产生，统一在下一根 K 线开盘撮合；
- 内置交易成本、仓位限制、止损/止盈和最大回撤熔断；
- 可以导出 JSON 摘要、成交 CSV 和权益曲线 CSV。

## 学习路线

1. [量化基础：数据、收益与交易对象](/quant/docs/01-basics.md)
2. [回测系统：信号如何变成成交](/quant/docs/02-backtest.md)
3. [经典策略：趋势、动量与均值回归](/quant/docs/03-strategies.md)
4. [风险控制：先考虑怎么不亏光](/quant/docs/04-risk.md)
5. [开源项目与数据源清单](/quant/docs/05-resources.md)
6. [量化系统架构与扩展方法](/quant/docs/06-system.md)
7. [运行 Go 量化系统](/quant/examples/sma-cross/README.md)

## 第一个可运行实验

进入仓库根目录后执行：

```bash
cd Quant
go run ./cmd/backtest \
  -strategy sma \
  -csv examples/data/synthetic.csv \
  -fast 3 \
  -slow 7 \
  -max-position 0.8 \
  -stop-loss 0.08 \
  -max-drawdown 0.20 \
  -out reports/sma
```

运行测试：

```bash
cd Quant
go test ./...
```

程序会输出：

- 初始资金与最终权益；
- 总收益率；
- 年化收益、波动率和 Calmar；
- 买入持有基准收益；
- 最大回撤；
- 年化 Sharpe；
- 已平仓胜率、换手率和累计手续费；
- 买卖记录；
- 是否触发最大回撤熔断。

指定 `-out` 后还会生成：

```text
reports/sma/
├── summary.json   绩效摘要
├── trades.csv     成交与已实现盈亏
└── equity.csv     每日权益、现金、持仓和回撤
```

## 内置策略

```bash
# 双均线
go run ./cmd/backtest -strategy sma -fast 3 -slow 7

# N 日动量
go run ./cmd/backtest -strategy momentum -lookback 10 -threshold 0.02

# 买入持有基线
go run ./cmd/backtest -strategy buy-hold
```

所有策略都使用同一套撮合、成本、账户、风控和报告逻辑，便于做公平比较。

## 代码结构

```text
Quant/
├── cmd/backtest/             命令行入口与参数
├── pkg/backtest/
│   ├── backtest.go           行情 CSV、指标与兼容入口
│   ├── strategy.go           策略接口、双均线、动量和基线
│   ├── engine.go             次日开盘撮合、账户与风险控制
│   ├── metrics.go            收益、回撤、波动率与绩效
│   └── report.go             JSON/CSV 报告
├── examples/                 自制行情和运行案例
├── docs/                     学习文档
├── DISCLAIMER.md             风险与合规边界
└── THIRD_PARTY_NOTICES.md    参考项目及许可证
```

当前版本仍刻意保持边界清晰：单标的、日线、只做多、目标仓位模型。先把时间顺序、成本、风控和报告做对，再扩展多标的、组合优化和模拟交易。

> 开始前请先阅读 [风险声明](/quant/DISCLAIMER.md)。开源项目仅作延伸阅读，见 [第三方说明](/quant/THIRD_PARTY_NOTICES.md)。
