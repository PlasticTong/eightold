(function () {
  const STORAGE_KEY = "eightold-javaguide-learned";
  const THEME_KEY = "eightold-javaguide-theme";

  function readProgress() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch (_) {
      return new Set();
    }
  }

  function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...progress]));
  }

  function currentRoute(vm) {
    return (vm && vm.route && vm.route.path) || "/";
  }

  function isCourseRoute(route) {
    return ["/docs/", "/cs-base/", "/go/", "/os/", "/network/", "/mysql/", "/redis/"].some(
      (prefix) => route.startsWith(prefix)
    );
  }

  function updateProgressUI(vm) {
    const progress = readProgress();
    const counter = document.querySelector("#progressCount");
    if (counter) counter.textContent = `${progress.size} 篇`;

    const button = document.querySelector("#markLearned");
    const route = currentRoute(vm);
    if (button) {
      const learned = progress.has(route);
      button.textContent = learned ? "✓ 已学完，点击取消" : "标记为已学";
      button.classList.toggle("is-learned", learned);
    }

    document.querySelectorAll(".sidebar a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      const routePath = href.replace(/^#/, "");
      link.classList.toggle("learned-link", progress.has(routePath));
    });
  }

  function externalizeMissingLinks() {
    const localPrefixes = [
      "#/docs/ai/",
      "#/docs/ai-coding/",
      "#/docs/cs-basics/operating-system/",
      "#/cs-base/",
      "#/go/",
      "#/os/",
      "#/network/",
      "#/mysql/",
      "#/redis/",
      "#/SOURCE.md"
    ];

    document.querySelectorAll(".markdown-section a").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#/") || localPrefixes.some((prefix) => href.startsWith(prefix))) return;

      const upstreamPath = href.slice(2).replace(/^docs\//, "").replace(/\.md$/, "");
      link.href = `https://javaguide.cn/${upstreamPath}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.title = "此资料未下载，将在 JavaGuide 官网打开";
    });
  }

  function setupSidebarGroups() {
    document.querySelectorAll(".sidebar-nav li").forEach((item) => {
      const label = item.querySelector(":scope > strong, :scope > p > strong");
      const nested = item.querySelector(":scope > ul");
      if (!label || !nested) return;

      item.classList.add("nav-group");
      // Docsify 把当前链接的 active class 放在 li 上；当前章节的所有父级必须保持展开。
      item.classList.toggle("is-collapsed", !item.querySelector(".active"));
      if (label.dataset.toggleReady) return;

      label.dataset.toggleReady = "true";
      label.setAttribute("role", "button");
      label.setAttribute("tabindex", "0");

      const toggle = () => item.classList.toggle("is-collapsed");
      label.addEventListener("click", toggle);
      label.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        toggle();
      });
    });
  }

  function revealActiveSidebarItem() {
    const sidebar = document.querySelector(".sidebar");
    const active = sidebar && sidebar.querySelector("li.active");
    if (!sidebar || !active) return;

    const sidebarRect = sidebar.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const topEdge = sidebarRect.top + 72;
    const bottomEdge = sidebarRect.bottom - 28;

    // 深层章节打开时，把当前条目带到侧栏的可视范围内，不必手动寻找。
    if (activeRect.top < topEdge || activeRect.bottom > bottomEdge) {
      sidebar.scrollTop += activeRect.top - sidebarRect.top - sidebar.clientHeight * 0.34;
    }
  }

  function setupArticleToc() {
    document.querySelectorAll(".article-toc").forEach((toc) => toc.remove());

    const route = location.hash.slice(1).split("?")[0] || "/";
    if (!isCourseRoute(route)) return;

    const article = document.querySelector(".markdown-section");
    if (!article) return;

    const headings = [...article.querySelectorAll("h2, h3")].filter((heading) => heading.id);
    if (headings.length < 2) return;

    const toc = document.createElement("aside");
    toc.className = "article-toc";
    toc.setAttribute("aria-label", "本章导航");

    const title = document.createElement("strong");
    title.textContent = "本章导航";
    toc.appendChild(title);

    const list = document.createElement("nav");
    const baseRoute = location.hash.split("?")[0];
    headings.forEach((heading) => {
      const link = document.createElement("a");
      link.href = `${baseRoute}?id=${encodeURIComponent(heading.id)}`;
      link.textContent = heading.textContent.trim();
      link.className = `article-toc__item article-toc__item--${heading.tagName.toLowerCase()}`;
      list.appendChild(link);
    });
    toc.appendChild(list);
    article.parentElement.insertBefore(toc, article);
  }

  const GO_EXAMPLES = {
    hello: `package main

import "fmt"

func main() {
	msg := "Hello, Go!"
	fmt.Println(msg)
}`,
    channel: `package main

import "fmt"

func main() {
	ch := make(chan string)
	go func() {
		ch <- "Goroutine 已完成工作"
	}()

	fmt.Println(<-ch)
}`,
    slice: `package main

import "fmt"

func main() {
	nums := []int{1, 2, 3}
	nums = append(nums, 4)
	fmt.Printf("nums=%v, len=%d, cap=%d\\n", nums, len(nums), cap(nums))
}`
  };

  function setupGoLab() {
    const lab = document.querySelector("[data-go-lab]");
    if (!lab || lab.dataset.ready) return;
    lab.dataset.ready = "true";

    const source = lab.querySelector("#goSource");
    const output = lab.querySelector("#goOutput");
    const status = lab.querySelector("#goRunStatus");
    const run = lab.querySelector("#goRun");
    const reset = lab.querySelector("#goReset");
    let selectedExample = "hello";

    source.value = GO_EXAMPLES[selectedExample];

    const selectExample = (name) => {
      selectedExample = name;
      source.value = GO_EXAMPLES[name];
      lab.querySelectorAll(".go-example").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.goExample === name);
      });
      output.textContent = "$ 已载入示例，等待运行";
      status.textContent = "等待运行";
    };

    lab.querySelectorAll(".go-example").forEach((button) => {
      button.addEventListener("click", () => selectExample(button.dataset.goExample));
    });

    reset.addEventListener("click", () => selectExample(selectedExample));

    const runCode = async () => {
      const code = source.value.trim();
      if (!code) {
        output.textContent = "请输入 Go 代码后再运行。";
        return;
      }

      run.disabled = true;
      status.textContent = "正在请求 Go Playground…";
      output.textContent = "$ go run main.go\n\n运行中…";

      try {
        const response = await fetch("https://play.golang.org/compile", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
          body: new URLSearchParams({ version: "2", body: code })
        });
        if (!response.ok) throw new Error(`服务返回 ${response.status}`);

        const result = await response.json();
        const events = Array.isArray(result.Events) ? result.Events : [];
        const text = events.map((event) => event.Message || "").join("");
        output.textContent = result.Errors || text || "程序运行完成，没有输出。";
        status.textContent = result.Errors ? "运行出错" : "运行完成";
      } catch (error) {
        output.textContent = `无法连接 Go Playground：${error.message}\n\n你可以点击上方链接，在官方 Playground 中继续运行。`;
        status.textContent = "连接失败";
      } finally {
        run.disabled = false;
      }
    };

    run.addEventListener("click", runCode);
    source.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runCode();
      }
    });
  }

  window.$docsify = {
    name: "eightold 学习站",
    nameLink: "#/",
    repo: "https://github.com/PlasticTong/eightold",
    homepage: "README.md",
    loadSidebar: "_sidebar.md",
    auto2top: true,
    subMaxLevel: 0,
    maxLevel: 3,
    relativePath: false,
    search: {
      paths: "auto",
      placeholder: "搜索 AI、Agent、RAG、操作系统…",
      noData: "没有找到相关内容",
      depth: 4
    },
    alias: {
      "/cs-base/(.*)": "/../../CS-Base/$1",
      "/go/interview/(.*)": "/../../Go/go-interview/docs/$1",
      "/go/(.*)": "/../../Go/$1",
      "/os/(.*)": "/../../CS-Base/os/$1",
      "/network/(.*)": "/../../CS-Base/network/$1",
      "/mysql/(.*)": "/../../CS-Base/mysql/$1",
      "/redis/(.*)": "/../../CS-Base/redis/$1",
      "/ai/(.*)": "/docs/ai/$1",
      "/ai-coding/(.*)": "/docs/ai-coding/$1",
      "/cs-basics/operating-system/(.*)": "/docs/cs-basics/operating-system/$1"
    },
    plugins: [
      function studyPlugin(hook, vm) {
        hook.beforeEach(function (markdown) {
          const frontMatter = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/);
          const titleMatch = frontMatter && frontMatter[1].match(/^title:\s*(.+)$/m);
          const title = titleMatch ? titleMatch[1].trim().replace(/^['"]|['"]$/g, "") : "";
          const content = markdown
            .replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "")
            .replace(/<!--\s*@include:[\s\S]*?-->/g, "");

          if (title && !/^\s*#\s+/m.test(content)) return `# ${title}\n\n${content}`;
          return content;
        });

        hook.afterEach(function (html, next) {
          if (!isCourseRoute(currentRoute(vm))) return next(html);
          next(
            `${html}<div class="study-complete"><p>读到这里，停一下：你能用自己的话复述核心机制吗？</p><button id="markLearned" type="button">标记为已学</button></div>`
          );
        });

        hook.doneEach(function () {
          updateProgressUI(vm);
          externalizeMissingLinks();
          setupSidebarGroups();
          requestAnimationFrame(revealActiveSidebarItem);
          setupArticleToc();
          setupGoLab();
        });

        hook.ready(function () {
          document.addEventListener("click", function (event) {
            const button = event.target.closest("#markLearned");
            if (!button) return;

            const route = currentRoute(vm);
            const progress = readProgress();
            if (progress.has(route)) progress.delete(route);
            else progress.add(route);
            saveProgress(progress);
            updateProgressUI(vm);
          });
        });
      }
    ]
  };

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") document.documentElement.classList.add("dark-theme");

  document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.querySelector("#themeToggle");
    if (!toggle) return;
    toggle.addEventListener("click", function () {
      document.documentElement.classList.toggle("dark-theme");
      localStorage.setItem(
        THEME_KEY,
        document.documentElement.classList.contains("dark-theme") ? "dark" : "light"
      );
    });
  });
})();
