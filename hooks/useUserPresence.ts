"use client";

import { useCallback, useEffect, useState } from "react";

import { useSocketConnection } from "@/hooks/useSocketConnection";
import type { UserPresenceState } from "@/types/realtime";

const PRESENCE_READY_TIMEOUT_MS = 5_000;

export function useUserPresence(userId: string | null) {
  const [presenceMap, setPresenceMap] = useState<Map<string, UserPresenceState>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { socket, isConnected } = useSocketConnection(userId);

  useEffect(() => {
    if (!userId) {
      setPresenceMap(new Map());
      setLoading(false);
      setError(null);
      return;
    }

    if (!socket) {
      setLoading(false);
      return;
    }

    let ready = false;

    const markReady = () => {
      if (ready) return;
      ready = true;
      setLoading(false);
      setError(null);
    };

    const handleSnapshot = (presence: UserPresenceState[]) => {
      const nextMap = new Map<string, UserPresenceState>();
      presence.forEach((entry) => {
        nextMap.set(entry.user_id, entry);
      });
      setPresenceMap(nextMap);
      markReady();
    };

    const handleUpdate = (presence: UserPresenceState) => {
      setPresenceMap((current) => {
        const next = new Map(current);

        if (presence.status === "offline") {
          next.delete(presence.user_id);
        } else {
          next.set(presence.user_id, presence);
        }

        return next;
      });
      markReady();
    };

    const handleConnect = () => {
      setError(null);
    };

    socket.on("presence:snapshot", handleSnapshot);
    socket.on("presence:updated", handleUpdate);
    socket.on("connect", handleConnect);

    const timeoutId = setTimeout(() => {
      if (!ready) {
        setLoading(false);
        if (!socket.connected) {
          setError(new Error("تعذّر الاتصال بخدمة الحضور"));
        }
      }
    }, PRESENCE_READY_TIMEOUT_MS);

    return () => {
      clearTimeout(timeoutId);
      socket.off("presence:snapshot", handleSnapshot);
      socket.off("presence:updated", handleUpdate);
      socket.off("connect", handleConnect);
    };
  }, [socket, userId]);

  const getUserPresence = useCallback(
    (targetUserId: string) =>
      (userId ? presenceMap : new Map()).get(targetUserId) || null,
    [presenceMap, userId]
  );

  const isUserOnline = useCallback(
    (targetUserId: string) =>
      ((userId ? presenceMap : new Map()).get(targetUserId)?.status ||
        "offline") === "online",
    [presenceMap, userId]
  );

  return {
    presenceMap: userId ? presenceMap : new Map(),
    loading: Boolean(userId && loading),
    error,
    isConnected,
    getUserPresence,
    isUserOnline,
  };
}
