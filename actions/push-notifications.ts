"use server";

import { headers } from "next/headers";

import { requireAuth } from "@/lib/auth-utils";
import {
  countPushSubscriptionsForUser,
  deletePushSubscription,
  isWebPushConfigured,
  sendPushNotificationToSubscription,
  upsertPushSubscription,
  type PushSubscriptionPayload,
} from "@/lib/push/server";
import type { ApiResponse, UserRole } from "@/types";

type PushNotificationStatus = {
  configured: boolean;
  subscriptionCount: number;
};

function getNotificationsPathForRole(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin/notifications";
    case "support":
      return "/support-agent/notifications";
    default:
      return "/dashboard/notifications";
  }
}

export async function getPushNotificationStatus(): Promise<
  ApiResponse<PushNotificationStatus>
> {
  try {
    const session = await requireAuth();
    const subscriptionCount = await countPushSubscriptionsForUser(
      session.user.id
    );

    return {
      success: true,
      data: {
        configured: isWebPushConfigured(),
        subscriptionCount,
      },
    };
  } catch (error) {
    console.error("Get push notification status error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "تعذّر الحصول على حالة إشعارات المتصفح",
    };
  }
}

export async function registerPushSubscription(
  subscription: PushSubscriptionPayload
): Promise<ApiResponse<{ subscriptionCount: number }>> {
  try {
    const session = await requireAuth();

    if (!isWebPushConfigured()) {
      return {
        success: false,
        error:
          "إشعارات المتصفح غير مُعدّة. أضف مفاتيح VAPID قبل تفعيل إشعارات المتصفح.",
      };
    }

    const requestHeaders = await headers();
    await upsertPushSubscription(
      session.user.id,
      subscription,
      requestHeaders.get("user-agent") || undefined
    );

    const role = (
      (session.user as { role?: UserRole }).role || "customer"
    ) as UserRole;
    const notificationsPath = getNotificationsPathForRole(role);

    const testNotification = await sendPushNotificationToSubscription(
      subscription,
      {
        title: "إشعارات المتصفح جاهزة",
        body: "ستتلقى الآن تنبيهات التذاكر والمحادثات والنشاط حتى عندما يكون التطبيق في الخلفية.",
        url: notificationsPath,
        tag: "push-subscription-ready",
        data: {
          url: notificationsPath,
          source: "push_setup",
        },
      }
    );

    if (!testNotification.success && !testNotification.skipped) {
      console.error(
        "Failed to deliver the initial push notification:",
        testNotification.error
      );
    }

    const subscriptionCount = await countPushSubscriptionsForUser(
      session.user.id
    );

    return {
      success: true,
      data: {
        subscriptionCount,
      },
      message: "تم تفعيل إشعارات المتصفح.",
    };
  } catch (error) {
    console.error("Register push subscription error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "تعذّر تسجيل اشتراك الإشعارات",
    };
  }
}

export async function unregisterPushSubscription(
  endpoint: string
): Promise<ApiResponse<{ subscriptionCount: number }>> {
  try {
    const session = await requireAuth();

    if (!endpoint) {
      return {
        success: false,
        error: "نقطة نهاية اشتراك الإشعارات مفقودة.",
      };
    }

    await deletePushSubscription(session.user.id, endpoint);
    const subscriptionCount = await countPushSubscriptionsForUser(
      session.user.id
    );

    return {
      success: true,
      data: {
        subscriptionCount,
      },
      message: "تم تعطيل إشعارات المتصفح على هذا الجهاز.",
    };
  } catch (error) {
    console.error("Unregister push subscription error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "تعذّر إلغاء اشتراك الإشعارات",
    };
  }
}
