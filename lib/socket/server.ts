import type { Server as HttpServer } from "node:http";

import { Server } from "socket.io";

import { auth } from "@/lib/auth";
import {
  ensureConversationAccess,
  ensureConversationParticipant,
  getConversationSummaryForUser,
  getParticipantIdsForConversation,
} from "@/lib/chat/server";
import { validateGuestAccess } from "@/lib/chat/guest-chat";
import { findRequestById } from "@/lib/request-utils";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  SocketGuestUser,
  SocketSessionUser,
} from "@/lib/socket/types";
import type {
  ClientNotification,
  GuestPresenceState,
  Message,
  SerializedComment,
  TypingIndicator,
  UserPresenceState,
} from "@/types/realtime";
import type { UserRole } from "@/types";

type AppSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type PresenceEntry = {
  sockets: Set<string>;
  status: "online" | "away";
  lastSeen: Date;
};

type GuestPresenceEntry = {
  sockets: Set<string>;
  lastSeen: Date;
};

const socketGlobals = globalThis as typeof globalThis & {
  __socketServer?: AppSocketServer;
  __presenceEntries?: Map<string, PresenceEntry>;
  __guestPresenceEntries?: Map<string, GuestPresenceEntry>;
  __typingEntries?: Map<string, Map<string, TypingIndicator>>;
  __typingTimeouts?: Map<string, NodeJS.Timeout>;
};

function getPresenceEntries() {
  if (!socketGlobals.__presenceEntries) {
    socketGlobals.__presenceEntries = new Map();
  }

  return socketGlobals.__presenceEntries;
}

function getGuestPresenceEntries() {
  if (!socketGlobals.__guestPresenceEntries) {
    socketGlobals.__guestPresenceEntries = new Map();
  }

  return socketGlobals.__guestPresenceEntries;
}

function getTypingEntries() {
  if (!socketGlobals.__typingEntries) {
    socketGlobals.__typingEntries = new Map();
  }

  return socketGlobals.__typingEntries;
}

function getTypingTimeouts() {
  if (!socketGlobals.__typingTimeouts) {
    socketGlobals.__typingTimeouts = new Map();
  }

  return socketGlobals.__typingTimeouts;
}

function roomForPublicSupport() {
  return "public:support";
}

function roomForStaffInbox() {
  return "staff:inbox";
}

function roomForUser(userId: string) {
  return `user:${userId}`;
}

function roomForConversation(conversationId: string) {
  return `conversation:${conversationId}`;
}

function roomForTicket(ticketId: string) {
  return `ticket:${ticketId}`;
}

function buildHeadersFromRequestHeaders(headersObject: Record<string, string | string[] | undefined>) {
  const headers = new Headers();

  Object.entries(headersObject).forEach(([key, value]) => {
    if (typeof value === "undefined") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => headers.append(key, entry));
      return;
    }

    headers.append(key, value);
  });

  return headers;
}

function toPresenceState(
  userId: string,
  entry: PresenceEntry
): UserPresenceState {
  return {
    user_id: userId,
    status: entry.status,
    last_seen: entry.lastSeen.toISOString(),
    updated_at: entry.lastSeen.toISOString(),
  };
}

function getPresenceSnapshot() {
  return Array.from(getPresenceEntries().entries()).map(([userId, entry]) =>
    toPresenceState(userId, entry)
  );
}

export function getOnlineUserIds(): string[] {
  return Array.from(getPresenceEntries().keys());
}

function toGuestPresenceState(
  conversationId: string,
  entry: GuestPresenceEntry
): GuestPresenceState {
  return {
    conversation_id: conversationId,
    status: entry.sockets.size > 0 ? "online" : "offline",
    updated_at: entry.lastSeen.toISOString(),
  };
}

function getGuestPresenceSnapshot(): GuestPresenceState[] {
  return Array.from(getGuestPresenceEntries().entries())
    .filter(([, entry]) => entry.sockets.size > 0)
    .map(([conversationId, entry]) =>
      toGuestPresenceState(conversationId, entry)
    );
}

export function isGuestConversationOnline(conversationId: string): boolean {
  const entry = getGuestPresenceEntries().get(conversationId);
  return (entry?.sockets.size || 0) > 0;
}

function emitGuestPresence(
  io: AppSocketServer,
  conversationId: string,
  entry: GuestPresenceEntry
) {
  const payload = toGuestPresenceState(conversationId, entry);
  io.to(roomForConversation(conversationId)).emit("guest:presence:updated", payload);
  io.emit("guest:presence:updated", payload);
}

function markGuestOnline(io: AppSocketServer, conversationId: string, socketId: string) {
  const guestPresenceEntries = getGuestPresenceEntries();
  const existing = guestPresenceEntries.get(conversationId) || {
    sockets: new Set<string>(),
    lastSeen: new Date(),
  };

  existing.sockets.add(socketId);
  existing.lastSeen = new Date();
  guestPresenceEntries.set(conversationId, existing);
  emitGuestPresence(io, conversationId, existing);
}

function markGuestOffline(
  io: AppSocketServer,
  conversationId: string,
  socketId: string
) {
  const guestPresenceEntries = getGuestPresenceEntries();
  const existing = guestPresenceEntries.get(conversationId);
  if (!existing) return;

  existing.sockets.delete(socketId);
  existing.lastSeen = new Date();

  if (existing.sockets.size === 0) {
    guestPresenceEntries.delete(conversationId);
  } else {
    guestPresenceEntries.set(conversationId, existing);
  }

  emitGuestPresence(io, conversationId, existing);
}

function getTypingUsers(conversationId: string) {
  return Array.from(
    getTypingEntries().get(conversationId)?.values() || []
  ).sort((left, right) =>
    left.updated_at.localeCompare(right.updated_at)
  );
}

function emitTypingState(io: AppSocketServer, conversationId: string) {
  io.to(roomForConversation(conversationId)).emit("chat:typing:state", {
    conversationId,
    typingUsers: getTypingUsers(conversationId),
  });
}

function setTypingState(
  io: AppSocketServer,
  conversationId: string,
  actor: { id: string; name: string | null },
  isTyping: boolean
) {
  const typingEntries = getTypingEntries();
  const typingTimeouts = getTypingTimeouts();
  const timeoutKey = `${conversationId}:${actor.id}`;

  if (typingTimeouts.has(timeoutKey)) {
    clearTimeout(typingTimeouts.get(timeoutKey));
    typingTimeouts.delete(timeoutKey);
  }

  if (!isTyping) {
    const conversationTyping = typingEntries.get(conversationId);
    if (conversationTyping) {
      conversationTyping.delete(actor.id);
      if (conversationTyping.size === 0) {
        typingEntries.delete(conversationId);
      }
    }

    emitTypingState(io, conversationId);
    return;
  }

  const conversationTyping =
    typingEntries.get(conversationId) || new Map<string, TypingIndicator>();
  conversationTyping.set(actor.id, {
    conversation_id: conversationId,
    user_id: actor.id,
    user_name: actor.name,
    updated_at: new Date().toISOString(),
  });
  typingEntries.set(conversationId, conversationTyping);
  emitTypingState(io, conversationId);

  const timeout = setTimeout(() => {
    setTypingState(io, conversationId, actor, false);
  }, 5000);

  typingTimeouts.set(timeoutKey, timeout);
}

function clearTypingStateForUser(io: AppSocketServer, userId: string) {
  const typingEntries = getTypingEntries();
  const typingTimeouts = getTypingTimeouts();

  Array.from(typingEntries.entries()).forEach(([conversationId, conversationTyping]) => {
    if (!conversationTyping.has(userId)) {
      return;
    }

    conversationTyping.delete(userId);
    const timeoutKey = `${conversationId}:${userId}`;
    if (typingTimeouts.has(timeoutKey)) {
      clearTimeout(typingTimeouts.get(timeoutKey));
      typingTimeouts.delete(timeoutKey);
    }

    if (conversationTyping.size === 0) {
      typingEntries.delete(conversationId);
    }

    emitTypingState(io, conversationId);
  });
}

async function canAccessTicket(user: SocketSessionUser, ticketId: string) {
  const { request } = await findRequestById(ticketId);
  if (!request) {
    return false;
  }

  if (user.role === "admin" || user.role === "support") {
    return true;
  }

  return request.customerId === user.id;
}

async function getSocketSessionUser(headersObject: Record<string, string | string[] | undefined>) {
  const session = await auth.api.getSession({
    headers: buildHeadersFromRequestHeaders(headersObject),
  });

  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name || "User",
    email: session.user.email || undefined,
    role: (session.user as { role?: string }).role,
  } satisfies SocketSessionUser;
}

type GuestAuthPayload = {
  type?: string;
  guestSessionId?: string;
  guestAccessToken?: string;
  conversationId?: string;
};

function isPublicSupportAuth(authPayload: GuestAuthPayload): boolean {
  return authPayload.type === "public";
}

async function getSocketGuestUser(
  authPayload: GuestAuthPayload
): Promise<SocketGuestUser | null> {
  if (
    authPayload.type !== "guest" ||
    !authPayload.guestSessionId ||
    !authPayload.guestAccessToken ||
    !authPayload.conversationId
  ) {
    return null;
  }

  const conversation = await validateGuestAccess({
    guestSessionId: authPayload.guestSessionId,
    guestAccessToken: authPayload.guestAccessToken,
    conversationId: authPayload.conversationId,
  });

  if (!conversation) return null;

  return {
    guestSessionId: authPayload.guestSessionId,
    conversationId: authPayload.conversationId,
    displayName: conversation.guestName?.trim() || "زائر",
  };
}

export function getSocketServer() {
  return socketGlobals.__socketServer || null;
}

export function initializeSocketServer(httpServer: HttpServer) {
  if (socketGlobals.__socketServer) {
    return socketGlobals.__socketServer;
  }

  const io: AppSocketServer = new Server(httpServer, {
    path: "/socket.io",
    serveClient: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const authPayload = (socket.handshake.auth || {}) as GuestAuthPayload;

      if (isPublicSupportAuth(authPayload)) {
        socket.data.publicSupport = true;
        next();
        return;
      }

      const user = await getSocketSessionUser(
        socket.request.headers as Record<string, string | string[] | undefined>
      );

      if (user) {
        socket.data.user = user;
        next();
        return;
      }

      const guest = await getSocketGuestUser(authPayload);
      if (guest) {
        socket.data.guest = guest;
        next();
        return;
      }

      next(new Error("Unauthorized"));
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.publicSupport) {
      socket.join(roomForPublicSupport());
      void (async () => {
        const { getSupportAvailabilitySnapshot } = await import(
          "@/lib/chat/availability"
        );
        socket.emit(
          "support:availability:changed",
          await getSupportAvailabilitySnapshot()
        );
      })();
      return;
    }

    const user = socket.data.user;
    const guest = socket.data.guest;

    if (guest) {
      markGuestOnline(io, guest.conversationId, socket.id);
      socket.join(roomForConversation(guest.conversationId));
      socket.emit("chat:typing:state", {
        conversationId: guest.conversationId,
        typingUsers: getTypingUsers(guest.conversationId),
      });

      socket.on("chat:conversation:join", async ({ conversationId }) => {
        if (conversationId !== guest.conversationId) return;
        socket.join(roomForConversation(conversationId));
        socket.emit("chat:typing:state", {
          conversationId,
          typingUsers: getTypingUsers(conversationId),
        });
      });

      socket.on("chat:conversation:leave", ({ conversationId }) => {
        if (conversationId !== guest.conversationId) return;
        socket.leave(roomForConversation(conversationId));
        setTypingState(
          io,
          conversationId,
          { id: `guest:${guest.guestSessionId}`, name: guest.displayName },
          false
        );
      });

      socket.on("chat:typing:set", async ({ conversationId, isTyping }) => {
        if (conversationId !== guest.conversationId) return;
        setTypingState(
          io,
          conversationId,
          { id: `guest:${guest.guestSessionId}`, name: guest.displayName },
          isTyping
        );
      });

      socket.on("disconnect", () => {
        markGuestOffline(io, guest.conversationId, socket.id);
        setTypingState(
          io,
          guest.conversationId,
          { id: `guest:${guest.guestSessionId}`, name: guest.displayName },
          false
        );
      });

      return;
    }

    if (!user) return;

    const presenceEntries = getPresenceEntries();
    const existing = presenceEntries.get(user.id) || {
      sockets: new Set<string>(),
      status: "online" as const,
      lastSeen: new Date(),
    };

    existing.sockets.add(socket.id);
    existing.status = "online";
    existing.lastSeen = new Date();
    presenceEntries.set(user.id, existing);

    socket.join(roomForUser(user.id));
    if (user.role === "admin" || user.role === "support") {
      socket.join(roomForStaffInbox());
    }
    socket.emit("presence:snapshot", getPresenceSnapshot());
    socket.emit("guest:presence:snapshot", getGuestPresenceSnapshot());
    io.emit("presence:updated", toPresenceState(user.id, existing));

    if (user.role === "admin" || user.role === "support") {
      void (async () => {
        const { getLiveChatAvailability } = await import(
          "@/lib/chat/availability"
        );
        const status = await getLiveChatAvailability(user.id);
        socket.emit("chat:availability:changed", {
          userId: user.id,
          status,
          updatedAt: new Date().toISOString(),
        });
      })();
      void emitSupportAvailabilityChanged();
    }

    socket.on("chat:conversation:join", async ({ conversationId }) => {
      const conversation = await ensureConversationAccess(conversationId, {
        type: "user",
        userId: user.id,
        role: user.role as UserRole | undefined,
      });

      if (!conversation) {
        return;
      }

      socket.join(roomForConversation(conversationId));
      socket.emit("chat:typing:state", {
        conversationId,
        typingUsers: getTypingUsers(conversationId),
      });
    });

    socket.on("chat:conversation:leave", ({ conversationId }) => {
      socket.leave(roomForConversation(conversationId));
      setTypingState(io, conversationId, user, false);
    });

    socket.on("chat:typing:set", async ({ conversationId, isTyping }) => {
      const conversation = await ensureConversationAccess(conversationId, {
        type: "user",
        userId: user.id,
        role: user.role as UserRole | undefined,
      });

      if (!conversation) {
        return;
      }

      socket.join(roomForConversation(conversationId));
      setTypingState(io, conversationId, user, isTyping);
    });

    socket.on("ticket:join", async ({ ticketId }) => {
      if (await canAccessTicket(user, ticketId)) {
        socket.join(roomForTicket(ticketId));
      }
    });

    socket.on("ticket:leave", ({ ticketId }) => {
      socket.leave(roomForTicket(ticketId));
    });

    socket.on("disconnect", () => {
      clearTypingStateForUser(io, user.id);

      const current = presenceEntries.get(user.id);
      if (!current) {
        return;
      }

      current.sockets.delete(socket.id);
      current.lastSeen = new Date();

      if (current.sockets.size === 0) {
        presenceEntries.delete(user.id);
        io.emit("presence:updated", {
          user_id: user.id,
          status: "offline",
          last_seen: current.lastSeen.toISOString(),
          updated_at: current.lastSeen.toISOString(),
        });
        void notifyStaffSupportAvailabilityChange(user, true);
        void (async () => {
          const { markStaffLiveChatUnavailable } = await import(
            "@/lib/chat/availability"
          );
          const next = await markStaffLiveChatUnavailable(user.id);
          if (next === "unavailable") {
            emitLiveChatAvailabilityChanged(user.id, "unavailable");
            await emitSupportAvailabilityChanged();
          }
        })();
        return;
      }

      presenceEntries.set(user.id, current);
      io.emit("presence:updated", toPresenceState(user.id, current));
    });
  });

  socketGlobals.__socketServer = io;
  return io;
}

export async function emitConversationSummaryToParticipants(conversationId: string) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  const participantIds = await getParticipantIdsForConversation(conversationId);
  await Promise.all(
    participantIds.map(async (userId) => {
      if (userId.startsWith("guest:")) return;
      const summary = await getConversationSummaryForUser(
        conversationId,
        userId,
        undefined
      );
      if (summary) {
        io.to(roomForUser(userId)).emit("chat:conversation:upsert", summary);
      }
    })
  );
}

export async function emitConversationSummaryToStaff(
  conversationId: string,
  staffUserIds?: string[]
) {
  const io = getSocketServer();
  if (!io) return;

  const { findStaffMembersByIds } = await import("@/lib/socket/presence-utils");
  const staffMembers = await findStaffMembersByIds(staffUserIds ?? []);

  const emittedUserIds = new Set<string>();

  await Promise.all(
    staffMembers.map(async ({ userId, role }) => {
      if (emittedUserIds.has(userId)) return;
      emittedUserIds.add(userId);

      const summary = await getConversationSummaryForUser(
        conversationId,
        userId,
        role
      );
      if (summary) {
        io.to(roomForUser(userId)).emit("chat:conversation:upsert", summary);
      }
    })
  );
}

/** Push per-agent summaries to staff currently connected in the inbox room. */
export async function emitConversationSummaryToConnectedStaffInbox(
  conversationId: string
) {
  const io = getSocketServer();
  if (!io) return;

  const sockets = await io.in(roomForStaffInbox()).fetchSockets();
  const staffByUserId = new Map<
    string,
    Extract<UserRole, "admin" | "support">
  >();

  for (const socket of sockets) {
    const user = socket.data.user;
    if (!user?.id) continue;
    if (user.role !== "admin" && user.role !== "support") continue;
    staffByUserId.set(user.id, user.role === "admin" ? "admin" : "support");
  }

  await Promise.all(
    Array.from(staffByUserId.entries()).map(async ([userId, role]) => {
      const summary = await getConversationSummaryForUser(
        conversationId,
        userId,
        role
      );
      if (summary) {
        io.to(roomForUser(userId)).emit("chat:conversation:upsert", summary);
      }
    })
  );
}

export function emitGuestInboxChanged(conversationId: string) {
  const io = getSocketServer();
  if (!io) return;

  io.to(roomForStaffInbox()).emit("chat:guest:inbox:changed", {
    conversationId,
  });
  emitOpsCenterChanged();
}

export function emitOpsCenterChanged() {
  const io = getSocketServer();
  if (!io) return;

  io.to(roomForStaffInbox()).emit("ops:center:changed", {
    at: new Date().toISOString(),
  });
}

export function emitLiveChatAvailabilityChanged(
  userId: string,
  status: "available" | "unavailable"
) {
  const io = getSocketServer();
  if (!io) return;

  const payload = {
    userId,
    status,
    updatedAt: new Date().toISOString(),
  };

  io.to(roomForUser(userId)).emit("chat:availability:changed", payload);
  io.to(roomForStaffInbox()).emit("chat:availability:changed", payload);
}

export async function emitSupportAvailabilityChanged() {
  const io = getSocketServer();
  if (!io) return;

  const { getSupportAvailabilitySnapshot } = await import(
    "@/lib/chat/availability"
  );
  const snapshot = await getSupportAvailabilitySnapshot();

  io.to(roomForPublicSupport()).emit("support:availability:changed", snapshot);
  io.emit("support:availability:changed", snapshot);
  emitOpsCenterChanged();
}

async function notifyStaffSupportAvailabilityChange(
  user: SocketSessionUser,
  wentFullyOffline: boolean
) {
  if (user.role !== "admin" && user.role !== "support") return;
  if (!wentFullyOffline) return;
  await emitSupportAvailabilityChanged();
}

export function emitConversationRemovedToParticipants(
  participantIds: string[],
  conversationId: string
) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  participantIds.forEach((userId) => {
    if (userId.startsWith("guest:")) return;
    io.to(roomForUser(userId)).emit("chat:conversation:removed", {
      conversationId,
    });
  });

  io.emit("chat:conversation:removed", { conversationId });
}

export function emitMessageCreated(message: Message) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForConversation(message.conversation_id)).emit(
    "chat:message:created",
    message
  );
}

/**
 * Guest widget messages are delivered to the conversation room and the shared
 * staff inbox room so agents receive them without relying on per-conversation joins.
 */
export function emitGuestMessageCreated(message: Message) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForConversation(message.conversation_id)).emit(
    "chat:message:created",
    message
  );
  io.to(roomForStaffInbox()).emit("chat:message:created", message);
}

export function emitMessageUpdated(message: Message) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForConversation(message.conversation_id)).emit(
    "chat:message:updated",
    message
  );
}

export function emitMessageDeleted(conversationId: string, messageId: string) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForConversation(conversationId)).emit("chat:message:deleted", {
    conversationId,
    messageId,
  });
}

export function emitMessagesRead(
  conversationId: string,
  messageIds: string[],
  userId: string
) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForConversation(conversationId)).emit("chat:messages:read", {
    conversationId,
    messageIds,
    userId,
    readAt: new Date().toISOString(),
  });
}

export function emitNotificationCreated(
  userId: string,
  notification: ClientNotification
) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForUser(userId)).emit("notification:created", notification);
}

export function emitNotificationUpdated(
  userId: string,
  notification: ClientNotification
) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForUser(userId)).emit("notification:updated", notification);
}

export function emitNotificationDeleted(userId: string, notificationIds: string[]) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForUser(userId)).emit("notification:deleted", { notificationIds });
}

export function emitCommentCreated(ticketId: string, comment: SerializedComment) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForTicket(ticketId)).emit("comment:created", {
    ticketId,
    comment,
  });
}

export function emitCommentUpdated(ticketId: string, comment: SerializedComment) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForTicket(ticketId)).emit("comment:updated", {
    ticketId,
    comment,
  });
}

export function emitCommentDeleted(ticketId: string, commentId: string) {
  const io = getSocketServer();
  if (!io) {
    return;
  }

  io.to(roomForTicket(ticketId)).emit("comment:deleted", {
    ticketId,
    commentId,
  });
}
