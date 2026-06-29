"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useGuestSocketConnection } from "@/hooks/useGuestSocketConnection";
import { readSupportOnline } from "@/hooks/useSupportOnlineStatus";
import { disconnectGuestSocket } from "@/lib/socket/client-guest";
import type { Message } from "@/types/realtime";

const STORAGE_KEY = "guest-live-chat-session-v1";
const PENDING_KEY = "guest-live-chat-pending-v1";

export type GuestLiveChatSession = {
  guestSessionId: string;
  conversationId: string;
  guestAccessToken: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone: string;
};

export type PendingLiveChat = {
  guestSessionId: string;
  chatLogId?: string;
  departmentSlug?: string;
};

function storageKey(namespace?: string) {
  return namespace ? `${STORAGE_KEY}:${namespace}` : STORAGE_KEY;
}

function pendingStorageKey(namespace?: string) {
  return namespace ? `${PENDING_KEY}:${namespace}` : PENDING_KEY;
}

function loadSession(namespace?: string): GuestLiveChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(namespace));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestLiveChatSession;
    if (
      parsed.guestSessionId &&
      parsed.conversationId &&
      parsed.guestAccessToken &&
      parsed.guestPhone?.trim()
    ) {
      return parsed;
    }
    localStorage.removeItem(storageKey(namespace));
  } catch {
    /* ignore */
  }
  return null;
}

function loadPending(
  guestSessionId: string,
  namespace?: string
): PendingLiveChat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(pendingStorageKey(namespace));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingLiveChat;
    if (parsed.guestSessionId === guestSessionId) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function saveSession(session: GuestLiveChatSession, namespace?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(namespace), JSON.stringify(session));
}

function savePending(pending: PendingLiveChat, namespace?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(pendingStorageKey(namespace), JSON.stringify(pending));
}

function clearStoredSession(namespace?: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(namespace));
}

function clearStoredPending(namespace?: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(pendingStorageKey(namespace));
}

function bootstrapKey(namespace: string | undefined, guestSessionId: string) {
  return `${namespace ?? ""}:${guestSessionId}`;
}

function isOptimisticMessage(message: Message) {
  return message.id.startsWith("temp-");
}

/** Merge messages by id; drop optimistic placeholders superseded by a real message. */
function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map<string, Message>();

  for (const message of current) {
    byId.set(message.id, message);
  }

  for (const message of incoming) {
    for (const [id, existing] of byId.entries()) {
      if (
        isOptimisticMessage(existing) &&
        existing.content === message.content &&
        existing.sender_id === message.sender_id
      ) {
        byId.delete(id);
      }
    }
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

function appendMessage(current: Message[], message: Message): Message[] {
  return mergeMessages(current, [message]);
}

export function useGuestLiveChat(options: {
  guestSessionId: string;
  storageNamespace?: string;
  guestLiveChatEnabled?: boolean;
}) {
  const { guestSessionId, storageNamespace, guestLiveChatEnabled = true } =
    options;

  const [session, setSession] = useState<GuestLiveChatSession | null>(null);
  const [pendingLiveChat, setPendingLiveChat] = useState<PendingLiveChat | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  /** True only during the first session restore for this visitor key. */
  const [bootstrapping, setBootstrapping] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionRef = useRef<GuestLiveChatSession | null>(null);
  const pendingLiveChatRef = useRef<PendingLiveChat | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const bootstrappedKeyRef = useRef<string | null>(null);
  const bootstrapInFlightRef = useRef<Promise<void> | null>(null);
  const startInFlightRef = useRef<Promise<{ success: boolean; offline: boolean }> | null>(
    null
  );
  const guestLiveChatEnabledRef = useRef(guestLiveChatEnabled);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  guestLiveChatEnabledRef.current = guestLiveChatEnabled;

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    pendingLiveChatRef.current = pendingLiveChat;
  }, [pendingLiveChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const socketAuth = session
    ? {
        guestSessionId: session.guestSessionId,
        guestAccessToken: session.guestAccessToken,
        conversationId: session.conversationId,
      }
    : null;

  const { socket, isConnected } = useGuestSocketConnection(socketAuth);

  const persistSession = useCallback(
    (next: GuestLiveChatSession) => {
      sessionRef.current = next;
      setSession(next);
      saveSession(next, storageNamespace);
      clearStoredPending(storageNamespace);
      setPendingLiveChat(null);
      pendingLiveChatRef.current = null;
    },
    [storageNamespace]
  );

  const persistPending = useCallback(
    (next: PendingLiveChat) => {
      pendingLiveChatRef.current = next;
      setPendingLiveChat(next);
      savePending(next, storageNamespace);
    },
    [storageNamespace]
  );

  const clearPendingLiveChat = useCallback(() => {
    clearStoredPending(storageNamespace);
    pendingLiveChatRef.current = null;
    setPendingLiveChat(null);
  }, [storageNamespace]);

  const invalidateSession = useCallback(() => {
    clearStoredSession(storageNamespace);
    sessionRef.current = null;
    setSession(null);
    setMessages([]);
    bootstrappedKeyRef.current = null;
    disconnectGuestSocket();
  }, [storageNamespace]);

  const loadMessages = useCallback(async (active: GuestLiveChatSession) => {
    const params = new URLSearchParams({
      guestSessionId: active.guestSessionId,
      guestAccessToken: active.guestAccessToken,
    });
    const res = await fetch(
      `/api/guest/chat/conversations/${active.conversationId}/messages?${params}`
    );

    if (res.status === 403 || res.status === 401) {
      invalidateSession();
      return false;
    }

    if (!res.ok) {
      return false;
    }

    const data = (await res.json()) as { messages: Message[] };
    const nextMessages = data.messages || [];
    setMessages((current) =>
      nextMessages.length > 0 || current.length === 0
        ? mergeMessages(current, nextMessages)
        : current
    );
    return true;
  }, [invalidateSession]);

  const resumeExistingSession = useCallback(
    async (existing: GuestLiveChatSession) => {
      if (!sessionRef.current) {
        sessionRef.current = existing;
        setSession(existing);
      }
      if (messagesRef.current.length === 0) {
        await loadMessages(existing);
      }
      bootstrappedKeyRef.current = bootstrapKey(storageNamespace, guestSessionId);
      setHydrated(true);
      return { success: true as const, offline: false };
    },
    [guestSessionId, loadMessages, storageNamespace]
  );

  const bootstrapSession = useCallback(async () => {
    if (!guestSessionId) return;

    const key = bootstrapKey(storageNamespace, guestSessionId);

    if (bootstrappedKeyRef.current === key && sessionRef.current) {
      setHydrated(true);
      return;
    }

    if (bootstrapInFlightRef.current) {
      await bootstrapInFlightRef.current;
      return;
    }

    const stored = loadSession(storageNamespace);
    const pending = loadPending(guestSessionId, storageNamespace);

    if (pending) {
      pendingLiveChatRef.current = pending;
      setPendingLiveChat(pending);
    }

    if (!stored || stored.guestSessionId !== guestSessionId) {
      bootstrappedKeyRef.current = key;
      setHydrated(true);
      return;
    }

    const run = async () => {
      const isFirstBootstrap = bootstrappedKeyRef.current !== key;
      const shouldShowBootstrap =
        isFirstBootstrap && messagesRef.current.length === 0;

      if (!sessionRef.current) {
        sessionRef.current = stored;
        setSession(stored);
      }

      if (shouldShowBootstrap) {
        setBootstrapping(true);
      }

      try {
        const loaded = await loadMessages(stored);
        if (loaded) {
          bootstrappedKeyRef.current = key;
          return;
        }

        const res = await fetch("/api/guest/chat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestSessionId: stored.guestSessionId,
            guestPhone: stored.guestPhone,
          }),
        });
        const data = await res.json();

        if (res.status === 403 || res.status === 401) {
          invalidateSession();
          return;
        }

        if (res.status === 400 && data.requiresProfile) {
          invalidateSession();
          return;
        }

        if (data.success && data.data) {
          const next: GuestLiveChatSession = {
            guestSessionId: data.data.guestSessionId,
            conversationId: data.data.conversationId,
            guestAccessToken: data.data.guestAccessToken,
            guestName: data.data.guestName || stored.guestName,
            guestEmail: data.data.guestEmail || stored.guestEmail,
            guestPhone: data.data.guestPhone || stored.guestPhone,
          };
          persistSession(next);
          if (Array.isArray(data.data.messages) && data.data.messages.length > 0) {
            setMessages((current) => mergeMessages(current, data.data.messages));
          }
          bootstrappedKeyRef.current = key;
        } else {
          invalidateSession();
        }
      } catch {
        /* keep cached session/messages on transient errors */
      } finally {
        setBootstrapping(false);
        setHydrated(true);
        bootstrapInFlightRef.current = null;
      }
    };

    bootstrapInFlightRef.current = run();
    await bootstrapInFlightRef.current;
  }, [
    guestSessionId,
    invalidateSession,
    loadMessages,
    persistSession,
    storageNamespace,
  ]);

  useEffect(() => {
    if (!guestSessionId) return;

    const stored = loadSession(storageNamespace);
    if (stored?.guestSessionId === guestSessionId && !sessionRef.current) {
      sessionRef.current = stored;
      setSession(stored);
    }

    const pending = loadPending(guestSessionId, storageNamespace);
    if (pending && !pendingLiveChatRef.current) {
      pendingLiveChatRef.current = pending;
      setPendingLiveChat(pending);
    }

    void bootstrapSession();
    // Re-bootstrap only when the visitor key or storage namespace changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestSessionId, storageNamespace]);

  useEffect(() => {
    if (!socket || !session) return;

    const handleMessageCreated = (message: Message) => {
      if (message.conversation_id !== session.conversationId) return;
      setMessages((current) => appendMessage(current, message));
    };

    socket.on("chat:message:created", handleMessageCreated);

    return () => {
      socket.off("chat:message:created", handleMessageCreated);
    };
  }, [session?.conversationId, socket]);

  const requestLiveChat = useCallback(
    async (input?: { chatLogId?: string; departmentSlug?: string }) => {
      if (!guestLiveChatEnabledRef.current) {
        return { success: false as const, offline: true };
      }

      if (!guestSessionId) {
        return { success: false as const, offline: false };
      }

      const stored = loadSession(storageNamespace);
      if (
        stored?.guestSessionId === guestSessionId ||
        sessionRef.current?.guestSessionId === guestSessionId
      ) {
        const active = sessionRef.current ?? stored;
        if (active) {
          return resumeExistingSession(active);
        }
      }

      const online = await readSupportOnline();
      if (!online) {
        return { success: false as const, offline: true };
      }

      persistPending({
        guestSessionId,
        chatLogId: input?.chatLogId,
        departmentSlug: input?.departmentSlug,
      });

      return { success: true as const, offline: false, pending: true as const };
    },
    [guestSessionId, persistPending, resumeExistingSession, storageNamespace]
  );

  const startLiveChat = useCallback(
    async (input: {
      chatLogId?: string;
      departmentSlug?: string;
      guestName?: string;
      guestEmail?: string;
      guestPhone: string;
    }) => {
      if (!guestLiveChatEnabledRef.current) {
        return { success: false as const, offline: true };
      }

      if (!guestSessionId) {
        return { success: false as const, offline: false };
      }

      const phone = input.guestPhone.trim();
      if (!phone) {
        setError("رقم الهاتف مطلوب");
        return { success: false as const, offline: false };
      }

      const stored = loadSession(storageNamespace);
      const existing =
        sessionRef.current?.guestSessionId === guestSessionId
          ? sessionRef.current
          : stored?.guestSessionId === guestSessionId
            ? stored
            : null;

      if (existing?.guestPhone?.trim()) {
        return resumeExistingSession(existing);
      }

      if (startInFlightRef.current) {
        return startInFlightRef.current;
      }

      const pending = pendingLiveChatRef.current;
      const run = async (): Promise<{ success: boolean; offline: boolean }> => {
        setError(null);

        try {
          const online = await readSupportOnline();
          if (!online) {
            return { success: false as const, offline: true };
          }

          const res = await fetch("/api/guest/chat/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              guestSessionId,
              chatLogId: input.chatLogId ?? pending?.chatLogId,
              departmentSlug: input.departmentSlug ?? pending?.departmentSlug,
              guestName: input.guestName,
              guestEmail: input.guestEmail,
              guestPhone: phone,
            }),
          });

          const data = await res.json();

          if (res.status === 503 || data.offline) {
            return { success: false as const, offline: true };
          }

          if (res.status === 400 && data.requiresProfile) {
            setError("يرجى إدخال رقم هاتف صالح");
            return { success: false as const, offline: false };
          }

          if (!res.ok || !data.success) {
            setError(data.error || "تعذّر بدء المحادثة");
            return { success: false as const, offline: false };
          }

          const next: GuestLiveChatSession = {
            guestSessionId: data.data.guestSessionId,
            conversationId: data.data.conversationId,
            guestAccessToken: data.data.guestAccessToken,
            guestName: input.guestName || data.data.guestName,
            guestEmail: input.guestEmail || data.data.guestEmail,
            guestPhone: data.data.guestPhone || phone,
          };

          persistSession(next);
          setMessages((current) =>
            mergeMessages(current, data.data.messages || [])
          );
          bootstrappedKeyRef.current = bootstrapKey(
            storageNamespace,
            guestSessionId
          );
          setHydrated(true);
          return { success: true as const, offline: false };
        } catch {
          setError("خطأ في الشبكة");
          return { success: false as const, offline: false };
        } finally {
          startInFlightRef.current = null;
        }
      };

      startInFlightRef.current = run();
      return startInFlightRef.current;
    },
    [
      guestSessionId,
      persistSession,
      resumeExistingSession,
      storageNamespace,
    ]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session) return false;
      const trimmed = content.trim();
      if (!trimmed) return false;

      setError(null);

      const optimisticId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: optimisticId,
        conversation_id: session.conversationId,
        sender_id: `guest:${session.guestSessionId}`,
        sender_name: session.guestName || "زائر",
        content: trimmed,
        attachments: [],
        reactions: [],
        read_by: [],
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
        is_edited: false,
        edited_at: null,
        reply_to_id: null,
        edit_history: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMessages((current) => appendMessage(current, optimistic));

      try {
        const res = await fetch("/api/guest/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: session.conversationId,
            guestSessionId: session.guestSessionId,
            guestAccessToken: session.guestAccessToken,
            content: trimmed,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setMessages((current) =>
            current.filter((m) => m.id !== optimisticId)
          );
          setError(data.error || "تعذّر إرسال الرسالة");
          return false;
        }

        setMessages((current) => appendMessage(current, data.data));
        return true;
      } catch {
        setMessages((current) => current.filter((m) => m.id !== optimisticId));
        setError("خطأ في الشبكة");
        return false;
      }
    },
    [session]
  );

  const updateProfile = useCallback(
    async (fields: {
      guestName?: string;
      guestEmail?: string;
      guestPhone?: string;
    }) => {
      if (!session) return;
      const res = await fetch("/api/guest/chat/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: session.conversationId,
          guestSessionId: session.guestSessionId,
          guestAccessToken: session.guestAccessToken,
          ...fields,
        }),
      });
      if (res.ok) {
        persistSession({
          ...session,
          guestName: fields.guestName ?? session.guestName,
          guestEmail: fields.guestEmail ?? session.guestEmail,
          guestPhone: fields.guestPhone ?? session.guestPhone,
        });
      }
    },
    [persistSession, session]
  );

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket?.connected || !session) return;
      socket.emit("chat:typing:set", {
        conversationId: session.conversationId,
        isTyping,
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit("chat:typing:set", {
            conversationId: session.conversationId,
            isTyping: false,
          });
        }, 4000);
      }
    },
    [session, socket]
  );

  const endLiveChat = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const active = sessionRef.current;
    if (!active) {
      return { success: false, error: "لا توجد محادثة مباشرة نشطة" };
    }

    setError(null);

    try {
      const res = await fetch("/api/guest/chat/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: active.conversationId,
          guestSessionId: active.guestSessionId,
          guestAccessToken: active.guestAccessToken,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const message = data.error || "تعذّر إنهاء المحادثة";
        setError(message);
        return { success: false, error: message };
      }

      invalidateSession();
      return { success: true };
    } catch {
      const message = "خطأ في الشبكة";
      setError(message);
      return { success: false, error: message };
    }
  }, [invalidateSession]);

  return {
    session,
    pendingLiveChat,
    messages,
    bootstrapping,
    hydrated,
    error,
    isConnected,
    requestLiveChat,
    startLiveChat,
    sendMessage,
    updateProfile,
    setTyping,
    endLiveChat,
    clearPendingLiveChat,
    reloadMessages: () =>
      session ? loadMessages(session) : Promise.resolve(false),
  };
}
