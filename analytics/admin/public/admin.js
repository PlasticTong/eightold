(function () {
  "use strict";

  const numberFormat = new Intl.NumberFormat("zh-CN");
  const dateFormat = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  function byId(id) { return document.getElementById(id); }
  function text(node, value) { node.textContent = value == null || value === "" ? "—" : String(value); }
  function count(value) { return numberFormat.format(Number(value || 0)); }
  function formatTime(value) { return value ? dateFormat.format(new Date(value)) : "—"; }
  function location(row) { return [row.country, row.region, row.city].filter(Boolean).join(" · ") || "未知"; }
  function bucket(value, max) { return Math.max(1, Math.min(10, Math.ceil(Number(value || 0) / max * 10))); }

  async function fetchJson(path) {
    const response = await fetch(path, { credentials: "same-origin", headers: { Accept: "application/json" } });
    if (!response.ok) {
      const body = await response.json().catch(function () { return {}; });
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  function empty(container, message) {
    const node = document.createElement("div");
    node.className = "empty";
    node.textContent = message;
    container.replaceChildren(node);
  }

  function renderRank(container, rows, labelKey, valueKey) {
    if (!rows.length) return empty(container, "暂无数据");
    const max = Math.max.apply(null, rows.map(function (row) { return Number(row[valueKey] || 0); })) || 1;
    const nodes = rows.map(function (row) {
      const item = document.createElement("div");
      item.className = "rank-item";
      const label = document.createElement("strong");
      label.textContent = row[labelKey] || "直接访问 / 未知";
      label.title = label.textContent;
      const value = document.createElement("span");
      value.textContent = count(row[valueKey]);
      const track = document.createElement("div");
      track.className = "rank-track";
      const fill = document.createElement("i");
      fill.className = `level-${bucket(row[valueKey], max)}`;
      track.appendChild(fill);
      item.append(label, value, track);
      return item;
    });
    container.replaceChildren(...nodes);
  }

  function renderDaily(rows) {
    const chart = byId("dailyChart");
    if (!rows.length) return empty(chart, "当前范围暂无访问数据");
    const max = Math.max.apply(null, rows.map(function (row) { return Number(row.views || 0); })) || 1;
    const nodes = rows.map(function (row) {
      const column = document.createElement("div");
      column.className = "day-column";
      column.title = `${row.day} · PV ${row.views} · UV ${row.visitors}`;
      column.setAttribute("aria-label", column.title);
      const bars = document.createElement("div");
      bars.className = "day-bars";
      const pv = document.createElement("i");
      pv.className = `day-bar height-${bucket(row.views, max)}`;
      const uv = document.createElement("i");
      uv.className = `day-bar uv height-${bucket(row.visitors, max)}`;
      const label = document.createElement("small");
      label.textContent = row.day.slice(5);
      bars.append(pv, uv);
      column.append(bars, label);
      return column;
    });
    chart.replaceChildren(...nodes);
  }

  function cell(value, className) {
    const td = document.createElement("td");
    if (className) td.className = className;
    td.textContent = value == null || value === "" ? "—" : String(value);
    return td;
  }

  function renderVisitors(rows) {
    const body = byId("visitorRows");
    if (!rows.length) {
      const row = document.createElement("tr");
      const td = cell("暂无匿名访客数据");
      td.colSpan = 7;
      td.className = "empty";
      row.appendChild(td);
      return body.replaceChildren(row);
    }
    body.replaceChildren(...rows.map(function (visitor) {
      const row = document.createElement("tr");
      row.append(
        cell(visitor.visitor, "visitor-tag"),
        cell(formatTime(visitor.first_seen)),
        cell(formatTime(visitor.last_seen)),
        cell(count(visitor.views)),
        cell(count(visitor.sessions)),
        cell(location(visitor)),
        cell(`${visitor.device || "未知"} · ${visitor.browser || "未知"} · ${visitor.os || "未知"}`)
      );
      return row;
    }));
  }

  function renderEvents(rows) {
    const body = byId("eventRows");
    if (!rows.length) {
      const row = document.createElement("tr");
      const td = cell("暂无访问事件");
      td.colSpan = 6;
      td.className = "empty";
      row.appendChild(td);
      return body.replaceChildren(row);
    }
    body.replaceChildren(...rows.map(function (event) {
      const row = document.createElement("tr");
      const pageCell = document.createElement("td");
      const link = document.createElement("a");
      link.href = `https://plastictong.github.io/eightold/Java/JavaGuide/#${event.route}`;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = event.title || event.route;
      link.title = event.route;
      pageCell.appendChild(link);
      row.append(
        cell(formatTime(event.received_at)),
        cell(event.visitor, "visitor-tag"),
        pageCell,
        cell(event.referrer_origin || "直接访问"),
        cell(location(event)),
        cell(`${event.device || "未知"} · ${event.browser || "未知"}`)
      );
      return row;
    }));
  }

  async function load() {
    const status = byId("status");
    status.classList.remove("error");
    status.textContent = "正在加载数据…";
    byId("refresh").disabled = true;
    try {
      const days = byId("days").value;
      const rangeQuery = `days=${encodeURIComponent(days)}&tz=480`;
      const results = await Promise.all([
        fetchJson(`/api/overview?${rangeQuery}`),
        fetchJson(`/api/visitors?limit=100&${rangeQuery}`),
        fetchJson(`/api/events?limit=100&${rangeQuery}`)
      ]);
      const overview = results[0];
      text(byId("metricViews"), count(overview.totals.views));
      text(byId("metricVisitors"), count(overview.totals.visitors));
      text(byId("metricSessions"), count(overview.totals.sessions));
      text(byId("metricToday"), count(overview.totals.today_views));
      renderDaily(overview.daily);
      renderRank(byId("topPages"), overview.pages, "title", "views");
      renderRank(byId("referrers"), overview.referrers, "referrer", "views");
      renderRank(byId("countries"), overview.countries, "country", "views");
      renderVisitors(results[1].visitors);
      renderEvents(results[2].events);
      status.textContent = `更新于 ${dateFormat.format(new Date())}`;
    } catch (error) {
      status.classList.add("error");
      status.textContent = error.message === "unauthorized"
        ? "Cloudflare Access 登录无效"
        : `加载失败：${error.message}`;
    } finally {
      byId("refresh").disabled = false;
    }
  }

  byId("refresh").addEventListener("click", load);
  byId("days").addEventListener("change", load);
  load();
})();
