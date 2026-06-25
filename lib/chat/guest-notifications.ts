import {
  emitConversationSummaryToConnectedStaffInbox,
  emitGuestInboxChanged,
  emitGuestMessageCreated,
} from "@/lib/socket/server";
import { createBulkNotifications } from "@/lib/notifications";
import { getAvailableStaffUserIds } from "@/lib/chat/availability";
import type { Message } from "@/types/realtime";

export async function notifyStaffOfGuestConversation(
  conversationId: string,
  options?: { isNew?: boolean }
) {
  await emitConversationSummaryToConnectedStaffInbox(conversationId);
  emitGuestInboxChanged(conversationId);

  if (options?.isNew) {
    const availableStaff = await getAvailableStaffUserIds();
    if (availableStaff.length > 0) {
      await createBulkNotifications(availableStaff, {
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
}

export async function notifyStaffOfGuestMessage(
  conversationId: string,
  message: Message,
  guestName?: string
) {
  emitGuestMessageCreated(message);
  await emitConversationSummaryToConnectedStaffInbox(conversationId);
  emitGuestInboxChanged(conversationId);

  const availableStaff = await getAvailableStaffUserIds();
  if (availableStaff.length === 0) return;

  await createBulkNotifications(availableStaff, {
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
