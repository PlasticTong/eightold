let jwksCache = null;
let jwksExpiresAt = 0;
let jwksTeamDomain = "";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer"
    }
  });
}

function base64UrlBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJsonSegment(value) {
  return JSON.parse(new TextDecoder().decode(base64UrlBytes(value)));
}

function accessToken(request) {
  const header = request.headers.get("Cf-Access-Jwt-Assertion");
  if (header) return header;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function accessKeys(teamDomain, forceRefresh = false) {
  if (!forceRefresh && jwksCache && jwksTeamDomain === teamDomain && Date.now() < jwksExpiresAt) {
    return jwksCache;
  }
  const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`, {
    headers: { Accept: "application/json" }
  });
  if (!response.ok) throw new Error("Unable to load Access signing keys");
  const body = await response.json();
  jwksCache = Array.isArray(body.keys) ? body.keys : [];
  jwksTeamDomain = teamDomain;
  jwksExpiresAt = Date.now() + 60 * 60 * 1000;
  return jwksCache;
}

function allowedAdminEmails(env) {
  return new Set(
    String(env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function claimsAreValid(payload, env, now = Math.floor(Date.now() / 1000)) {
  if (!payload || typeof payload !== "object") return false;

  const teamDomain = String(env.ACCESS_TEAM_DOMAIN || "").replace(/\/$/, "");
  const audience = String(env.ACCESS_AUD || "");
  const tokenAudience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (String(payload.iss || "").replace(/\/$/, "") !== teamDomain) return false;
  if (!tokenAudience.includes(audience)) return false;
  if (!Number.isInteger(payload.exp) || payload.exp <= now) return false;
  if (payload.nbf !== undefined && (!Number.isInteger(payload.nbf) || payload.nbf > now)) return false;
  if (payload.iat !== undefined && (!Number.isInteger(payload.iat) || payload.iat > now + 60)) return false;
  return true;
}

export function adminEmailIsAllowed(payload, env) {
  const email = String(payload && payload.email || "").trim().toLowerCase();
  return Boolean(email) && allowedAdminEmails(env).has(email);
}

export async function verifyAccessJwt(request, env) {
  const token = accessToken(request);
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  let header;
  let payload;
  try {
    header = decodeJsonSegment(parts[0]);
    payload = decodeJsonSegment(parts[1]);
  } catch (_) {
    return null;
  }
  if (header.alg !== "RS256" || !header.kid) return null;

  const teamDomain = String(env.ACCESS_TEAM_DOMAIN || "").replace(/\/$/, "");
  const audience = String(env.ACCESS_AUD || "");
  if (!teamDomain.startsWith("https://") || !audience || audience.startsWith("replace-")) return null;

  let keys = await accessKeys(teamDomain);
  let jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) {
    keys = await accessKeys(teamDomain, true);
    jwk = keys.find((key) => key.kid === header.kid);
  }
  if (!jwk) return null;
  let validSignature = false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    validSignature = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      base64UrlBytes(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
  } catch (_) {
    return null;
  }
  if (!validSignature) return null;

  return claimsAreValid(payload, env) ? payload : null;
}

function clampInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function startOfTodayUtc(offsetMinutes) {
  const shifted = new Date(Date.now() + offsetMinutes * 60000);
  const localMidnightAsUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  return new Date(localMidnightAsUtc - offsetMinutes * 60000).toISOString();
}

function reportRange(url) {
  const days = clampInteger(url.searchParams.get("days"), 30, 1, 90);
  const offset = clampInteger(url.searchParams.get("tz"), 480, -720, 840);
  const todayStart = startOfTodayUtc(offset);
  const since = new Date(Date.parse(todayStart) - (days - 1) * 86400000).toISOString();
  return {
    days,
    offset,
    todayStart,
    since,
    tzModifier: `${offset >= 0 ? "+" : ""}${offset} minutes`
  };
}

function fillDaily(rows, range) {
  const values = new Map(rows.map((row) => [row.day, row]));
  const start = Date.parse(range.since);
  return Array.from({ length: range.days }, (_, index) => {
    const localTime = start + index * 86400000 + range.offset * 60000;
    const day = new Date(localTime).toISOString().slice(0, 10);
    const existing = values.get(day);
    return existing || { day, views: 0, visitors: 0 };
  });
}

async function overview(url, env) {
  const range = reportRange(url);
  const siteId = String(env.SITE_ID || "eightold");

  const statements = [
    env.DB.prepare(
      `SELECT COUNT(*) AS views,
              COUNT(DISTINCT visitor_hash) AS visitors,
              COUNT(DISTINCT session_hash) AS sessions,
              SUM(CASE WHEN received_at >= ? THEN 1 ELSE 0 END) AS today_views
       FROM events WHERE site_id = ? AND is_bot = 0 AND received_at >= ?`
    ).bind(range.todayStart, siteId, range.since),
    env.DB.prepare(
      `SELECT date(datetime(received_at, ?)) AS day,
              COUNT(*) AS views,
              COUNT(DISTINCT visitor_hash) AS visitors
       FROM events WHERE site_id = ? AND is_bot = 0 AND received_at >= ?
       GROUP BY day ORDER BY day ASC`
    ).bind(range.tzModifier, siteId, range.since),
    env.DB.prepare(
      `WITH filtered AS (
         SELECT * FROM events WHERE site_id = ? AND is_bot = 0 AND received_at >= ?
       ),
       counts AS (
         SELECT route, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
         FROM filtered GROUP BY route
       ),
       latest AS (
         SELECT route, title,
                ROW_NUMBER() OVER (PARTITION BY route ORDER BY received_at DESC, id DESC) AS row_number
         FROM filtered
       )
       SELECT counts.route, latest.title, counts.views, counts.visitors
       FROM counts JOIN latest ON latest.route = counts.route AND latest.row_number = 1
       ORDER BY counts.views DESC LIMIT 12`
    ).bind(siteId, range.since),
    env.DB.prepare(
      `SELECT referrer_origin AS referrer, COUNT(*) AS views
       FROM events WHERE site_id = ? AND is_bot = 0 AND received_at >= ? AND referrer_origin <> ''
       GROUP BY referrer_origin ORDER BY views DESC LIMIT 10`
    ).bind(siteId, range.since),
    env.DB.prepare(
      `SELECT CASE WHEN country = '' THEN '未知' ELSE country END AS country, COUNT(*) AS views
       FROM events WHERE site_id = ? AND is_bot = 0 AND received_at >= ?
       GROUP BY country ORDER BY views DESC LIMIT 10`
    ).bind(siteId, range.since)
  ];

  const results = await env.DB.batch(statements);
  return json({
    range: { days: range.days, timezone_offset_minutes: range.offset, since: range.since },
    totals: results[0].results[0] || { views: 0, visitors: 0, sessions: 0, today_views: 0 },
    daily: fillDaily(results[1].results || [], range),
    pages: results[2].results || [],
    referrers: results[3].results || [],
    countries: results[4].results || []
  });
}

async function visitors(url, env) {
  const limit = clampInteger(url.searchParams.get("limit"), 50, 1, 100);
  const range = reportRange(url);
  const siteId = String(env.SITE_ID || "eightold");
  const result = await env.DB.prepare(
    `WITH filtered AS (
       SELECT * FROM events WHERE site_id = ? AND is_bot = 0 AND received_at >= ?
     ),
     summary AS (
       SELECT visitor_hash,
              MIN(received_at) AS first_seen,
              MAX(received_at) AS last_seen,
              COUNT(*) AS views,
              COUNT(DISTINCT session_hash) AS sessions
       FROM filtered GROUP BY visitor_hash
     ),
     latest AS (
       SELECT visitor_hash, country, region, city, device, browser, os,
              ROW_NUMBER() OVER (
                PARTITION BY visitor_hash ORDER BY received_at DESC, id DESC
              ) AS row_number
       FROM filtered
     )
     SELECT upper(substr(summary.visitor_hash, 1, 8)) AS visitor,
            summary.first_seen,
            summary.last_seen,
            summary.views,
            summary.sessions,
            latest.country,
            latest.region,
            latest.city,
            latest.device,
            latest.browser,
            latest.os
     FROM summary
     JOIN latest ON latest.visitor_hash = summary.visitor_hash AND latest.row_number = 1
     ORDER BY summary.last_seen DESC LIMIT ?`
  ).bind(siteId, range.since, limit).all();
  return json({ visitors: result.results || [] });
}

async function events(url, env) {
  const limit = clampInteger(url.searchParams.get("limit"), 100, 1, 100);
  const before = clampInteger(url.searchParams.get("before"), Number.MAX_SAFE_INTEGER, 1, Number.MAX_SAFE_INTEGER);
  const range = reportRange(url);
  const siteId = String(env.SITE_ID || "eightold");
  const result = await env.DB.prepare(
    `SELECT id, received_at, upper(substr(visitor_hash, 1, 8)) AS visitor,
            route, title, referrer_origin, browser, os, device, country, region, city
     FROM events WHERE site_id = ? AND is_bot = 0 AND received_at >= ? AND id < ?
     ORDER BY id DESC LIMIT ?`
  ).bind(siteId, range.since, before, limit).all();
  return json({ events: result.results || [] });
}

function secureAsset(response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  headers.set("Content-Security-Policy", "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; worker-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    if (!env.DB || !env.ASSETS) return json({ error: "service_not_configured" }, 503);
    const adminEmails = String(env.ADMIN_EMAILS || "");
    if (
      String(env.ACCESS_TEAM_DOMAIN || "").includes("replace-me") ||
      String(env.ACCESS_AUD || "").startsWith("replace-") ||
      !adminEmails ||
      adminEmails.includes("replace-")
    ) {
      return json({ error: "cloudflare_access_not_configured" }, 503);
    }

    let identity;
    try {
      identity = await verifyAccessJwt(request, env);
    } catch (_) {
      return json({ error: "access_verification_failed" }, 503);
    }
    if (!identity) return json({ error: "unauthorized" }, 401);
    if (!adminEmailIsAllowed(identity, env)) return json({ error: "forbidden" }, 403);

    const url = new URL(request.url);
    if (url.pathname === "/api/overview" && request.method === "GET") return overview(url, env);
    if (url.pathname === "/api/visitors" && request.method === "GET") return visitors(url, env);
    if (url.pathname === "/api/events" && request.method === "GET") return events(url, env);
    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    return secureAsset(await env.ASSETS.fetch(request));
  }
};
