import {
  emitConversationSummaryToConnectedStaffInbox,
  emitGuestInboxChanged,
  emitGuestMessageCreated,
} from "@/lib/socket/server";
import { createBulkNotifications } from "@/lib/notifications";
import {
  getAvailableStaffUserIds,
  getStaffMembers,
} from "@/lib/chat/availability";
import { getConversationDocument } from "@/lib/chat/server";
import { isGuestConversationVisibleInStaffInbox } from "@/lib/chat/guest-inbox";
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

export async function notifyStaffOfGuestConversationEnded(
  conversationId: string,
  guestName?: string
) {
  const conversation = await getConversationDocument(conversationId);
  if (
    conversation &&
    !isGuestConversationVisibleInStaffInbox(conversation)
  ) {
    return;
  }

  await emitConversationSummaryToConnectedStaffInbox(conversationId);
  emitGuestInboxChanged(conversationId);
  const staff = await getStaffMembers();
  const recipientIds = new Set<string>();

  if (conversation?.assignedAgentId) {
    recipientIds.add(conversation.assignedAgentId);
  }

  for (const member of staff) {
    recipientIds.add(member.userId);
  }

  if (recipientIds.size === 0) return;

  const roleByUserId = new Map(staff.map((member) => [member.userId, member.role]));
  const adminRecipients: string[] = [];
  const supportRecipients: string[] = [];

  for (const userId of recipientIds) {
    if (roleByUserId.get(userId) === "support") {
      supportRecipients.push(userId);
    } else {
      adminRecipients.push(userId);
    }
  }

  const body = `${guestName || "زائر"} أنهى المحادثة المباشرة`;

  if (adminRecipients.length > 0) {
    await createBulkNotifications(adminRecipients, {
      type: "guest_chat",
      title: "أنهى الزائر المحادثة",
      body,
      data: {
        conversationId,
        url: `/admin/messages?conversation=${conversationId}`,
      },
    });
  }

  if (supportRecipients.length > 0) {
    await createBulkNotifications(supportRecipients, {
      type: "guest_chat",
      title: "أنهى الزائر المحادثة",
      body,
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
