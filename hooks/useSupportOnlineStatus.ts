"use client";

import { useEffect, useRef, useState } from "react";
import { getPublicSupportSocket } from "@/lib/socket/client";

type SupportAvailabilitySnapshot = {
  online: boolean;
  count: number;
  availableCount: number;
  connectedCount: number;
  readyCount?: number;
};

async function fetchSupportAvailability(): Promise<SupportAvailabilitySnapshot> {
  const res = await fetch("/api/public/support-status", { cache: "no-store" });
  const data = (await res.json()) as SupportAvailabilitySnapshot;
  return {
    online: Boolean(data.online),
    count: data.count ?? 0,
    availableCount: data.availableCount ?? 0,
    connectedCount: data.connectedCount ?? 0,
    readyCount: data.readyCount ?? 0,
  };
}

/**
 * Customer-facing support availability (toggle opt-in only).
 * Uses a dedicated public socket for instant updates; polls only as fallback.
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

    const socket = getPublicSupportSocket();
    const handleChanged = (snapshot: SupportAvailabilitySnapshot) => {
      apply(Boolean(snapshot.online));
    };

    const handleConnect = () => {
      void poll();
    };

    socket.on("support:availability:changed", handleChanged);
    socket.on("connect", handleConnect);

    if (!socket.connected) {
      socket.connect();
    }

    const interval = setInterval(() => {
      void poll();
    }, 120_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket.off("support:availability:changed", handleChanged);
      socket.off("connect", handleConnect);
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
