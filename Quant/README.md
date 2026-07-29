# Quant 量化交易实验室

这是一个独立的量化交易学习模块，不属于 `Go/`、`CS-Base/` 或 AI 目录。

本模块只做教学和离线回测：

- 不连接真实交易账户；
- 不提供买卖建议；
- 示例行情为自行构造的数据；
- 示例代码为本仓库原创实现，不复制第三方量化框架源码。

## 学习路线

1. [量化基础：数据、收益与交易对象](/quant/docs/01-basics.md)
2. [回测系统：信号如何变成成交](/quant/docs/02-backtest.md)
3. [经典策略：趋势、动量与均值回归](/quant/docs/03-strategies.md)
4. [风险控制：先考虑怎么不亏光](/quant/docs/04-risk.md)
5. [开源项目与数据源清单](/quant/docs/05-resources.md)
6. [运行 Go 双均线回测](/quant/examples/sma-cross/README.md)

## 第一个可运行实验

进入仓库根目录后执行：

```bash
cd Quant
go run ./cmd/backtest \
  -csv examples/data/synthetic.csv \
  -fast 3 \
  -slow 7
```

运行测试：

```bash
cd Quant
go test ./...
```

程序会输出：

- 初始资金与最终权益；
- 总收益率；
- 最大回撤；
- 年化 Sharpe；
- 买卖记录；
- 手续费和滑点造成的成本。

## 代码结构

```text
Quant/
├── cmd/backtest/          命令行入口
├── pkg/backtest/          CSV、指标、撮合与绩效计算
├── examples/              自制行情和运行案例
├── docs/                  学习文档
├── DISCLAIMER.md          风险与合规边界
└── THIRD_PARTY_NOTICES.md 参考项目及许可证
```

当前版本刻意保持简单：单标的、日线、只做多、全仓或空仓。先把时间顺序和成交假设做对，再扩展多标的、仓位管理和模拟交易。

> 开始前请先阅读 [风险声明](/quant/DISCLAIMER.md)。开源项目仅作延伸阅读，见 [第三方说明](/quant/THIRD_PARTY_NOTICES.md)。
