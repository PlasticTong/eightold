# Go 在线实验室

在浏览器里写 Go，点击运行即可看到结果。代码会发送到 **Go Playground 的受限沙箱**执行；本站不会保存你的代码。

<div class="go-lab" data-go-lab>
  <div class="go-lab__topbar">
    <div>
      <span class="go-lab__eyebrow">GO PLAYGROUND</span>
      <strong>写一点，立刻验证</strong>
    </div>
    <a href="https://go.dev/play/" target="_blank" rel="noopener noreferrer">在官方 Playground 打开 ↗</a>
  </div>

  <div class="go-lab__examples" aria-label="示例程序">
    <button class="go-example is-active" type="button" data-go-example="hello">Hello Go</button>
    <button class="go-example" type="button" data-go-example="channel">Goroutine + Channel</button>
    <button class="go-example" type="button" data-go-example="slice">Slice</button>
  </div>

  <label class="go-lab__label" for="goSource">main.go</label>
  <textarea id="goSource" class="go-source" spellcheck="false" aria-label="Go 代码编辑器"></textarea>

  <div class="go-lab__actions">
    <button id="goRun" class="go-run" type="button">▷ 运行代码 <kbd>⌘ / Ctrl + Enter</kbd></button>
    <button id="goReset" class="go-reset" type="button">恢复示例</button>
    <span id="goRunStatus" class="go-run-status" aria-live="polite">等待运行</span>
  </div>

  <div class="go-output-wrap">
    <div class="go-output__title"><span>终端输出</span><span class="go-output__dot"></span></div>
    <pre id="goOutput" class="go-output" aria-live="polite">$ 点击「运行代码」开始</pre>
  </div>

  <p class="go-lab__notice">运行环境由 Go Playground 提供：不能访问网络，执行时间与资源有限。适合验证小段代码；依赖第三方服务、文件或性能测试请在本地运行。</p>
</div>

## 练习建议

1. 从「Goroutine + Channel」开始，尝试改变缓冲区大小，观察输出顺序。
2. 回到 [GPM 调度模型](/go/README.md)，理解 Goroutine 是任务，而 P 决定可并行执行 Go 代码的数量。
3. 想测试 `GOMAXPROCS`、trace 或 CPU 压测时，请在本地运行仓库中的示例；在线沙箱并不适合作性能结论。
