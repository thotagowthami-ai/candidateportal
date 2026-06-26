export type FetchWithRetryOptions = RequestInit & {
  retries?: number;
  timeoutMs?: number;
  backoffMs?: number;
  allowRetry?: boolean;
};

export async function fetchWithRetry(input: RequestInfo, options: FetchWithRetryOptions = {}): Promise<Response> {
  const { retries = 3, timeoutMs = 8000, backoffMs = 500, allowRetry, ...fetchOptions } = options;
  const method = (fetchOptions.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  const canRetry = allowRetry ?? ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS'].includes(method);
  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const signal = options.signal
        ? AbortSignal.any([controller.signal, options.signal])
        : controller.signal;
      const res = await fetch(input, { ...fetchOptions, signal });
      clearTimeout(id);
      // Retry on server errors (5xx)
      if (canRetry && !res.ok && res.status >= 500) {
        attempt++;
        if (attempt > retries) return res;
        await delay(backoffMs * Math.pow(2, attempt - 1));
        continue;
      }
      return res;
    } catch (err: any) {
      clearTimeout(id);
      if (options.signal?.aborted || (err.name === 'AbortError' && options.signal?.aborted)) {
        throw err;
      }
      attempt++;
      if (!canRetry || attempt > retries) throw err;
      await delay(backoffMs * Math.pow(2, attempt - 1));
    }
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default fetchWithRetry;
