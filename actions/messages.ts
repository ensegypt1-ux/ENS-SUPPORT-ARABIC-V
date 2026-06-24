/**
 * Messages Module - Server Actions
 *
 * MongoDB stores the durable chat data.
 * Socket.IO broadcasts the realtime deltas to connected clients.
 */

"use server";

import { getCollection } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import {
  createConversationRecord,
  createMessageRecord,
  ensureConversationParticipant,
  getConversationSummaryForUser,
  getMessageForConversationUser,
} from "@/lib/chat/server";
import {
  emitConversationSummaryToParticipants,
  emitMessageCreated,
  emitMessagesRead,
} from "@/lib/socket/server";
import { createBulkNotifications } from "@/lib/notifications";
import { notifyAdminsTelegram, toPlainPreview } from "@/lib/telegram/server";
import type { User, UserRole } from "@/types";
import { revalidatePath } from "next/cache";

type MessageDocument = {
  id: string;
  conversationId: string;
  senderId: string;
  readBy: string[];
  updatedAt: Date;
};

function revalidateMessagePages() {
  revalidatePath("/dashboard/messages");
  revalidatePath("/admin/messages");
  revalidatePath("/support-agent/messages");
}

/**
 * Create a new conversation
 */
export async function createConversation(data: { participantIds: string[] }) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "مش مسموح" };
    }

    const userRole = ((session.user as User).role || "customer") as UserRole;
    const allParticipantIds = Array.from(
      new Set([session.user.id, ...data.participantIds])
    );

    if (allParticipantIds.length < 2) {
      return {
        success: false,
        error: "لازم تضمّ المحادثة مشاركين على الأقل",
      };
    }

    if (userRole === "customer") {
      const usersCollection = await getCollection<User>("user");
      const participants = await usersCollection
        .find({ id: { $in: data.participantIds } })
        .project({ id: 1, role: 1 })
        .toArray();

      const hasDisallowedParticipant = participants.some(
        (user) => user.role !== "support" && user.role !== "admin"
      );

      if (hasDisallowedParticipant) {
        return {
          success: false,
          error:
            "العملاء يقدروا يبدأوا محادثات مع الدعم أو المسؤولين بس.",
        };
      }
    }

    const conversation = await createConversationRecord({
      participantIds: allParticipantIds,
      createdBy: session.user.id,
    });

    await emitConversationSummaryToParticipants(conversation.id);
    revalidateMessagePages();

    const serialized = await getConversationSummaryForUser(
      conversation.id,
      session.user.id
    );

    return {
      success: true,
      data: serialized || {
        id: conversation.id,
      },
    };
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return { success: false, error: "حصل خطأ مش متوقع" };
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(data: {
  conversationId: string;
  content: string;
  replyToId?: string | null;
}) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "مش مسموح" };
    }

    const conversation = await ensureConversationParticipant(
      data.conversationId,
      session.user.id
    );

    if (!conversation) {
      return {
        success: false,
        error: "إنت مش مشارك في المحادثة دي",
      };
    }

    const messageDoc = await createMessageRecord({
      conversationId: data.conversationId,
      senderId: session.user.id,
      senderName: session.user.name || "User",
      content: data.content,
      replyToId: data.replyToId ?? null,
    });

    const message = await getMessageForConversationUser(
      messageDoc.id,
      session.user.id
    );

    if (!message) {
      return { success: false, error: "تعذّر إرسال الرسالة" };
    }

    emitMessageCreated(message);
    await emitConversationSummaryToParticipants(data.conversationId);

    try {
      const recipientIds = conversation.participantIds.filter(
        (participantId) => participantId !== session.user.id
      );

      if (recipientIds.length > 0) {
        await createBulkNotifications(recipientIds, {
          type: "new_message",
          title: "رسالة جديدة",
          body: `${session.user.name} sent you a message`,
          data: {
            conversationId: data.conversationId,
            messageId: message.id,
            url: `/dashboard/messages?conversation=${data.conversationId}`,
          },
        });

        // Post to the shared admin Telegram group only when a non-admin
        // messages an admin — so admins aren't pinged by their own messages or
        // by support<->customer chats that don't involve them.
        const senderRole = (session.user as { role?: UserRole }).role;
        if (senderRole !== "admin") {
          const usersCollection = await getCollection<User>("user");
          const adminRecipientCount = await usersCollection.countDocuments({
            id: { $in: recipientIds },
            role: "admin",
          });
          if (adminRecipientCount > 0) {
            const messagePreview = toPlainPreview(data.content);
            void notifyAdminsTelegram({
              title: "New Message",
              body:
                `${session.user.name} sent a message` +
                (messagePreview ? `\n\n${messagePreview}` : ""),
              url: `/admin/messages?conversation=${data.conversationId}`,
            });
          }
        }
      }
    } catch (notificationError) {
      console.error("تعذّر الإرسال الرسالة notifications:", notificationError);
    }

    revalidateMessagePages();
    return { success: true, data: message };
  } catch (error) {
    console.error("تعذّر الإرسال الرسالة:", error);
    return { success: false, error: "حصل خطأ مش متوقع" };
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(data: {
  conversationId: string;
  messageIds: string[];
}) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: false, error: "مش مسموح" };
    }

    const conversation = await ensureConversationParticipant(
      data.conversationId,
      session.user.id
    );

    if (!conversation) {
      return {
        success: false,
        error: "إنت مش مشارك في المحادثة دي",
      };
    }

    const messagesCollection = await getCollection<MessageDocument>("messages");
    await messagesCollection.updateMany(
      {
        id: { $in: data.messageIds },
        conversationId: data.conversationId,
        senderId: { $ne: session.user.id },
      },
      {
        $addToSet: { readBy: session.user.id },
        $set: { updatedAt: new Date() },
      }
    );

    emitMessagesRead(data.conversationId, data.messageIds, session.user.id);
    await emitConversationSummaryToParticipants(data.conversationId);

    return { success: true };
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    return { success: false, error: "حصل خطأ مش متوقع" };
  }
}
