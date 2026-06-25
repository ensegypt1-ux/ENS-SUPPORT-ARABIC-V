"use client";

import { useEffect, useRef, useState } from "react";

async function readSupportOnline(): Promise<boolean> {
  try {
    const res = await fetch("/api/public/support-status", {
      cache: "no-store",
    });
    const data = (await res.json()) as { online: boolean };
    return Boolean(data.online);
  } catch {
    return false;
  }
}

/**
 * Polls public support presence for widget UI (header badge, CTA).
 * Isolated from guest live chat session state so polling does not
 * re-render the chat panel.
 */
export function useSupportOnlineStatus(enabled = true) {
  const [online, setOnline] = useState<boolean | null>(null);
  const onlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled) {
      onlineRef.current = null;
      setOnline(null);
      return;
    }

    let cancelled = false;

    const poll = async () => {
      const next = await readSupportOnline();
      if (cancelled || onlineRef.current === next) return;
      onlineRef.current = next;
      setOnline(next);
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [enabled]);

  return online;
}

export { readSupportOnline };
