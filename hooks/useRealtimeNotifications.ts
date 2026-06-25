"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getBellNotifications,
  markAllBellNotificationsAsRead,
  markBellNotificationAsRead,
} from "@/actions/notifications-bell";
import { createRequestScope, withTimeout } from "@/lib/async/request-scope";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import type { ClientNotification } from "@/types/realtime";

const BELL_NOTIFICATIONS_LIMIT = 50;
const BELL_REFRESH_FRESH_MS = 1_500;
const BELL_FETCH_TIMEOUT_MS = 20_000;

type BellNotificationsResult = Awaited<ReturnType<typeof getBellNotifications>>;

const bellNotificationsCache = new Map<
  string,
  { fetchedAt: number; result: BellNotificationsResult }
>();
const bellNotificationsRequests = new Map<
  string,
  Promise<BellNotificationsResult>
>();

function getBellCacheKey(userId: string, limit: number) {
  return `${userId}:${limit}`;
}

function invalidateBellNotificationsCache(userId: string) {
  const keyPrefix = `${userId}:`;

  for (const key of bellNotificationsCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      bellNotificationsCache.delete(key);
    }
  }
}

function loadBellNotifications(
  userId: string,
  limit: number,
  options?: { force?: boolean }
) {
  const cacheKey = getBellCacheKey(userId, limit);

  if (!options?.force) {
    const currentRequest = bellNotificationsRequests.get(cacheKey);
    if (currentRequest) {
      return currentRequest;
    }

    const cached = bellNotificationsCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < BELL_REFRESH_FRESH_MS) {
      return Promise.resolve(cached.result);
    }
  }

  const request = withTimeout(
    getBellNotifications(limit),
    BELL_FETCH_TIMEOUT_MS,
    "تعذّر تحميل الإشعارات — انتهت المهلة"
  ).then((result) => {
    if (result.success) {
      bellNotificationsCache.set(cacheKey, {
        fetchedAt: Date.now(),
        result,
      });
    }

    return result;
  });

  bellNotificationsRequests.set(cacheKey, request);
  const cleanupRequest = () => {
    if (bellNotificationsRequests.get(cacheKey) === request) {
      bellNotificationsRequests.delete(cacheKey);
    }
  };
  request.then(cleanupRequest, cleanupRequest);

  return request;
}

export function useRealtimeNotifications(
  userId: string,
  options?: {
    allowedTypes?: readonly string[];
    onNotificationCreated?: (notification: ClientNotification) => void;
  }
) {
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const requestScopeRef = useRef(createRequestScope());
  const hasLoadedRef = useRef(false);
  const refreshRef = useRef<
    (options?: { force?: boolean; background?: boolean }) => Promise<void>
  >(async () => {});
  const onCreatedRef = useRef(options?.onNotificationCreated);
  const { socket, isConnected } = useSocketConnection(userId);
  const allowedTypes = options?.allowedTypes;
  const allowedTypesKey = allowedTypes?.join(",") ?? "all";

  onCreatedRef.current = options?.onNotificationCreated;

  const filterNotifications = useCallback(
    (items: ClientNotification[]) => {
      if (!allowedTypes || allowedTypes.length === 0) {
        return items;
      }

      return items.filter((notification) =>
        allowedTypes.includes(notification.type)
      );
    },
    [allowedTypes]
  );

  const refreshNotifications = useCallback(
    async (refreshOptions?: { force?: boolean; background?: boolean }) => {
      const scope = requestScopeRef.current;
      const requestId = scope.begin();

      if (!userId) {
        setNotifications([]);
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
        const result = await loadBellNotifications(
          userId,
          BELL_NOTIFICATIONS_LIMIT,
          refreshOptions
        );

        if (!scope.isActive(requestId)) return;

        if (!result.success) {
          throw new Error("تعذّر تحميل الإشعارات");
        }

        setNotifications(filterNotifications(result.notifications));
        setError(null);
        hasLoadedRef.current = true;
      } catch (refreshError) {
        if (!scope.isActive(requestId)) return;

        console.error("Failed to refresh notifications:", refreshError);
        setError(refreshError as Error);
      } finally {
        setLoading(false);
      }
    },
    [filterNotifications, userId]
  );

  refreshRef.current = refreshNotifications;

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setError(null);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }

    hasLoadedRef.current = false;
    setError(null);
    void refreshRef.current();
  }, [userId, allowedTypesKey]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handleCreated = (notification: ClientNotification) => {
      if (
        allowedTypes &&
        allowedTypes.length > 0 &&
        !allowedTypes.includes(notification.type)
      ) {
        return;
      }

      onCreatedRef.current?.(notification);

      setNotifications((current) => {
        const next = current.filter((entry) => entry.id !== notification.id);
        return [notification, ...next];
      });
    };

    const handleUpdated = (notification: ClientNotification) => {
      setNotifications((current) =>
        current.map((entry) =>
          entry.id === notification.id ? notification : entry
        )
      );
    };

    const handleDeleted = ({
      notificationIds,
    }: {
      notificationIds: string[];
    }) => {
      setNotifications((current) =>
        current.filter(
          (notification) => !notificationIds.includes(notification.id)
        )
      );
    };

    const handleConnect = () => {
      void refreshRef.current({ background: true });
    };

    socket.on("notification:created", handleCreated);
    socket.on("notification:updated", handleUpdated);
    socket.on("notification:deleted", handleDeleted);
    socket.on("connect", handleConnect);

    return () => {
      socket.off("notification:created", handleCreated);
      socket.off("notification:updated", handleUpdated);
      socket.off("notification:deleted", handleDeleted);
      socket.off("connect", handleConnect);
    };
  }, [allowedTypes, socket]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const markAsRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              read: true,
              read_at: notification.read_at || new Date().toISOString(),
            }
          : notification
      )
    );

    try {
      invalidateBellNotificationsCache(userId);
      await markBellNotificationAsRead(notificationId);
    } catch (markError) {
      console.error("Failed to mark notification as read:", markError);
      void refreshRef.current({ force: true, background: true });
    }
  };

  const markAllAsRead = async () => {
    const readAt = new Date().toISOString();
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
        read_at: notification.read_at || readAt,
      }))
    );

    try {
      invalidateBellNotificationsCache(userId);
      await markAllBellNotificationsAsRead();
    } catch (markError) {
      console.error("Failed to mark all notifications as read:", markError);
      void refreshRef.current({ force: true, background: true });
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };
}
