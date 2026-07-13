# Go 高频八股：并发、GMP 与运行时

## 1. goroutine 和线程的区别？

**goroutine 是 Go 运行时调度的用户态执行单元，线程是操作系统调度实体；多个 G 可以复用较少的线程。**

- G 的初始栈很小且可增长，创建/切换成本通常低于线程。
- G 不是“真正并行”的保证；是否并行还受 `GOMAXPROCS`、CPU 和阻塞行为影响。
- 发生系统调用、网络 I/O、锁竞争时，运行时会协调 M 与 P，尽量不让计算能力闲置。

## 2. GMP 中 P 的核心作用是什么？

**P 是运行 Go 代码所需的调度上下文和资源集合；持有 P 的 M 才能执行 Go 代码，P 的数量上限由 `GOMAXPROCS` 控制。**

- P 有本地可运行 G 队列，降低全局队列竞争。
- 本地没有工作时，会从全局队列取 G，或从其他 P 窃取一部分工作。
- 所以即使有很多 M，同时执行 Go 代码的 M 数量也不会超过 P 数量。

延伸阅读：[GPM 调度模型](/go/README.md)。

## 3. 无缓冲 channel 和有缓冲 channel 的差别？

**无缓冲 channel 要求收发双方会合；有缓冲 channel 在缓冲未满/未空时可暂时解耦。**

- 无缓冲适合明确的同步点；有缓冲适合有限排队或削峰。
- 缓冲不是“越大越好”：过大可能掩盖消费能力不足并拉高内存。
- 关闭 channel 是广播“不会再发送数据”，不是取消正在执行的 goroutine；取消通常交给 `context.Context`。

## 4. `select` 有什么语义？

**`select` 会在可执行的 case 中选择一个执行；多个 case 同时就绪时，选择是伪随机的，不应依赖固定顺序。**

- `default` 让 `select` 非阻塞，但在循环中容易造成 CPU 空转。
- `time.After` 放在高频循环可能产生不必要对象，重复定时优先复用 `Timer`，并正确 stop/drain。
- `nil` channel 永远阻塞，可用于动态启停一个 case。

## 5. `Mutex`、`RWMutex` 和原子操作怎么选？

**先保证正确性：复杂共享状态用锁；只读写单个简单状态才考虑原子操作；`RWMutex` 只在读占明显优势时有价值。**

- 原子操作只能覆盖单个变量或精心设计的状态机，不能替代多字段不变式。
- `RWMutex` 的写者等待和读者竞争要通过压测确认，不是默认更快。
- 锁的边界应短、明确，避免持锁调用未知回调、网络 I/O 或 channel 操作。

## 6. 什么是 data race？如何避免？

**两个 goroutine 并发访问同一内存位置，至少一个是写，且没有同步关系，就是数据竞争。**

可选同步方式：channel 通信、`Mutex/RWMutex`、`sync/atomic`、`WaitGroup` 的正确使用。Go 的并发语义以 happens-before 为核心；不要依赖“机器上目前跑起来没问题”。

## 7. WaitGroup 的常见误用？

**`Add` 必须在 goroutine 启动前完成；每一次 `Add(1)` 都要有且仅有一次 `Done()`；不要复制正在使用的 WaitGroup。**

推荐写法：

```go
wg.Add(1)
go func() {
    defer wg.Done()
    work()
}()
wg.Wait()
```

`WaitGroup` 只负责等待，不传错误、不取消任务；错误可用 `errgroup` 或 channel，取消交给 context。

## 8. goroutine 泄漏如何发生与排查？

**goroutine 因 channel 永远等不到、I/O 无超时、锁无法获得或循环未退出而长期存活，就是泄漏。**

排查路径：

1. 看 `runtime.NumGoroutine()` 是否持续上涨；
2. 抓 goroutine profile：`/debug/pprof/goroutine?debug=2`；
3. 从大量重复栈定位阻塞点；
4. 为入口补 context、超时、退出信号与资源关闭。

## 9. context 应该怎么传？

**context 是请求范围的截止时间、取消信号和少量元数据载体；通常作为第一个参数向下传递。**

- 用 `WithTimeout/WithCancel` 创建后要调用 `cancel()`，及时释放计时器等资源。
- 不要把业务必填参数塞进 context；不要把 context 存入 struct 长期持有。
- 下游调用必须实际检查 `ctx.Done()` 或使用支持 context 的 API，否则超时只是表面超时。

## 10. GC 面试怎么回答？

**Go 的标准工具链使用并发垃圾回收以控制停顿；调优本质是在 CPU、内存占用和延迟之间做取舍。**

- 先从对象分配率、存活堆、goroutine 栈、RSS 观察，而不是盲目调 `GOGC`。
- `GOGC` 越低通常越节省内存、但更频繁地消耗 CPU；`GOMEMLIMIT` 用于给运行时提供内存预算。
- 优化顺序：减少无意义分配 → 批处理/复用 → benchmark 与 pprof 验证 → 最后才调参数。

官方依据：[Go Memory Model](https://go.dev/ref/mem) 与 [GC 指南](https://go.dev/doc/gc-guide)。
