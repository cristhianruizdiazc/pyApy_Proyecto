export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
export function createClient({
  baseUrl = "/api/v1",
  getToken = () => null,
  getCsrf = () => null,
  fetcher = fetch,
  clientType = "web",
  timeoutMs = 15000,
} = {}) {
  return async function api(path, { method = "GET", body, key, signal } = {}) {
    const token = await getToken();
    const headers = {
      ...(clientType === "mobile" ? { "X-Client": "mobile" } : {}),
      ...(body && !(body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(getCsrf() ? { "X-CSRF-Token": getCsrf() } : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    };
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const response = await fetcher(`${baseUrl}${path}`, {
        method,
        headers,
        credentials: token || clientType === "mobile" ? "omit" : "include",
        body:
          body instanceof FormData
            ? body
            : body
              ? JSON.stringify(body)
              : undefined,
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new ApiError(
          data.message || "No se pudo completar la operacion.",
          response.status,
          data.code,
        );
      return data;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
    }
  };
}
