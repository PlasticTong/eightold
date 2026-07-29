# 开源项目与数据源清单

以下是截至 2026 年 7 月筛选出的学习入口。这里只提供链接和选型说明，不复制项目源码。

## 研究与回测

| 项目 | 适合方向 | 注意事项 |
|---|---|---|
| [Backtesting.py](https://github.com/kernc/backtesting.py) | 第一次事件回测 | API 简洁；AGPL-3.0 |
| [Microsoft Qlib](https://github.com/microsoft/qlib) | 因子、机器学习、组合研究 | MIT；数据准备成本较高 |
| [QuantConnect LEAN](https://github.com/QuantConnect/Lean) | 多资产、期权、回测与实盘 | Apache-2.0；核心为 C#/.NET |
| [FinRL](https://github.com/AI4Finance-Foundation/FinRL) | 强化学习研究 | MIT；先验证普通基线再研究 RL |
| [RQAlpha](https://github.com/ricequant/rqalpha) | A 股与期货回测 | 当前条款限非商业使用 |

## 国内市场与 Go

| 项目 | 适合方向 | 注意事项 |
|---|---|---|
| [vn.py](https://github.com/vnpy/vnpy) | 国内期货、证券和 CTA | MIT；网关与柜台接口需逐项验证 |
| [GoCryptoTrader](https://github.com/thrasher-corp/gocryptotrader) | Go 多交易所连接 | MIT；官方说明仍在开发，不可直接当生产系统 |
| [Ninjabot](https://github.com/rodrigo-brito/ninjabot) | Go 回测、模拟交易和架构学习 | MIT；主要面向加密资产 |
| [BBGO](https://github.com/c9s/bbgo) | Go 加密资产策略框架 | AGPL-3.0 |
| [Alpaca Go SDK](https://github.com/alpacahq/alpaca-trade-api-go) | 美股行情与模拟交易 | Apache-2.0；它是 API SDK，不是回测框架 |

## 数据

- [Tushare Pro](https://tushare.pro/document/2?doc_id=27)：A 股数据，需核对积分、频率和商用条款；
- [AKShare](https://akshare.akfamily.xyz/introduction.html)：研究接口丰富，官方声明主要用于学术研究；
- [Alpaca Python SDK](https://github.com/alpacahq/alpaca-py)：美股历史数据、流式行情和 paper trading；
- [Interactive Brokers API](https://www.interactivebrokers.com/docs)：多市场 API，需要 TWS 或 IB Gateway；
- [Binance Spot API 文档](https://github.com/binance/binance-spot-api-docs)：使用前确认所在地区的法律和账户权限。

选择项目时，先看许可证、最近发布、测试、成交模型和数据授权，不要只看 Star 或回测截图。
