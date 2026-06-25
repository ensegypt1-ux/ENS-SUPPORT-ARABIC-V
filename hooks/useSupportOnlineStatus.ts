"use client";

import { useEffect, useRef, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";

type SupportAvailabilitySnapshot = {
  online: boolean;
  count: number;
  availableCount: number;
  connectedCount: number;
};

async function fetchSupportAvailability(): Promise<SupportAvailabilitySnapshot> {
  const res = await fetch("/api/public/support-status", { cache: "no-store" });
  const data = (await res.json()) as SupportAvailabilitySnapshot;
  return {
    online: Boolean(data.online),
    count: data.count ?? 0,
    availableCount: data.availableCount ?? 0,
    connectedCount: data.connectedCount ?? 0,
  };
}

/**
 * Public support readiness for the widget (available + connected agents).
 * Polls as fallback; listens for realtime socket updates when connected.
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

    const apply = (next: boolean) => {
      if (cancelled || onlineRef.current === next) return;
      onlineRef.current = next;
      setOnline(next);
    };

    const poll = async () => {
      try {
        const snapshot = await fetchSupportAvailability();
        apply(snapshot.online);
      } catch {
        apply(false);
      }
    };

    void poll();
    const interval = setInterval(() => {
      void poll();
    }, 30000);

    const socket = getSocketClient();
    const handleChanged = (snapshot: SupportAvailabilitySnapshot) => {
      apply(Boolean(snapshot.online));
    };

    socket.on("support:availability:changed", handleChanged);

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket.off("support:availability:changed", handleChanged);
    };
  }, [enabled]);

  return online;
}

export async function readSupportOnline(): Promise<boolean> {
  try {
    const snapshot = await fetchSupportAvailability();
    return snapshot.online;
  } catch {
    return false;
  }
}
