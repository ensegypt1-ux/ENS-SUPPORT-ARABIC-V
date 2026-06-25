/**
 * Tracks in-flight async work so stale responses cannot leave UI stuck loading.
 * Always call `finish()` in `finally`; only apply data updates when `isActive()`.
 */
export function createRequestScope() {
  let generation = 0;

  return {
    begin() {
      generation += 1;
      return generation;
    },
    isActive(id: number) {
      return id === generation;
    },
    finish(id: number, onComplete: () => void) {
      if (id === generation) {
        onComplete();
      }
    },
  };
}

export type RequestScope = ReturnType<typeof createRequestScope>;

/** Reject fetches that exceed a time budget so loaders always exit. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = "Request timed out"
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
