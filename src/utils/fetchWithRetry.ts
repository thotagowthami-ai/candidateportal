export type FetchWithRetryOptions = RequestInit & {
  retries?: number;
  timeoutMs?: number;
  backoffMs?: number;
};

export async function fetchWithRetry(input: RequestInfo, options: FetchWithRetryOptions = {}): Promise<Response> {
  const { retries = 3, timeoutMs = 8000, backoffMs = 500, ...fetchOptions } = options;
  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(input, { ...fetchOptions, signal: controller.signal });
      clearTimeout(id);
      // Retry on server errors (5xx)
      if (!res.ok && res.status >= 500) {
        attempt++;
        if (attempt > retries) return res;
        await delay(backoffMs * Math.pow(2, attempt - 1));
        continue;
      }
      return res;
    } catch (err) {
      clearTimeout(id);
      attempt++;
      if (attempt > retries) throw err;
      await delay(backoffMs * Math.pow(2, attempt - 1));
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default fetchWithRetry;
