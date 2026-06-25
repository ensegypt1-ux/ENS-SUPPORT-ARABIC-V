"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createRequestScope, withTimeout } from "@/lib/async/request-scope";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import type {
  ConversationWithParticipants,
  Message,
} from "@/types/realtime";

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

function patchConversationWithMessage(
  conversation: ConversationWithParticipants,
  message: Message,
  userId: string
): ConversationWithParticipants {
  const fromSelf = message.sender_id === userId;

  return {
    ...conversation,
    last_message_at: message.created_at,
    lastMessage: {
      id: message.id,
      content: message.content,
      sender_id: message.sender_id,
      sender_name: message.sender_name,
      created_at: message.created_at,
      is_deleted: message.is_deleted,
    },
    unreadCount: fromSelf
      ? conversation.unreadCount
      : (conversation.unreadCount || 0) + 1,
  };
}

export function useRealtimeConversations(
  userId: string | null,
  options?: { archivedOnly?: boolean; activeConversationId?: string | null }
) {
  const archivedOnly = options?.archivedOnly ?? false;
  const activeConversationId = options?.activeConversationId ?? null;
  const [conversations, setConversations] = useState<
    ConversationWithParticipants[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { socket } = useSocketConnection(userId);
  const requestScopeRef = useRef(createRequestScope());
  const hasLoadedRef = useRef(false);
  const activeConversationIdRef = useRef(activeConversationId);
  const refreshRef = useRef<
    (options?: { background?: boolean }) => Promise<void>
  >(async () => {});

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

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

    const handleGuestInboxChanged = () => {
      void refreshRef.current({ background: true });
    };

    const handleMessageCreated = (message: Message) => {
      if (!message.conversation_id) return;

      setConversations((current) => {
        const index = current.findIndex(
          (item) => item.id === message.conversation_id
        );

        if (index === -1) {
          void refreshRef.current({ background: true });
          return current;
        }

        const conversation = current[index];
        const isActive =
          activeConversationIdRef.current === message.conversation_id;
        const updated = patchConversationWithMessage(
          conversation,
          message,
          userId
        );

        if (isActive) {
          updated.unreadCount = conversation.unreadCount;
        }

        const next = current.filter((item) => item.id !== conversation.id);
        next.unshift(updated);
        return sortConversations(next);
      });
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
    socket.on("chat:message:created", handleMessageCreated);
    socket.on("chat:conversation:removed", handleConversationRemoved);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("chat:conversation:upsert", handleConversationUpsert);
      socket.off("chat:guest:inbox:changed", handleGuestInboxChanged);
      socket.off("chat:message:created", handleMessageCreated);
      socket.off("chat:conversation:removed", handleConversationRemoved);
      socket.off("connect", handleConnect);
    };
  }, [archivedOnly, socket, userId]);

  return { conversations, loading, error, refreshConversations };
}
