"use server";

/**
 * Server Actions for Message Attachments
 */

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  appendAttachmentToMessage,
  getMessageDocument,
  getMessageForConversationUser,
  removeAttachmentFromMessage,
} from "@/lib/chat/server";
import { getCollection } from "@/lib/db";
import { emitConversationSummaryToParticipants, emitMessageUpdated } from "@/lib/socket/server";
import { deleteFile, uploadFile } from "@/lib/storage";
import type { MessageAttachment } from "@/types/realtime";

type MessageDocument = {
  id: string;
  conversationId: string;
  senderId: string;
  attachments: MessageAttachment[];
};

function getFileType(mimeType: string) {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("text/")) return "text";
  return "file";
}

export async function uploadMessageAttachment(
  messageId: string,
  formData: FormData
): Promise<{
  success: boolean;
  attachment?: MessageAttachment;
  error?: string;
}> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "غير مصرّح" };
    }

    const message = await getMessageDocument(messageId);
    if (!message) {
      return { success: false, error: "لا يوجد الرسالة" };
    }

    if (message.senderId !== session.user.id) {
      return { success: false, error: "يمكنك ترفق ملفات برسائلك بس" };
    }

    const file = formData.get("file") as File | null;
    if (!file) {
      return { success: false, error: "لا يوجد ملف مرفوع" };
    }

    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "حجم الملف يتجاوز الحد الأقصى 20 ميغابايت" };
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "نوع الملف غير مسموح" };
    }

    const uploadedFile = await uploadFile({
      file,
      folder: "messages",
      userId: session.user.id,
    });

    const attachment: MessageAttachment = {
      id: crypto.randomUUID(),
      file_name: uploadedFile.filename,
      file_url: uploadedFile.url,
      file_type: getFileType(uploadedFile.mimeType),
      file_size: uploadedFile.size,
      mime_type: uploadedFile.mimeType,
      thumbnail_url: uploadedFile.key,
      uploaded_by: session.user.id,
      created_at: new Date().toISOString(),
    };

    await appendAttachmentToMessage(messageId, attachment);

    const serialized = await getMessageForConversationUser(
      messageId,
      session.user.id
    );

    if (serialized) {
      emitMessageUpdated(serialized);
      await emitConversationSummaryToParticipants(serialized.conversation_id);
    }

    return { success: true, attachment };
  } catch (error) {
    console.error("Error uploading attachment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذّر رفع الملف",
    };
  }
}

export async function getMessageAttachments(messageId: string) {
  try {
    const message = await getMessageDocument(messageId);
    if (!message) {
      return { success: false, error: "لا يوجد الرسالة" };
    }

    return {
      success: true,
      attachments: [...(message.attachments || [])].sort((left, right) =>
        left.created_at.localeCompare(right.created_at)
      ),
    };
  } catch (error) {
    console.error("Error fetching attachments:", error);
    return { success: false, error: "تعذّر جلب المرفقات" };
  }
}

export async function deleteMessageAttachment(
  attachmentId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return { success: false, error: "غير مصرّح" };
    }

    const messagesCollection = await getCollection<MessageDocument>("messages");
    const message = await messagesCollection.findOne({
      "attachments.id": attachmentId,
    });

    if (!message) {
      return { success: false, error: "لا يوجد المرفق" };
    }

    const attachment = (message.attachments || []).find(
      (entry) => entry.id === attachmentId
    );

    if (!attachment || attachment.uploaded_by !== session.user.id) {
      return { success: false, error: "غير مصرّح" };
    }

    if (attachment.thumbnail_url) {
      try {
        await deleteFile(attachment.thumbnail_url);
      } catch (error) {
        console.error("Error deleting file from storage:", error);
      }
    }

    await removeAttachmentFromMessage(message.id, attachmentId);

    const serialized = await getMessageForConversationUser(
      message.id,
      session.user.id
    );

    if (serialized) {
      emitMessageUpdated(serialized);
      await emitConversationSummaryToParticipants(serialized.conversation_id);
    }

    return { success: true };
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return { success: false, error: "تعذّر حذف المرفق" };
  }
}
