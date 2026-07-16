const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder = new TextEncoder();

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function allowedOrigins(env) {
  return new Set(String(env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean));
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}

function rateLimited(origin) {
  return json({ error: "rate_limited" }, 429, { ...corsHeaders(origin), "Retry-After": "60" });
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}

export function normalizeReferrer(value) {
  const raw = cleanText(value, 500);
  if (!raw) return { origin: "", path: "" };
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return { origin: "", path: "" };
    return { origin: url.origin.slice(0, 200), path: "" };
  } catch (_) {
    return { origin: "", path: "" };
  }
}

export async function readBodyLimited(request, maxBytes = 8192) {
  if (!request.body) return "";

  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      const error = new Error("payload_too_large");
      error.code = "payload_too_large";
      throw error;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export function parseClient(userAgent) {
  const ua = cleanText(userAgent, 512);
  const bot = /bot|crawler|spider|slurp|headless|preview|facebookexternalhit/i.test(ua);
  const device = /ipad|tablet/i.test(ua) ? "tablet" : /mobile|android|iphone|ipod/i.test(ua) ? "mobile" : "desktop";

  let browser = "Other";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua)) browser = "Safari";

  let os = "Other";
  if (/Windows NT/.test(ua)) os = "Windows";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os, device, bot };
}

export function validateEvent(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "invalid_body" };
  if (input.type !== "pageview") return { error: "invalid_type" };
  if (!UUID_PATTERN.test(String(input.event_id || ""))) return { error: "invalid_event_id" };
  if (!UUID_PATTERN.test(String(input.anon_id || ""))) return { error: "invalid_anon_id" };
  if (!UUID_PATTERN.test(String(input.session_id || ""))) return { error: "invalid_session_id" };

  const path = cleanText(input.path, 300).split(/[?#]/, 1)[0];
  if (!path.startsWith("/") || path.includes("..")) return { error: "invalid_path" };
  const title = cleanText(input.title, 200) || "未命名页面";
  const occurred = new Date(input.occurred_at);
  const occurredAt = Number.isNaN(occurred.getTime()) ? null : occurred.toISOString();

  return {
    value: {
      eventId: String(input.event_id).toLowerCase(),
      anonId: String(input.anon_id).toLowerCase(),
      sessionId: String(input.session_id).toLowerCase(),
      path,
      title,
      occurredAt,
      referrer: normalizeReferrer(input.referrer)
    }
  };
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeLocation(request) {
  const cf = request.cf || {};
  return {
    country: cleanText(cf.country, 8),
    region: cleanText(cf.region, 80),
    city: cleanText(cf.city, 80)
  };
}

async function handleEvent(request, env, origin) {
  if (!env.DB || !env.ANON_HMAC_KEY || !env.GLOBAL_RATE_LIMITER || !env.VISITOR_RATE_LIMITER) {
    return json({ error: "service_not_configured" }, 503, corsHeaders(origin));
  }

  const siteId = cleanText(env.SITE_ID || "eightold", 40);
  let globalLimit;
  try {
    globalLimit = await env.GLOBAL_RATE_LIMITER.limit({ key: `site:${siteId}` });
  } catch (_) {
    return json({ error: "service_unavailable" }, 503, corsHeaders(origin));
  }
  if (!globalLimit.success) return rateLimited(origin);

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > 8192) return json({ error: "payload_too_large" }, 413, corsHeaders(origin));
  const contentType = String(request.headers.get("Content-Type") || "").split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") return json({ error: "unsupported_media_type" }, 415, corsHeaders(origin));

  let raw;
  try {
    raw = await readBodyLimited(request);
  } catch (error) {
    if (error && error.code === "payload_too_large") {
      return json({ error: "payload_too_large" }, 413, corsHeaders(origin));
    }
    return json({ error: "invalid_body" }, 400, corsHeaders(origin));
  }

  let input;
  try {
    input = JSON.parse(raw);
  } catch (_) {
    return json({ error: "invalid_json" }, 400, corsHeaders(origin));
  }

  const validated = validateEvent(input);
  if (validated.error) return json({ error: validated.error }, 400, corsHeaders(origin));

  const event = validated.value;
  const receivedAt = new Date();
  const occurredDate = event.occurredAt ? new Date(event.occurredAt) : receivedAt;
  const clockDifference = Math.abs(occurredDate.getTime() - receivedAt.getTime());
  const occurredAt = clockDifference <= 24 * 60 * 60 * 1000 ? occurredDate.toISOString() : receivedAt.toISOString();
  const visitorHash = await hmacHex(env.ANON_HMAC_KEY, `visitor:${event.anonId}`);
  let visitorLimit;
  try {
    visitorLimit = await env.VISITOR_RATE_LIMITER.limit({ key: visitorHash });
  } catch (_) {
    return json({ error: "service_unavailable" }, 503, corsHeaders(origin));
  }
  if (!visitorLimit.success) return rateLimited(origin);

  const sessionHash = await hmacHex(env.ANON_HMAC_KEY, `session:${event.sessionId}`);
  const dedupeKey = await hmacHex(env.ANON_HMAC_KEY, `event:${event.eventId}`);
  const client = parseClient(request.headers.get("User-Agent") || "");
  const location = safeLocation(request);

  await env.DB.prepare(
    `INSERT OR IGNORE INTO events (
      event_id, site_id, received_at, occurred_at, visitor_hash, session_hash,
      route, title, referrer_origin, browser, os, device,
      country, region, city, is_bot, dedupe_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      event.eventId,
      siteId,
      receivedAt.toISOString(),
      occurredAt,
      visitorHash,
      sessionHash,
      event.path,
      event.title,
      event.referrer.origin,
      client.browser,
      client.os,
      client.device,
      location.country,
      location.region,
      location.city,
      client.bot ? 1 : 0,
      dedupeKey
    )
    .run();

  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "eightold-analytics-ingest" });
    }

    const origin = request.headers.get("Origin") || "";
    if (!allowedOrigins(env).has(origin)) return json({ error: "origin_not_allowed" }, 403);

    if (url.pathname === "/v1/events" && request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (url.pathname === "/v1/events" && request.method === "POST") {
      return handleEvent(request, env, origin);
    }
    return json({ error: "not_found" }, 404, corsHeaders(origin));
  },

  async scheduled(_controller, env) {
    if (!env.DB) return;
    const configuredDays = Number(env.RETENTION_DAYS);
    const retentionDays = Number.isFinite(configuredDays)
      ? Math.min(365, Math.max(30, configuredDays))
      : 90;
    const cutoff = new Date(Date.now() - retentionDays * 86400000).toISOString();
    await env.DB.prepare("DELETE FROM events WHERE received_at < ?").bind(cutoff).run();
  }
};
