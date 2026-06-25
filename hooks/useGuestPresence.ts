"use client";

import { useCallback, useEffect, useState } from "react";

import { useSocketConnection } from "@/hooks/useSocketConnection";
import type { GuestPresenceState } from "@/types/realtime";

export function useGuestPresence(userId: string | null) {
  const [presenceMap, setPresenceMap] = useState<Map<string, GuestPresenceState>>(
    new Map()
  );
  const { socket } = useSocketConnection(userId);

  useEffect(() => {
    if (!socket || !userId) {
      return;
    }

    const handleSnapshot = (presence: GuestPresenceState[]) => {
      const nextMap = new Map<string, GuestPresenceState>();
      presence.forEach((entry) => {
        nextMap.set(entry.conversation_id, entry);
      });
      setPresenceMap(nextMap);
    };

    const handleUpdate = (presence: GuestPresenceState) => {
      setPresenceMap((current) => {
        const next = new Map(current);
        if (presence.status === "offline") {
          next.delete(presence.conversation_id);
        } else {
          next.set(presence.conversation_id, presence);
        }
        return next;
      });
    };

    socket.on("guest:presence:snapshot", handleSnapshot);
    socket.on("guest:presence:updated", handleUpdate);

    return () => {
      socket.off("guest:presence:snapshot", handleSnapshot);
      socket.off("guest:presence:updated", handleUpdate);
    };
  }, [socket, userId]);

  const isGuestOnline = useCallback(
    (conversationId: string) =>
      (socket && userId
        ? presenceMap.get(conversationId)?.status
        : undefined) === "online",
    [presenceMap, socket, userId]
  );

  return { isGuestOnline };
}
