"use client";

import { useEffect, useState } from "react";

import {
  getGuestSocketClient,
  type GuestSocketAuth,
} from "@/lib/socket/client-guest";

export function useGuestSocketConnection(auth: GuestSocketAuth | null) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!auth) {
      setIsConnected(false);
      return;
    }

    const socket = getGuestSocketClient(auth);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [auth?.conversationId, auth?.guestAccessToken, auth?.guestSessionId]);

  return {
    socket: auth ? getGuestSocketClient(auth) : null,
    isConnected,
  };
}
