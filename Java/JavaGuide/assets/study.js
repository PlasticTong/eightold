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
    return route.startsWith("/docs/");
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
      if (!item.querySelector(".active")) item.classList.add("is-collapsed");
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

  window.$docsify = {
    name: "JavaGuide 精选",
    nameLink: "#/",
    repo: "https://github.com/PlasticTong/eightold",
    homepage: "README.md",
    loadSidebar: true,
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
