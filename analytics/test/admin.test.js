import test from "node:test";
import assert from "node:assert/strict";
import worker, { adminEmailIsAllowed, claimsAreValid } from "../admin/src/index.js";

const baseEnv = {
  DB: {},
  ASSETS: { fetch: async () => new Response("asset") },
  SITE_ID: "eightold"
};

test("admin refuses to start until Cloudflare Access is configured", async () => {
  const response = await worker.fetch(new Request("https://admin.example/"), {
    ...baseEnv,
    ACCESS_TEAM_DOMAIN: "https://replace-me.cloudflareaccess.com",
    ACCESS_AUD: "replace-with-cloudflare-access-aud"
  });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "cloudflare_access_not_configured");
});

test("admin rejects a request without an Access JWT", async () => {
  const response = await worker.fetch(new Request("https://admin.example/api/overview"), {
    ...baseEnv,
    ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
    ACCESS_AUD: "configured-audience",
    ADMIN_EMAILS: "admin@example.com"
  });
  assert.equal(response.status, 401);
  assert.equal((await response.json()).error, "unauthorized");
});

test("Access claims require issuer, audience and an unexpired integer exp", () => {
  const env = {
    ACCESS_TEAM_DOMAIN: "https://team.cloudflareaccess.com",
    ACCESS_AUD: "configured-audience"
  };
  const valid = {
    iss: "https://team.cloudflareaccess.com",
    aud: ["configured-audience"],
    exp: 1100,
    iat: 900
  };
  assert.equal(claimsAreValid(valid, env, 1000), true);
  assert.equal(claimsAreValid({ ...valid, exp: undefined }, env, 1000), false);
  assert.equal(claimsAreValid({ ...valid, exp: 999 }, env, 1000), false);
  assert.equal(claimsAreValid({ ...valid, nbf: 1001 }, env, 1000), false);
  assert.equal(claimsAreValid({ ...valid, iat: 1061 }, env, 1000), false);
  assert.equal(claimsAreValid({ ...valid, aud: ["wrong"] }, env, 1000), false);
});

test("admin email allowlist uses normalized exact matches", () => {
  const env = { ADMIN_EMAILS: "Owner@Example.com, second@example.com" };
  assert.equal(adminEmailIsAllowed({ email: "owner@example.com" }, env), true);
  assert.equal(adminEmailIsAllowed({ email: "owner@example.com.evil" }, env), false);
  assert.equal(adminEmailIsAllowed({}, env), false);
});
