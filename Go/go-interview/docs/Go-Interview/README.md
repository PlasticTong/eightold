# Go 面试速通地图

> 目标：不靠背答案，而是把每个题讲成「结论 → 原理 → 取舍 → 线上例子」。

## 先学什么

| 优先级 | 模块 | 面试时要能讲清楚 |
| --- | --- | --- |
| P0 | 并发与运行时 | GMP、channel、锁、context、数据竞争、goroutine 泄漏 |
| P0 | 语言基础 | slice、map、interface、defer/panic、make/new、nil |
| P1 | 内存与性能 | 逃逸、GC、`sync.Pool`、pprof、`-race` |
| P1 | 后端工程 | HTTP、连接池、超时、幂等、缓存与消息队列 |
| P2 | 手撕代码 | worker pool、限流、LRU、并发安全容器、超时控制 |

## 14 天安排

1. 第 1–3 天：完成「[高频八股](/go/interview/Go-Interview/01_core_questions.md)」，每题脱稿说 90 秒。
2. 第 4–6 天：完成「[并发与运行时](/go/interview/Go-Interview/02_concurrency_runtime.md)」，并在 [在线代码实验室](/go/playground/README.md) 手敲示例。
3. 第 7–9 天：完成「[后端场景题](/go/interview/Go-Interview/03_backend_system.md)」，给每个方案说出失败路径。
4. 第 10–12 天：完成「[手撕训练](/go/interview/Go-Interview/04_coding_drills.md)」，限时 30 分钟写完并补测试。
5. 第 13–14 天：模拟面试：随机抽 10 题、2 道手撕题、1 个项目复盘。

## 回答万能结构

```text
一句话结论
→ 关键原理（最多 3 点）
→ 适用边界 / 常见坑
→ 我在项目中的做法或如何验证
```

例如被问到「map 为什么不能并发写」：先说“普通 map 不是并发安全容器”；再说读写会破坏内部状态；然后给出 `Mutex`、分片、`sync.Map` 三种选择和取舍；最后落到 `go test -race` 与压测验证。

## 已有资料，按题复习

- [GPM 调度模型](/go/README.md)
- [channel 底层原理](/go/interview/Go/chan底层原理.md)
- [Context 的使用场景](/go/interview/Go/Context的使用场景.md)
- [GC 垃圾回收算法](/go/interview/Go/GC垃圾回收算法.md)
- [slice 实践与底层实现](/go/interview/Go/slice实践以及底层实现.md)
- [sync.Pool](/go/interview/Go/sync.Pool.md)

## 资料来源与使用原则

本专题为原创归纳；涉及并发语义，以 [Go Memory Model](https://go.dev/ref/mem) 为准；涉及 GC 调优，以 [官方 GC 指南](https://go.dev/doc/gc-guide) 为准。题目灵感来自公开题库与真实面经，练习入口可参考 [GoClub](https://goclub.space/) 和 [go-interview-problems](https://github.com/blindlobstar/go-interview-problems)。
