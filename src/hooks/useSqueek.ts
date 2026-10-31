import { useCallback, useEffect, useRef, useState } from "react";
import {
  BlockTracker,
  CORE_API,
  STATUS_API,
  fetchJson,
  parseCore,
  parseWheel,
  type CoreSnapshot,
  type WheelSnapshot,
} from "../lib/squeek";

export function useSqueek(onBlock: () => void) {
  const [core, setCore] = useState<CoreSnapshot | null>(null);
  const [wheel, setWheel] = useState<WheelSnapshot | null>(null);
  const [coreError, setCoreError] = useState(false);
  const [wheelError, setWheelError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const tracker = useRef(new BlockTracker());
  const callback = useRef(onBlock);
  callback.current = onBlock;
  const request = useRef<AbortController | null>(null);
  const refresh = useCallback(async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const results = await Promise.allSettled([
      fetchJson(CORE_API, controller.signal).then(({ payload, serverAt }) => {
        const value = parseCore(payload, Date.now(), serverAt);
        if (controller.signal.aborted) return;
        if (tracker.current.accept(value)) callback.current();
        setCore(value);
        setCoreError(false);
      }),
      fetchJson(STATUS_API, controller.signal).then(({ payload }) => {
        const value = parseWheel(payload);
        if (!controller.signal.aborted) {
          setWheel(value);
          setWheelError(false);
        }
      }),
    ]);
    if (!controller.signal.aborted) {
      if (results[0].status === "rejected") setCoreError(true);
      if (results[1].status === "rejected") setWheelError(true);
      setLoading(false);
    }
    request.current = null;
  }, []);
  useEffect(() => {
    void refresh();
    const poll = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 15000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    const visibility = () => {
      if (!document.hidden) void refresh();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", visibility);
      request.current?.abort();
    };
  }, [refresh]);
  return {
    core,
    wheel,
    loading,
    coreStale: coreError || (!!core && now - core.fetchedAt > 45000),
    wheelStale:
      wheelError ||
      (!!wheel && (now > wheel.expiresAt || now - wheel.fetchedAt > 45000)),
    now,
    refresh,
  };
}
