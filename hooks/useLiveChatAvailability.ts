"use client";

import { useCallback, useEffect, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";
import type { LiveChatAvailabilityStatus } from "@/lib/chat/availability";

type UseLiveChatAvailabilityOptions = {
  userId: string;
  enabled?: boolean;
};

export function useLiveChatAvailability({
  userId,
  enabled = true,
}: UseLiveChatAvailabilityOptions) {
  const [status, setStatus] = useState<LiveChatAvailabilityStatus>("unavailable");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/staff/live-chat/availability", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("تعذّر قراءة حالة التوفر");
      const data = (await res.json()) as { status: LiveChatAvailabilityStatus };
      setStatus(data.status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر قراءة حالة التوفر");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    void refresh();
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const socket = getSocketClient();

    const handleAvailability = (payload: {
      userId: string;
      status: LiveChatAvailabilityStatus;
    }) => {
      if (payload.userId !== userId) return;
      setStatus(payload.status);
    };

    socket.on("chat:availability:changed", handleAvailability);
    return () => {
      socket.off("chat:availability:changed", handleAvailability);
    };
  }, [enabled, userId]);

  const setAvailability = useCallback(
    async (next: LiveChatAvailabilityStatus) => {
      setUpdating(true);
      setError(null);
      try {
        const res = await fetch("/api/staff/live-chat/availability", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: next }),
        });
        const data = (await res.json()) as {
          status?: LiveChatAvailabilityStatus;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error || "تعذّر تحديث حالة التوفر");
        }
        setStatus(data.status ?? next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "تعذّر تحديث حالة التوفر");
        throw err;
      } finally {
        setUpdating(false);
      }
    },
    []
  );

  const toggle = useCallback(async () => {
    const next = status === "available" ? "unavailable" : "available";
    await setAvailability(next);
  }, [setAvailability, status]);

  return {
    status,
    isAvailable: status === "available",
    loading,
    updating,
    error,
    refresh,
    setAvailability,
    toggle,
  };
}
