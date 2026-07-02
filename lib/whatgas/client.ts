const BASE_URL = 'https://services.ozonaction.org/TradeNamesServiceV2/WhatODSSvc.svc';
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 4;
const BASE_BACKOFF_MS = 500;

export class WhatGasApiError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'WhatGasApiError';
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a WhatGas endpoint with a timeout and exponential backoff retry (jittered).
 * Only retries on network errors / 5xx — a 4xx is treated as a permanent failure.
 */
async function fetchWithRetry(url: string, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timeout);

    if (res.status >= 500 && attempt < MAX_RETRIES) {
      const backoff = BASE_BACKOFF_MS * 2 ** attempt + Math.random() * 200;
      await sleep(backoff);
      return fetchWithRetry(url, attempt + 1);
    }

    return res;
  } catch (err) {
    clearTimeout(timeout);
    if (attempt < MAX_RETRIES) {
      const backoff = BASE_BACKOFF_MS * 2 ** attempt + Math.random() * 200;
      await sleep(backoff);
      return fetchWithRetry(url, attempt + 1);
    }
    throw new WhatGasApiError(`WhatGas request failed after ${MAX_RETRIES + 1} attempts: ${url}`, err);
  }
}

export async function fetchAllRefrigerantsRaw(): Promise<unknown> {
  const res = await fetchWithRetry(`${BASE_URL}/GetAllODSIdentity`);
  if (!res.ok) {
    throw new WhatGasApiError(`GetAllODSIdentity returned ${res.status} ${res.statusText}`);
  }
  try {
    return await res.json();
  } catch (err) {
    throw new WhatGasApiError('GetAllODSIdentity returned invalid JSON', err);
  }
}

export async function fetchRefrigerantDetailRaw(id: number): Promise<unknown> {
  const res = await fetchWithRetry(`${BASE_URL}/GetODS?id=${encodeURIComponent(String(id))}`);
  if (!res.ok) {
    throw new WhatGasApiError(`GetODS?id=${id} returned ${res.status} ${res.statusText}`);
  }
  try {
    return await res.json();
  } catch (err) {
    throw new WhatGasApiError(`GetODS?id=${id} returned invalid JSON`, err);
  }
}
