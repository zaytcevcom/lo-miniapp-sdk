export class MiniAppError extends Error {
  constructor(
    public readonly code: "unsupported" | "timeout" | "cancelled" | "failed",
    message = code,
  ) {
    super(message);
    this.name = "MiniAppError";
  }
}
/** Settles once; timeout/abort remove listeners even when the host never replies. */
export function withHostCallback<T>(
  start: (finish: (error: unknown, value?: T) => void) => void,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    let done = false;
    const timeout = options.timeoutMs ?? 6000;
    if (!Number.isFinite(timeout) || timeout <= 0) {
      reject(new RangeError("timeoutMs must be positive"));
      return;
    }
    const finish = (error: unknown, value?: T) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(value as T);
    };
    const abort = () => finish(new MiniAppError("cancelled"));
    const timer = setTimeout(
      () => finish(new MiniAppError("timeout")),
      timeout,
    );
    options.signal?.addEventListener("abort", abort, { once: true });
    if (options.signal?.aborted) {
      abort();
      return;
    }
    try {
      start(finish);
    } catch (error) {
      finish(error);
    }
  });
}
