import test from "node:test";
import assert from "node:assert/strict";
import worker, { normalizeReferrer, parseClient, validateEvent } from "../ingest/src/index.js";

const validEvent = {
  event_id: "2aa7af75-a0ef-4fd3-89d7-85e12dcb4a97",
  type: "pageview",
  path: "/go/interview/Algorithm/Hot200/README.md",
  title: "算法 Hot 200",
  anon_id: "22c58f60-251b-47f4-b5d4-e90b1afaa925",
  session_id: "53bc85bb-a1c2-44ce-a6cc-31f6ae18ee6d",
  occurred_at: "2026-07-16T08:00:00.000Z",
  referrer: "https://example.com/search?q=private#result"
};

test("referrer keeps only the origin", () => {
  assert.deepEqual(normalizeReferrer(validEvent.referrer), {
    origin: "https://example.com",
    path: ""
  });
});

test("event validation accepts canonical UUIDs and rejects traversal", () => {
  assert.equal(validateEvent(validEvent).value.path, validEvent.path);
  assert.equal(validateEvent({ ...validEvent, path: "/go/readme?token=secret#part" }).value.path, "/go/readme");
  assert.equal(validateEvent({ ...validEvent, path: "/../../secret" }).error, "invalid_path");
  assert.equal(validateEvent({ ...validEvent, anon_id: "visitor-1" }).error, "invalid_anon_id");
});

test("client parser reports coarse browser, OS and device only", () => {
  const client = parseClient("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1");
  assert.deepEqual(client, { browser: "Safari", os: "iOS", device: "mobile", bot: false });
});

test("ingest rejects a foreign browser origin", async () => {
  const response = await worker.fetch(
    new Request("https://ingest.example/v1/events", { method: "POST", headers: { Origin: "https://evil.example" } }),
    { ALLOWED_ORIGINS: "https://plastictong.github.io" }
  );
  assert.equal(response.status, 403);
});

test("valid event stores hashes rather than raw anonymous IDs", async () => {
  let inserted = null;
  const DB = {
    prepare(sql) {
      return {
        bind(...values) {
          inserted = { sql, values };
          return { run: async () => ({ success: true }) };
        }
      };
    }
  };
  const request = new Request("https://ingest.example/v1/events", {
    method: "POST",
    headers: {
      Origin: "https://plastictong.github.io",
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 Chrome/126.0 Safari/537.36"
    },
    body: JSON.stringify({ ...validEvent, occurred_at: new Date().toISOString() })
  });
  Object.defineProperty(request, "cf", { value: { country: "CN", region: "Shanghai", city: "Shanghai" } });
  const response = await worker.fetch(request, {
    DB,
    ANON_HMAC_KEY: "test-only-secret-that-is-long-enough",
    ALLOWED_ORIGINS: "https://plastictong.github.io",
    SITE_ID: "eightold",
    GLOBAL_RATE_LIMITER: { limit: async () => ({ success: true }) },
    VISITOR_RATE_LIMITER: { limit: async () => ({ success: true }) }
  });
  assert.equal(response.status, 204);
  assert.ok(inserted);
  assert.equal(inserted.values.includes(validEvent.anon_id), false);
  assert.equal(inserted.values.includes(validEvent.session_id), false);
  assert.match(inserted.values[4], /^[0-9a-f]{64}$/);
  assert.match(inserted.values[5], /^[0-9a-f]{64}$/);
});

test("ingest rejects an oversized streamed body without Content-Length", async () => {
  const request = new Request("https://ingest.example/v1/events", {
    method: "POST",
    headers: {
      Origin: "https://plastictong.github.io",
      "Content-Type": "application/json"
    },
    body: "x".repeat(9000)
  });
  const response = await worker.fetch(request, {
    DB: {},
    ANON_HMAC_KEY: "test-only-secret-that-is-long-enough",
    ALLOWED_ORIGINS: "https://plastictong.github.io",
    SITE_ID: "eightold",
    GLOBAL_RATE_LIMITER: { limit: async () => ({ success: true }) },
    VISITOR_RATE_LIMITER: { limit: async () => ({ success: true }) }
  });
  assert.equal(response.status, 413);
});

test("ingest returns 429 with Retry-After when the global limit is reached", async () => {
  const request = new Request("https://ingest.example/v1/events", {
    method: "POST",
    headers: {
      Origin: "https://plastictong.github.io",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(validEvent)
  });
  const response = await worker.fetch(request, {
    DB: {},
    ANON_HMAC_KEY: "test-only-secret-that-is-long-enough",
    ALLOWED_ORIGINS: "https://plastictong.github.io",
    SITE_ID: "eightold",
    GLOBAL_RATE_LIMITER: { limit: async () => ({ success: false }) },
    VISITOR_RATE_LIMITER: { limit: async () => ({ success: true }) }
  });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
});
