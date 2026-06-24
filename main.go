package main

import (
	"flag"
	"fmt"
	"os"
	"runtime"
	"runtime/trace"
	"sync"
	"time"
)

// cpuWork 模拟一个只消耗 CPU 的 Goroutine。
// P 会把这些可运行的 G 分配给与自己绑定的 M 执行。
func cpuWork(id int, iterations uint64, start <-chan struct{}, wg *sync.WaitGroup) {
	defer wg.Done()
	<-start // 让所有 G 尽量同时进入“可运行”状态

	var n uint64
	for i := uint64(0); i < iterations; i++ {
		// 做一点真实计算，避免示例变成 sleep（sleep 不占用 P）。
		n = n*1664525 + 1013904223
	}

	fmt.Printf("G%-2d 完成，计算结果=%d\n", id, n)
}

func main() {
	procs := flag.Int("procs", 2, "P 的数量，即 GOMAXPROCS")
	workers := flag.Int("workers", 8, "CPU 密集型 Goroutine 数量")
	iterations := flag.Uint64("iterations", 200_000_000, "每个 Goroutine 的计算次数")
	traceFile := flag.String("trace", "", "可选：将调度 trace 写入此文件")
	flag.Parse()

	if *procs < 1 || *workers < 1 || *iterations == 0 {
		fmt.Fprintln(os.Stderr, "procs、workers 和 iterations 必须大于 0")
		os.Exit(2)
	}

	// GOMAXPROCS 决定 P 的数量。
	previous := runtime.GOMAXPROCS(*procs)
	fmt.Printf("逻辑 CPU=%d，P=%d（修改前为 %d），任务 G=%d\n", runtime.NumCPU(), *procs, previous, *workers)
	fmt.Println("含义：即使有很多 G 和 M，同一时刻最多只有 P 个 M 能执行 Go 代码。")

	if *traceFile != "" {
		f, err := os.Create(*traceFile)
		if err != nil {
			panic(err)
		}
		defer f.Close()
		if err := trace.Start(f); err != nil {
			panic(err)
		}
		defer trace.Stop()
		fmt.Printf("正在记录调度 trace：%s\n", *traceFile)
	}

	start := make(chan struct{})
	var wg sync.WaitGroup
	wg.Add(*workers)
	for i := 1; i <= *workers; i++ {
		go cpuWork(i, *iterations, start, &wg)
	}

	// 此时这些 G 已创建，但都在等待 start，因此不消耗 P。
	fmt.Printf("当前 Goroutine 总数约为 %d；释放开关后，它们会竞争 %d 个 P。\n\n", runtime.NumGoroutine(), *procs)
	totalStart := time.Now()
	close(start)
	wg.Wait()
	elapsed := time.Since(totalStart)

	fmt.Printf("\n全部完成，总耗时：%v\n", elapsed.Round(time.Millisecond))
	fmt.Println("把 -procs 改为 1、2、4 分别运行，观察总耗时和调度 trace 的变化。")
}
