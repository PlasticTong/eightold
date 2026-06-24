# Go GPM 调度演示

## 先记住一句话

**G 是任务，M 是真正干活的操作系统线程，P 是 M 执行 Go 代码所需的“运行许可证 + 本地任务队列”。**

- **G（Goroutine）**：等待被执行的 Go 函数。
- **M（Machine）**：操作系统线程，最终由 CPU 执行。
- **P（Processor）**：保存本地可运行 G 队列、内存分配缓存等调度资源。

一个 M 必须绑定一个 P 才能执行 Go 代码。`GOMAXPROCS` 决定 P 的数量，因此也决定同一时刻最多有多少个 M 并行执行 Go 代码。

```text
P1：本地队列 [G1, G2, G3]  <--> M1 <--> CPU 核心
P2：本地队列 [G4, G5]      <--> M2 <--> CPU 核心
                         P1/P2 可从彼此的队列偷取 G
```

## 运行示例

本机需要安装 Go 1.22 或更高版本：

```bash
go run . -procs=1 -workers=8 -iterations=200000000
go run . -procs=2 -workers=8 -iterations=200000000
go run . -procs=4 -workers=8 -iterations=200000000
```

程序会同时释放 8 个 CPU 密集型 G，让它们竞争指定数量的 P。每个 G 执行相同次数的计算，请比较三次运行的总耗时。由于 Go 会抢占 Goroutine，而且每台机器的负载不同，结果不会是严格的整数倍。

> `time.Sleep` 会让 G 进入等待状态并释放 P，所以示例使用循环计算来制造 CPU 工作。

## 直接观察调度器

### 方法一：生成可视化 trace

```bash
go run . -procs=2 -workers=8 -iterations=200000000 -trace=trace.out
go tool trace trace.out
```

浏览器打开后查看调度时间线。trace 中的 `G`、`M`、`P` 就是运行时真实记录，不是示例程序伪造的编号。

### 方法二：输出调度器快照

```bash
GODEBUG=schedtrace=500,scheddetail=1 go run . -procs=2 -workers=8 -iterations=500000000
```

重点看：

- `gomaxprocs`：P 的数量；
- `P0`、`P1`：每个 P 的状态；
- `runqsize`：P 的本地可运行 G 队列长度；
- `M...`：操作系统线程状态；
- `G...`：Goroutine 状态。

## P 还做了什么？

P 不只是并行度开关：

1. 维护本地运行队列，减少所有线程争抢同一个全局队列的锁竞争；
2. 本地无任务时，从全局队列、网络轮询器或其他 P 中取得 G；
3. 保存内存分配缓存等运行时资源；
4. M 因系统调用阻塞时，允许 P 与它分离，再交给其他 M 继续执行 G。

因此，更准确的理解是：**P 是 Go 调度器用来组织可运行任务和运行时资源的逻辑处理器。**
