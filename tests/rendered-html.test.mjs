import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Farm2Home prototype", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Farm2Home/);
  assert.match(html, /Fresh from local farms/i);
  assert.match(html, /Shop fresh produce/i);
  assert.match(html, /farm cluster/i);
  assert.doesNotMatch(html, /signin-with-chatgpt|oai-authenticated-user/i);
});

test("server-renders the /login page with credentials", async () => {
  const response = await render("/login");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Farm2Home/);
  assert.match(html, /Sign in to Farm2Home/i);
  assert.match(html, /Hardcoded Credentials/i);
  assert.match(html, /admin/i);
  assert.match(html, /farm2home123/i);
});

test("validates hardcoded credentials correctly", async () => {
  const { validateCredentials } = await import("../services/authService.ts");
  
  // Valid credentials
  const validUser = validateCredentials("admin", "farm2home123");
  assert.equal(validUser.success, true);
  if (validUser.success) {
    assert.equal(validUser.user.username, "admin");
    assert.equal(validUser.user.role, "admin");
  }

  // Also accepts email
  const validEmail = validateCredentials("admin@farm2home.com", "farm2home123");
  assert.equal(validEmail.success, true);

  // Invalid password
  const invalidPass = validateCredentials("admin", "wrongpass");
  assert.equal(invalidPass.success, false);

  // Invalid user
  const invalidUser = validateCredentials("someoneelse", "farm2home123");
  assert.equal(invalidUser.success, false);
});

