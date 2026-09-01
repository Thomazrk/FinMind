import { useEffect, useState } from "react";
import { translateError, type AppError } from "../lib/errors";
import type { Unsubscribe } from "./firestore";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

/**
 * Wraps a Firestore onSnapshot subscription. `subscribe` must be stable —
 * pass it through useCallback or define it outside the component.
 */
export function useSubscription<T>(
  subscribe: (onData: (v: T) => void, onError: (e: unknown) => void) => Unsubscribe,
  deps: unknown[] = [],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    setState({ data: null, loading: true, error: null });
    let unsubscribe: Unsubscribe | undefined;
    try {
      unsubscribe = subscribe(
        (v) => setState({ data: v, loading: false, error: null }),
        (e) => setState({ data: null, loading: false, error: translateError(e) }),
      );
    } catch (e) {
      setState({ data: null, loading: false, error: translateError(e) });
    }
    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
