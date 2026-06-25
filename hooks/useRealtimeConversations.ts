"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createRequestScope, withTimeout } from "@/lib/async/request-scope";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import type { ConversationWithParticipants } from "@/types/realtime";

function sortConversations(conversations: ConversationWithParticipants[]) {
  return [...conversations].sort((left, right) => {
    const leftDate = new Date(
      left.last_message_at || left.created_at
    ).getTime();
    const rightDate = new Date(
      right.last_message_at || right.created_at
    ).getTime();
    return rightDate - leftDate;
  });
}

export { type ConversationWithParticipants };

const CONVERSATIONS_FETCH_TIMEOUT_MS = 20_000;

export function useRealtimeConversations(
  userId: string | null,
  options?: { archivedOnly?: boolean }
) {
  const archivedOnly = options?.archivedOnly ?? false;
  const [conversations, setConversations] = useState<
    ConversationWithParticipants[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { socket } = useSocketConnection(userId);
  const requestScopeRef = useRef(createRequestScope());
  const hasLoadedRef = useRef(false);
  const conversationsRef = useRef<ConversationWithParticipants[]>([]);
  const refreshRef = useRef<
    (options?: { background?: boolean }) => Promise<void>
  >(async () => {});

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const refreshConversations = useCallback(
    async (refreshOptions?: { background?: boolean }) => {
      const scope = requestScopeRef.current;
      const requestId = scope.begin();

      if (!userId) {
        setConversations([]);
        setError(null);
        setLoading(false);
        hasLoadedRef.current = false;
        return;
      }

      const showBlockingLoader =
        !refreshOptions?.background || !hasLoadedRef.current;
      if (showBlockingLoader) {
        setLoading(true);
      }

      try {
        const url = archivedOnly
          ? "/api/chat/conversations?archived=1"
          : "/api/chat/conversations";
        const response = await withTimeout(
          fetch(url, { cache: "no-store" }),
          CONVERSATIONS_FETCH_TIMEOUT_MS,
          "تعذّر تحميل المحادثات — انتهت المهلة"
        );

        if (!response.ok) {
          throw new Error("تعذّر تحميل المحادثات");
        }

        const payload = (await response.json()) as {
          conversations: ConversationWithParticipants[];
        };

        if (!scope.isActive(requestId)) return;

        setConversations(sortConversations(payload.conversations || []));
        setError(null);
        hasLoadedRef.current = true;
      } catch (fetchError) {
        if (!scope.isActive(requestId)) return;

        console.error("Error fetching conversations:", fetchError);
        setError(fetchError as Error);
      } finally {
        setLoading(false);
      }
    },
    [archivedOnly, userId]
  );

  refreshRef.current = refreshConversations;

  useEffect(() => {
    if (!userId) {
      setConversations([]);
      setError(null);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    hasLoadedRef.current = false;
    setError(null);
    void refreshRef.current();
  }, [archivedOnly, userId]);

  useEffect(() => {
    if (!socket || !userId) {
      return;
    }

    const handleConversationUpsert = (
      conversation: ConversationWithParticipants
    ) => {
      if (archivedOnly) {
        if (conversation.guest_status !== "closed") return;
      } else if (conversation.guest_status === "closed") {
        setConversations((current) =>
          current.filter((item) => item.id !== conversation.id)
        );
        return;
      }

      setConversations((current) => {
        const next = current.filter((item) => item.id !== conversation.id);
        next.unshift(conversation);
        return sortConversations(next);
      });
    };

    const handleGuestInboxChanged = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      if (conversationsRef.current.some((item) => item.id === conversationId)) {
        return;
      }

      void refreshRef.current({ background: true });
    };

    const handleConversationRemoved = ({
      conversationId,
    }: {
      conversationId: string;
    }) => {
      setConversations((current) =>
        current.filter((conversation) => conversation.id !== conversationId)
      );
    };

    const handleConnect = () => {
      void refreshRef.current({ background: true });
    };

    socket.on("chat:conversation:upsert", handleConversationUpsert);
    socket.on("chat:guest:inbox:changed", handleGuestInboxChanged);
    socket.on("chat:conversation:removed", handleConversationRemoved);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("chat:conversation:upsert", handleConversationUpsert);
      socket.off("chat:guest:inbox:changed", handleGuestInboxChanged);
      socket.off("chat:conversation:removed", handleConversationRemoved);
      socket.off("connect", handleConnect);
    };
  }, [archivedOnly, socket, userId]);

  return { conversations, loading, error, refreshConversations };
}
