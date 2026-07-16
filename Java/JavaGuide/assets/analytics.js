(function () {
  "use strict";

  const CONSENT_KEY = "eightold-analytics-consent";
  const VISITOR_KEY = "eightold-anon-id";
  const SESSION_KEY = "eightold-session-id";
  const VISITOR_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
  const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const endpointMeta = document.querySelector('meta[name="analytics-endpoint"]');
  const endpoint = endpointMeta ? endpointMeta.content.trim().replace(/\/$/, "") : "";
  let pendingView = null;
  let lastRoute = "";

  function uuid() {
    if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, function (char) {
      const random = crypto.getRandomValues(new Uint8Array(1))[0];
      return (Number(char) ^ (random & (15 >> (Number(char) / 4)))).toString(16);
    });
  }

  function privacySignalEnabled() {
    return navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  }

  function storedConsent() {
    if (privacySignalEnabled()) {
      localStorage.removeItem(VISITOR_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      return "denied";
    }
    return localStorage.getItem(CONSENT_KEY) || "unknown";
  }

  function getOrCreateSession() {
    const storage = sessionStorage;
    const key = SESSION_KEY;
    let value = storage.getItem(key);
    if (!UUID_PATTERN.test(value || "")) {
      value = uuid();
      storage.setItem(key, value);
    }
    return value;
  }

  function getVisitorId() {
    const now = Date.now();
    try {
      const saved = JSON.parse(localStorage.getItem(VISITOR_KEY) || "null");
      const createdAt = Number(saved && saved.createdAt);
      if (
        saved &&
        UUID_PATTERN.test(saved.id || "") &&
        Number.isFinite(createdAt) &&
        createdAt <= now + 5 * 60 * 1000 &&
        now - createdAt < VISITOR_MAX_AGE_MS
      ) {
        return saved.id;
      }
    } catch (_) {
      // 旧版纯字符串 ID 或损坏数据会在下面安全轮换。
    }

    const record = { id: uuid(), createdAt: now };
    localStorage.setItem(VISITOR_KEY, JSON.stringify(record));
    return record.id;
  }

  function safeReferrer() {
    if (!document.referrer) return "";
    try {
      const url = new URL(document.referrer);
      return url.protocol === "http:" || url.protocol === "https:" ? url.origin : "";
    } catch (_) {
      return "";
    }
  }

  function removeBanner() {
    const banner = document.querySelector(".analytics-banner");
    if (banner) banner.remove();
  }

  function refreshStatus() {
    document.querySelectorAll("[data-analytics-status]").forEach(function (node) {
      const state = storedConsent();
      node.textContent = privacySignalEnabled()
        ? "浏览器已启用隐私信号：不会统计"
        : state === "granted"
          ? "当前状态：已允许匿名统计"
          : state === "denied"
            ? "当前状态：不参与统计"
            : "当前状态：尚未选择";
    });
  }

  function showBanner() {
    if (!endpoint || storedConsent() !== "unknown" || document.querySelector(".analytics-banner")) return;
    const banner = document.createElement("aside");
    banner.className = "analytics-banner";
    banner.setAttribute("aria-label", "匿名访问统计选择");
    banner.innerHTML =
      '<strong>匿名访问统计</strong>' +
      '<p>用于了解哪些学习章节更受欢迎。记录页面、时间、来源、设备类型和近似地区；不保存原始 IP，也不知道你的真实姓名。</p>' +
      '<div class="analytics-actions"><button type="button" data-analytics-choice="granted">允许匿名统计</button><button type="button" data-analytics-choice="denied">暂不参与</button><a href="#/PRIVACY.md">了解详情</a></div>';
    document.body.appendChild(banner);
  }

  function normalizeRoute(route) {
    const clean = String(route || "/").split("?")[0].split("#")[0];
    return clean.startsWith("/") ? clean.slice(0, 300) : `/${clean.slice(0, 299)}`;
  }

  async function send(view) {
    if (!endpoint || storedConsent() !== "granted") return;
    if (view.path === lastRoute) return;
    lastRoute = view.path;

    const payload = {
      event_id: uuid(),
      type: "pageview",
      path: view.path,
      title: String(view.title || "未命名页面").slice(0, 200),
      anon_id: getVisitorId(),
      session_id: getOrCreateSession(),
      occurred_at: new Date().toISOString(),
      referrer: safeReferrer()
    };

    try {
      await fetch(`${endpoint}/v1/events`, {
        method: "POST",
        mode: "cors",
        credentials: "omit",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (_) {
      // 统计失败不能影响学习页面。
    }
  }

  function setConsent(choice) {
    if (choice !== "granted" && choice !== "denied") return;
    localStorage.setItem(CONSENT_KEY, choice);
    if (choice === "denied") {
      localStorage.removeItem(VISITOR_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    }
    removeBanner();
    refreshStatus();
    if (choice === "granted" && pendingView) send(pendingView);
  }

  function trackPageView(route, title) {
    pendingView = { path: normalizeRoute(route), title: title };
    refreshStatus();
    if (storedConsent() === "granted") send(pendingView);
    else showBanner();
  }

  document.addEventListener("click", function (event) {
    const control = event.target.closest("[data-analytics-choice]");
    if (!control) return;
    setConsent(control.getAttribute("data-analytics-choice"));
  });

  window.eightoldAnalytics = { trackPageView: trackPageView, setConsent: setConsent };
})();
