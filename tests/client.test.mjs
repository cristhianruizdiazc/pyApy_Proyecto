import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@pyapy/contracts/client";
test("cliente mobile usa bearer e idempotencia, nunca cookies", async () => {
  let seen;
  const api = createClient({
    clientType: "mobile",
    getToken: () => "token",
    fetcher: async (url, options) => {
      seen = { url, ...options };
      return { ok: true, json: async () => ({ ok: true }) };
    },
  });
  await api("/reservations", {
    method: "POST",
    key: "stable-key",
    body: { guests: 2 },
  });
  assert.equal(seen.credentials, "omit");
  assert.equal(seen.headers.Authorization, "Bearer token");
  assert.equal(seen.headers["Idempotency-Key"], "stable-key");
  assert.equal(seen.headers["X-Client"], "mobile");
});
test("cliente corta una peticion que no responde para permitir retry offline", async () => {
  const api = createClient({
    timeoutMs: 10,
    fetcher: async (url, { signal }) =>
      new Promise((resolve, reject) =>
        signal.addEventListener("abort", () => reject(new Error("timeout")), {
          once: true,
        }),
      ),
  });
  await assert.rejects(() => api("/reservations"), /timeout/);
});
