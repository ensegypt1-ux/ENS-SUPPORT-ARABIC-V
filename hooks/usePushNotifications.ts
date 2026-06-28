"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getPushNotificationStatus,
  registerPushSubscription,
  unregisterPushSubscription,
} from "@/actions/push-notifications";
import {
  getPushServiceWorkerRegistration,
  supportsPushNotifications,
  urlBase64ToUint8Array,
} from "@/lib/pwa/client";

type PushPermissionState = NotificationPermission | "unsupported";

type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

type PushNotificationStatusResult = Awaited<
  ReturnType<typeof getPushNotificationStatus>
>;

const PUSH_STATUS_FRESH_MS = 1_500;

let pushStatusCache:
  | { fetchedAt: number; endpoint: string | null; result: PushNotificationStatusResult }
  | null = null;
let pushStatusRequest: Promise<PushNotificationStatusResult> | null = null;

function invalidatePushStatusCache() {
  pushStatusCache = null;
}

function loadPushStatus(options?: {
  force?: boolean;
  endpoint?: string | null;
}) {
  const endpointKey = options?.endpoint?.trim() || null;

  if (!options?.force) {
    if (pushStatusRequest) {
      return pushStatusRequest;
    }

    if (
      pushStatusCache &&
      pushStatusCache.endpoint === endpointKey &&
      Date.now() - pushStatusCache.fetchedAt < PUSH_STATUS_FRESH_MS
    ) {
      return Promise.resolve(pushStatusCache.result);
    }
  }

  const request = getPushNotificationStatus(endpointKey).then((result) => {
    if (result.success) {
      pushStatusCache = {
        fetchedAt: Date.now(),
        endpoint: endpointKey,
        result,
      };
    }

    return result;
  });

  pushStatusRequest = request;
  request.then(
    () => {
      if (pushStatusRequest === request) {
        pushStatusRequest = null;
      }
    },
    () => {
      if (pushStatusRequest === request) {
        pushStatusRequest = null;
      }
    },
  );

  return request;
}

function getPermissionState(): PushPermissionState {
  if (typeof window === "undefined" || !supportsPushNotifications()) {
    return "unsupported";
  }

  return Notification.permission;
}

function subscriptionToPayload(
  subscription: PushSubscription,
): PushSubscriptionPayload {
  const subscriptionJson = subscription.toJSON();
  if (
    !subscriptionJson.endpoint ||
    !subscriptionJson.keys?.p256dh ||
    !subscriptionJson.keys.auth
  ) {
    throw new Error("بيانات اشتراك الإشعارات الفورية غير مكتملة.");
  }

  return {
    endpoint: subscriptionJson.endpoint,
    expirationTime: subscriptionJson.expirationTime ?? null,
    keys: {
      p256dh: subscriptionJson.keys.p256dh,
      auth: subscriptionJson.keys.auth,
    },
  };
}

async function getCurrentPushSubscription() {
  const registration = await getPushServiceWorkerRegistration();
  if (!registration) {
    return null;
  }

  return registration.pushManager.getSubscription();
}

function computeIsSubscribed(params: {
  permission: PushPermissionState;
  configured: boolean;
  localSubscription: PushSubscription | null;
  currentDeviceRegistered: boolean;
}) {
  return (
    params.permission === "granted" &&
    params.configured &&
    Boolean(params.localSubscription) &&
    params.currentDeviceRegistered
  );
}

export function usePushNotifications(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const [permission, setPermission] = useState<PushPermissionState>(() =>
    getPermissionState(),
  );
  const [isConfigured, setIsConfigured] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const refresh = useCallback(async (refreshOptions?: {
    force?: boolean;
    repairAttempted?: boolean;
  }) => {
    const supported =
      typeof window !== "undefined" && supportsPushNotifications();

    if (!supported) {
      setPermission("unsupported");
      setIsConfigured(false);
      setIsSubscribed(false);
      setSubscriptionCount(0);
      setStatusError(null);
      setLoading(false);
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    try {
      const localSubscription = await getCurrentPushSubscription();
      const endpoint = localSubscription?.endpoint ?? null;

      console.info("[push] refresh", {
        permission: currentPermission,
        endpoint: endpoint ? `${endpoint.slice(0, 48)}…` : null,
      });

      const statusResult = await loadPushStatus({
        force: refreshOptions?.force,
        endpoint,
      });

      if (!statusResult.success || !statusResult.data) {
        setIsConfigured(false);
        setIsSubscribed(false);
        setSubscriptionCount(0);
        setStatusError(
          statusResult.error || "تعذّر تحميل حالة إشعارات المتصفح.",
        );
        return;
      }

      setStatusError(null);
      setIsConfigured(statusResult.data.configured);
      setSubscriptionCount(statusResult.data.subscriptionCount);

      const subscribed = computeIsSubscribed({
        permission: currentPermission,
        configured: statusResult.data.configured,
        localSubscription,
        currentDeviceRegistered: statusResult.data.currentDeviceRegistered,
      });

      setIsSubscribed(subscribed);

      console.info("[push] refresh result", {
        configured: statusResult.data.configured,
        currentDeviceRegistered: statusResult.data.currentDeviceRegistered,
        hasLocalSubscription: Boolean(localSubscription),
        subscribed,
      });

      // Repair drift: browser subscription exists but DB row is missing.
      if (
        !refreshOptions?.repairAttempted &&
        currentPermission === "granted" &&
        statusResult.data.configured &&
        localSubscription &&
        !statusResult.data.currentDeviceRegistered
      ) {
        console.info("[push] repairing missing server subscription");
        invalidatePushStatusCache();
        const repairResult = await registerPushSubscription(
          subscriptionToPayload(localSubscription),
        );
        if (repairResult.success) {
          await refresh({ force: true, repairAttempted: true });
          return;
        }

        setIsSubscribed(false);
        setStatusError(
          repairResult.error ||
            "تعذّر مزامنة اشتراك الإشعارات مع الخادم.",
        );
        return;
      }
    } catch (error) {
      console.error("[push] refresh failed:", error);
      setIsSubscribed(false);
      setStatusError(
        error instanceof Error
          ? error.message
          : "تعذّر تحميل حالة إشعارات المتصفح.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void refresh();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, refresh]);

  const enablePush = useCallback(async () => {
    if (!supportsPushNotifications()) {
      toast.error("هذا المتصفح لا يدعم الإشعارات الفورية.");
      return;
    }

    if (!isConfigured) {
      toast.error(
        "الإشعارات الفورية غير مُعدّة على الخادم. أضف مفاتيح VAPID أولاً.",
      );
      return;
    }

    setBusy(true);
    setStatusError(null);

    let createdSubscription: PushSubscription | null = null;

    try {
      console.info("[push] enable start");

      const permissionResult =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();

      setPermission(permissionResult);
      console.info("[push] permission", { permission: permissionResult });

      if (permissionResult !== "granted") {
        toast.error(
          permissionResult === "denied"
            ? "إشعارات المتصفح محظورة لهذا الموقع."
            : "لم يتم منح إذن الإشعارات.",
        );
        return;
      }

      const registration = await getPushServiceWorkerRegistration();
      if (!registration) {
        if (!window.isSecureContext) {
          toast.error(
            "الإشعارات الفورية تتطلب HTTPS (يُسمح بـ localhost للاختبار).",
          );
        } else {
          toast.error("تعذّر تسجيل خدمة الإشعارات.");
        }
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!publicKey) {
          toast.error("مفتاح VAPID العام مفقود.");
          return;
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        createdSubscription = subscription;
      }

      const payload = subscriptionToPayload(subscription);
      console.info("[push] subscribe local ok", {
        endpoint: `${payload.endpoint.slice(0, 48)}…`,
      });

      invalidatePushStatusCache();
      const result = await registerPushSubscription(payload);
      if (!result.success) {
        if (createdSubscription) {
          await createdSubscription.unsubscribe().catch(() => undefined);
        }
        toast.error(result.error || "تعذّر تفعيل إشعارات المتصفح.");
        setStatusError(result.error || "تعذّر تفعيل إشعارات المتصفح.");
        return;
      }

      toast.success(result.message || "تم تفعيل إشعارات المتصفح.");
    } catch (error) {
      console.error("[push] enable failed:", error);
      if (createdSubscription) {
        await createdSubscription.unsubscribe().catch(() => undefined);
      }
      const message =
        error instanceof Error
          ? error.message
          : "تعذّر تفعيل إشعارات المتصفح.";
      toast.error(message);
      setStatusError(message);
    } finally {
      setBusy(false);
      await refresh({ force: true });
    }
  }, [isConfigured, refresh]);

  const disablePush = useCallback(async () => {
    if (!supportsPushNotifications()) {
      toast.error("هذا المتصفح لا يدعم الإشعارات الفورية.");
      return;
    }

    setBusy(true);
    setStatusError(null);

    try {
      console.info("[push] disable start");

      const registration = await getPushServiceWorkerRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        toast.success("إشعارات المتصفح معطّلة بالفعل على هذا الجهاز.");
        return;
      }

      const endpoint = subscription.endpoint;
      invalidatePushStatusCache();

      const unregisterResult = await unregisterPushSubscription(endpoint);
      const unsubscribed = await subscription.unsubscribe();

      if (!unregisterResult.success) {
        toast.error(
          unregisterResult.error || "تعذّر تعطيل إشعارات المتصفح.",
        );
        setStatusError(
          unregisterResult.error || "تعذّر تعطيل إشعارات المتصفح.",
        );
        return;
      }

      if (!unsubscribed) {
        toast.error("تعذّر إلغاء اشتراك الإشعارات في المتصفح.");
        setStatusError("تعذّر إلغاء اشتراك الإشعارات في المتصفح.");
        return;
      }

      toast.success(
        unregisterResult.message || "تم تعطيل إشعارات المتصفح.",
      );
    } catch (error) {
      console.error("[push] disable failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "تعذّر تعطيل إشعارات المتصفح.";
      toast.error(message);
      setStatusError(message);
    } finally {
      setBusy(false);
      await refresh({ force: true });
    }
  }, [refresh]);

  return {
    permission,
    isSupported: permission !== "unsupported",
    isConfigured,
    isSubscribed,
    subscriptionCount,
    loading,
    busy,
    statusError,
    enablePush,
    disablePush,
    refresh,
  };
};
