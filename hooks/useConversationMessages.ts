"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { createRequestScope, withTimeout } from "@/lib/async/request-scope";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import type { Message, TypingIndicator } from "@/types/realtime";

const MESSAGE_FETCH_TIMEOUT_MS = 20_000;

export function useConversationMessages(
  conversationId: string | null,
  userId: string | null
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { socket } = useSocketConnection(userId);
  const requestScopeRef = useRef(createRequestScope());
  const hasLoadedRef = useRef(false);
  const refreshRef = useRef<
    (options?: { background?: boolean }) => Promise<void>
  >(async () => {});

  const refreshMessages = useCallback(
    async (options?: { background?: boolean }) => {
      const scope = requestScopeRef.current;
      const requestId = scope.begin();

      if (!conversationId || !userId) {
        setMessages([]);
        setTypingUsers([]);
        setError(null);
        setLoading(false);
        hasLoadedRef.current = false;
        return;
      }

      const showBlockingLoader = !options?.background || !hasLoadedRef.current;
      if (showBlockingLoader) {
        setLoading(true);
      }

      try {
        const response = await withTimeout(
          fetch(`/api/chat/conversations/${conversationId}/messages`, {
            cache: "no-store",
          }),
          MESSAGE_FETCH_TIMEOUT_MS,
          "تعذّر تحميل الرسائل — انتهت المهلة"
        );

        if (!response.ok) {
          throw new Error("تعذّر تحميل الرسائل");
        }

        const payload = (await response.json()) as { messages: Message[] };

        if (!scope.isActive(requestId)) return;

        setMessages(payload.messages || []);
        setError(null);
        hasLoadedRef.current = true;
      } catch (fetchError) {
        if (!scope.isActive(requestId)) return;

        console.error("Error fetching messages:", fetchError);
        setError(fetchError as Error);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, userId]
  );

  refreshRef.current = refreshMessages;

  useEffect(() => {
    setMessages([]);
    setTypingUsers([]);
    setError(null);
    hasLoadedRef.current = false;

    if (!conversationId || !userId) {
      setLoading(false);
      return;
    }

    void refreshRef.current();
  }, [conversationId, userId]);

  useEffect(() => {
    if (!socket || !conversationId || !userId) {
      return;
    }

    const joinConversation = () => {
      socket.emit("chat:conversation:join", { conversationId });
    };

    const handleMessageCreated = (message: Message) => {
      if (message.conversation_id !== conversationId) {
        return;
      }

      setMessages((current) => {
        if (current.some((entry) => entry.id === message.id)) {
          return current;
        }

        return [...current, message];
      });
    };

    const handleMessageUpdated = (message: Message) => {
      if (message.conversation_id !== conversationId) {
        return;
      }

      setMessages((current) =>
        current.map((entry) => (entry.id === message.id ? message : entry))
      );
    };

    const handleMessageDeleted = ({
      conversationId: deletedConversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => {
      if (deletedConversationId !== conversationId) {
        return;
      }

      setMessages((current) =>
        current.filter((message) => message.id !== messageId)
      );
    };

    const handleMessagesRead = ({
      conversationId: readConversationId,
      messageIds,
      userId: readerId,
    }: {
      conversationId: string;
      messageIds: string[];
      userId: string;
    }) => {
      if (readConversationId !== conversationId) {
        return;
      }

      setMessages((current) =>
        current.map((message) =>
          messageIds.includes(message.id) && !message.read_by.includes(readerId)
            ? {
                ...message,
                read_by: [...message.read_by, readerId],
              }
            : message
        )
      );
    };

    const handleTypingState = ({
      conversationId: typingConversationId,
      typingUsers: nextTypingUsers,
    }: {
      conversationId: string;
      typingUsers: TypingIndicator[];
    }) => {
      if (typingConversationId !== conversationId) {
        return;
      }

      setTypingUsers(
        nextTypingUsers.filter((typingUser) => typingUser.user_id !== userId)
      );
    };

    const handleConnect = () => {
      joinConversation();
      void refreshRef.current({ background: true });
    };

    joinConversation();
    socket.on("connect", handleConnect);
    socket.on("chat:message:created", handleMessageCreated);
    socket.on("chat:message:updated", handleMessageUpdated);
    socket.on("chat:message:deleted", handleMessageDeleted);
    socket.on("chat:messages:read", handleMessagesRead);
    socket.on("chat:typing:state", handleTypingState);

    return () => {
      socket.emit("chat:typing:set", {
        conversationId,
        isTyping: false,
      });
      socket.emit("chat:conversation:leave", { conversationId });
      socket.off("connect", handleConnect);
      socket.off("chat:message:created", handleMessageCreated);
      socket.off("chat:message:updated", handleMessageUpdated);
      socket.off("chat:message:deleted", handleMessageDeleted);
      socket.off("chat:messages:read", handleMessagesRead);
      socket.off("chat:typing:state", handleTypingState);
    };
  }, [conversationId, socket, userId]);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !conversationId) {
        return;
      }

      socket.emit("chat:typing:set", { conversationId, isTyping });
    },
    [conversationId, socket]
  );

  return {
    messages,
    typingUsers,
    loading,
    error,
    refreshMessages,
    setTyping,
  };
}
