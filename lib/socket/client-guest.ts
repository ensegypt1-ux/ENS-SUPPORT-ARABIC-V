"use client";

import { io, type Socket } from "socket.io-client";

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@/lib/socket/types";

type GuestSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let guestSocketInstance: GuestSocket | null = null;

export type GuestSocketAuth = {
  guestSessionId: string;
  guestAccessToken: string;
  conversationId: string;
};

export function getGuestSocketClient(auth: GuestSocketAuth): GuestSocket {
  const existingAuth = guestSocketInstance?.auth as GuestSocketAuth | undefined;

  if (
    guestSocketInstance &&
    existingAuth?.conversationId === auth.conversationId &&
    existingAuth?.guestSessionId === auth.guestSessionId &&
    existingAuth?.guestAccessToken === auth.guestAccessToken
  ) {
    return guestSocketInstance;
  }

  if (
    guestSocketInstance &&
    existingAuth?.conversationId === auth.conversationId
  ) {
    guestSocketInstance.auth = {
      type: "guest",
      guestSessionId: auth.guestSessionId,
      guestAccessToken: auth.guestAccessToken,
      conversationId: auth.conversationId,
    };
    return guestSocketInstance;
  }

  if (guestSocketInstance) {
    guestSocketInstance.disconnect();
  }

  guestSocketInstance = io({
    path: "/socket.io",
    autoConnect: false,
    withCredentials: false,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    auth: {
      type: "guest",
      guestSessionId: auth.guestSessionId,
      guestAccessToken: auth.guestAccessToken,
      conversationId: auth.conversationId,
    },
  });

  return guestSocketInstance;
}

export function disconnectGuestSocket() {
  if (guestSocketInstance) {
    guestSocketInstance.disconnect();
    guestSocketInstance = null;
  }
}
