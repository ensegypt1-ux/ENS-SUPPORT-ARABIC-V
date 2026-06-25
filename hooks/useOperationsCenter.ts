"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSocketConnection } from "@/hooks/useSocketConnection";
import type { OperationsCenterSnapshot } from "@/lib/operations/types";

const REFRESH_INTERVAL_MS = 30_000;

export function useOperationsCenter(userId: string | null) {
  const [snapshot, setSnapshot] = useState<OperationsCenterSnapshot | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket, isConnected } = useSocketConnection(userId);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);

  const refresh = useCallback(async (options?: { background?: boolean }) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (!options?.background) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/admin/operations-center", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        success: boolean;
        data?: OperationsCenterSnapshot;
        error?: string;
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || "تعذّر تحميل مركز العمليات");
      }

      setSnapshot(payload.data);
      setError(null);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "تعذّر تحميل مركز العمليات"
      );
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      void refresh({ background: true });
    }, 800);
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;
    void refresh();
  }, [refresh, userId]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      void refresh({ background: true });
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refresh, userId]);

  useEffect(() => {
    if (!socket || !userId) return;

    const handleRealtime = () => scheduleRefresh();

    socket.on("ops:center:changed", handleRealtime);
    socket.on("chat:guest:inbox:changed", handleRealtime);
    socket.on("chat:conversation:upsert", handleRealtime);
    socket.on("presence:updated", handleRealtime);
    socket.on("notification:created", handleRealtime);
    socket.on("connect", handleRealtime);

    return () => {
      socket.off("ops:center:changed", handleRealtime);
      socket.off("chat:guest:inbox:changed", handleRealtime);
      socket.off("chat:conversation:upsert", handleRealtime);
      socket.off("presence:updated", handleRealtime);
      socket.off("notification:created", handleRealtime);
      socket.off("connect", handleRealtime);
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [scheduleRefresh, socket, userId]);

  return {
    snapshot,
    loading,
    refreshing,
    error,
    isConnected,
    refresh,
  };
}
