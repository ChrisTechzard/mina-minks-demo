import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('transient API failures', () => {
  it('retries a read-only GET once after a 5xx response', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: 'waking up' }, 503))
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    const result = api.getServices();
    await vi.advanceTimersByTimeAsync(2000);

    await expect(result).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('never retries a booking write, so no duplicate booking can be created', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.createBooking({} as never)).rejects.toMatchObject({
      code: 'network_error',
      status: 0,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a clear network error when both read attempts fail', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchMock);

    const result = api.getServices();
    const assertion = expect(result).rejects.toMatchObject({
      code: 'network_error',
      message: /may still be waking up/i,
    });
    await vi.advanceTimersByTimeAsync(2000);

    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
