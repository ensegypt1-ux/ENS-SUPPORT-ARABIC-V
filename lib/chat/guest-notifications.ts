import { getConversationSummaryForUser } from "@/lib/chat/server";
import {
  emitConversationSummaryToStaff,
  emitGuestInboxChanged,
  emitMessageCreated,
} from "@/lib/socket/server";
import { createBulkNotifications } from "@/lib/notifications";
import {
  getAllStaffUserIds,
  getOnlineStaffUserIds,
} from "@/lib/socket/presence-utils";
import type { Message } from "@/types/realtime";

export async function notifyStaffOfGuestConversation(
  conversationId: string,
  options?: { isNew?: boolean }
) {
  const onlineStaff = await getOnlineStaffUserIds();
  const allStaff = await getAllStaffUserIds();
  const notifyIds = Array.from(new Set([...onlineStaff, ...allStaff]));

  await emitConversationSummaryToStaff(conversationId, notifyIds);
  emitGuestInboxChanged(conversationId);

  if (options?.isNew && notifyIds.length > 0) {
    await createBulkNotifications(notifyIds, {
      type: "guest_chat",
      title: "محادثة زائر جديدة",
      body: "زائر ينتظر الدعم المباشر في المحادثة",
      data: {
        conversationId,
        url: `/support-agent/messages?conversation=${conversationId}`,
      },
    });
  }
}

export async function notifyStaffOfGuestMessage(
  conversationId: string,
  message: Message,
  guestName?: string
) {
  emitMessageCreated(message);

  const onlineStaff = await getOnlineStaffUserIds();
  const allStaff = await getAllStaffUserIds();
  const notifyIds = Array.from(new Set([...onlineStaff, ...allStaff]));

  if (notifyIds.length === 0) return;

  await emitConversationSummaryToStaff(conversationId, notifyIds);
  emitGuestInboxChanged(conversationId);

  await createBulkNotifications(notifyIds, {
    type: "guest_chat_message",
    title: "رسالة من زائر",
    body: `${guestName || "زائر"}: ${message.content.slice(0, 120)}`,
    data: {
      conversationId,
      messageId: message.id,
      url: `/support-agent/messages?conversation=${conversationId}`,
    },
  });
}
