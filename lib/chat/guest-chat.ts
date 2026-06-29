import { randomBytes } from "crypto";
import { ObjectId } from "mongodb";

import {
  createMessageRecord,
  getConversationDocument,
  getConversationMessagesForGuest,
  serializeMessageDocument,
  type ConversationDocument,
} from "@/lib/chat/server";
import { getCollection } from "@/lib/db";
import {
  normalizeToE164,
  validateInternationalPhone,
} from "@/lib/phone/international-phone";
import type { GuestConversationStatus, Message } from "@/types/realtime";
import type { UserRole } from "@/types";

import { guestParticipantId } from "@/lib/chat/participant-ids";

function normalizeGuestPhone(phone?: string): string | undefined {
  if (!phone?.trim()) return undefined;
  return normalizeToE164(phone) ?? phone.trim();
}

export type CreateOrResumeGuestInput = {
  guestSessionId: string;
  chatLogId?: string;
  departmentSlug?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
};

export class GuestProfileRequiredError extends Error {
  constructor() {
    super("profile_required");
    this.name = "GuestProfileRequiredError";
  }
}

export type GuestSessionResult = {
  conversationId: string;
  guestAccessToken: string;
  guestSessionId: string;
  status: GuestConversationStatus;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  messages: Message[];
  isNew: boolean;
};

export async function validateGuestAccess(input: {
  guestSessionId: string;
  guestAccessToken: string;
  conversationId: string;
}): Promise<ConversationDocument | null> {
  const conversation = await getConversationDocument(input.conversationId);
  if (!conversation) return null;
  if (conversation.source !== "guest_widget") return null;
  if (conversation.guestSessionId !== input.guestSessionId) return null;
  if (conversation.guestAccessToken !== input.guestAccessToken) return null;
  if (conversation.status === "closed") return null;
  return conversation;
}

export async function findOpenGuestConversation(guestSessionId: string) {
  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");

  return conversationsCollection.findOne({
    source: "guest_widget",
    guestSessionId,
    status: { $ne: "closed" },
  });
}

export async function createOrResumeGuestConversation(
  input: CreateOrResumeGuestInput
): Promise<GuestSessionResult> {
  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");

  const existing = await conversationsCollection.findOne({
    source: "guest_widget",
    guestSessionId: input.guestSessionId,
    status: { $ne: "closed" },
  });

  const guestPid = guestParticipantId(input.guestSessionId);

  if (existing) {
    if (
      input.guestPhone?.trim() &&
      !existing.guestPhone &&
      !normalizeGuestPhone(input.guestPhone)
    ) {
      throw new GuestProfileRequiredError();
    }

    const updates: Partial<ConversationDocument> = {};
    if (input.chatLogId && !existing.chatLogId) {
      updates.chatLogId = input.chatLogId;
    }
    if (input.departmentSlug && !existing.departmentSlug) {
      updates.departmentSlug = input.departmentSlug;
    }
    if (input.guestName?.trim() && !existing.guestName) {
      updates.guestName = input.guestName.trim();
    }
    if (input.guestEmail?.trim() && !existing.guestEmail) {
      updates.guestEmail = input.guestEmail.trim();
    }
    if (input.guestPhone?.trim() && !existing.guestPhone) {
      updates.guestPhone = normalizeGuestPhone(input.guestPhone);
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date();
      await conversationsCollection.updateOne(
        { id: existing.id },
        { $set: updates }
      );
      Object.assign(existing, updates);
    }

    const messages =
      (await getConversationMessagesForGuest(existing.id, input.guestSessionId)) ||
      [];

    return {
      conversationId: existing.id,
      guestAccessToken: existing.guestAccessToken!,
      guestSessionId: input.guestSessionId,
      status: existing.status || "unclaimed",
      guestName: existing.guestName,
      guestEmail: existing.guestEmail,
      guestPhone: existing.guestPhone,
      messages,
      isNew: false,
    };
  }

  const phoneResult = validateInternationalPhone(input.guestPhone || "");
  if (!phoneResult.ok) {
    throw new GuestProfileRequiredError();
  }

  const raced = await conversationsCollection.findOne({
    source: "guest_widget",
    guestSessionId: input.guestSessionId,
    status: { $ne: "closed" },
  });
  if (raced) {
    return createOrResumeGuestConversation({
      ...input,
      guestPhone: phoneResult.normalized,
    });
  }

  const conversationId = new ObjectId().toString();
  const guestAccessToken = randomBytes(32).toString("hex");
  const now = new Date();

  const document: ConversationDocument = {
    _id: new ObjectId(conversationId),
    id: conversationId,
    type: "direct",
    participantIds: [guestPid],
    createdBy: guestPid,
    createdAt: now,
    updatedAt: now,
    lastMessageAt: null,
    lastMessage: null,
    source: "guest_widget",
    guestSessionId: input.guestSessionId,
    guestAccessToken,
    guestName: input.guestName?.trim() || undefined,
    guestEmail: input.guestEmail?.trim() || undefined,
    guestPhone: phoneResult.normalized,
    chatLogId: input.chatLogId,
    departmentSlug: input.departmentSlug,
    status: "unclaimed",
    assignedAgentId: null,
    awaitingFirstMessage: true,
  };

  await conversationsCollection.insertOne(document);

  return {
    conversationId,
    guestAccessToken,
    guestSessionId: input.guestSessionId,
    status: "unclaimed",
    guestName: document.guestName,
    guestEmail: document.guestEmail,
    guestPhone: document.guestPhone,
    messages: [],
    isNew: true,
  };
}

export async function updateGuestProfile(
  conversationId: string,
  guestSessionId: string,
  guestAccessToken: string,
  fields: {
    guestName?: string;
    guestEmail?: string;
    guestPhone?: string;
  }
): Promise<boolean> {
  const conversation = await validateGuestAccess({
    conversationId,
    guestSessionId,
    guestAccessToken,
  });
  if (!conversation) return false;

  const updates: Partial<ConversationDocument> = { updatedAt: new Date() };
  if (fields.guestName?.trim()) updates.guestName = fields.guestName.trim();
  if (fields.guestEmail?.trim()) updates.guestEmail = fields.guestEmail.trim();
  if (fields.guestPhone?.trim()) {
    updates.guestPhone = normalizeGuestPhone(fields.guestPhone);
  }

  if (Object.keys(updates).length <= 1) return true;

  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");
  await conversationsCollection.updateOne(
    { id: conversationId },
    { $set: updates }
  );
  return true;
}

export async function claimGuestConversation(
  conversationId: string,
  agentUserId: string
): Promise<{ success: boolean; error?: string; conversation?: ConversationDocument }> {
  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");

  const result = await conversationsCollection.findOneAndUpdate(
    {
      id: conversationId,
      source: "guest_widget",
      status: "unclaimed",
    },
    {
      $set: {
        status: "claimed" as GuestConversationStatus,
        assignedAgentId: agentUserId,
        claimedAt: new Date(),
        updatedAt: new Date(),
      },
      $addToSet: { participantIds: agentUserId },
    },
    { returnDocument: "after" }
  );

  if (!result) {
    const existing = await getConversationDocument(conversationId);
    if (!existing || existing.source !== "guest_widget") {
      return { success: false, error: "المحادثة غير موجودة" };
    }
    if (existing.status === "claimed") {
      if (existing.assignedAgentId === agentUserId) {
        return { success: true, conversation: existing };
      }
      return { success: false, error: "تم استلام المحادثة من قبل موظف آخر" };
    }
    return { success: false, error: "تعذّر استلام المحادثة" };
  }

  return { success: true, conversation: result };
}

export async function sendGuestMessage(input: {
  conversationId: string;
  guestSessionId: string;
  guestAccessToken: string;
  content: string;
}): Promise<{
  success: boolean;
  error?: string;
  message?: Message;
  isFirstMessage?: boolean;
}> {
  const conversation = await validateGuestAccess({
    conversationId: input.conversationId,
    guestSessionId: input.guestSessionId,
    guestAccessToken: input.guestAccessToken,
  });

  if (!conversation) {
    return { success: false, error: "غير مصرّح" };
  }

  const content = input.content.trim();
  if (content.length < 1 || content.length > 4000) {
    return { success: false, error: "الرسالة غير صالحة" };
  }

  const messagesCollection = await getCollection<{ conversationId: string }>(
    "messages"
  );
  const priorCount = await messagesCollection.countDocuments({
    conversationId: input.conversationId,
  });
  const isFirstMessage = priorCount === 0;

  const guestPid = guestParticipantId(input.guestSessionId);
  const senderName = conversation.guestName?.trim() || "زائر";

  const messageDoc = await createMessageRecord({
    conversationId: input.conversationId,
    senderId: guestPid,
    senderName,
    content,
  });

  if (isFirstMessage) {
    const conversationsCollection =
      await getCollection<ConversationDocument>("conversations");
    await conversationsCollection.updateOne(
      { id: input.conversationId },
      {
        $set: {
          awaitingFirstMessage: false,
          updatedAt: new Date(),
        },
      }
    );
  }

  return {
    success: true,
    message: serializeMessageDocument(messageDoc),
    isFirstMessage,
  };
}

export function guestDisplayName(conversation: ConversationDocument): string {
  return conversation.guestName?.trim() || "زائر";
}

export async function closeGuestConversationByGuest(input: {
  conversationId: string;
  guestSessionId: string;
  guestAccessToken: string;
}): Promise<{ success: boolean; error?: string; guestName?: string }> {
  const conversation = await validateGuestAccess(input);
  if (!conversation) {
    return { success: false, error: "غير مصرّح" };
  }

  if (conversation.status === "closed") {
    return { success: true, guestName: guestDisplayName(conversation) };
  }

  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");

  await conversationsCollection.updateOne(
    { id: input.conversationId },
    {
      $set: {
        status: "closed" as GuestConversationStatus,
        closedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return { success: true, guestName: guestDisplayName(conversation) };
}

export async function archiveGuestConversation(
  conversationId: string,
  agentUserId: string,
  agentRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const conversation = await getConversationDocument(conversationId);
  if (!conversation || conversation.source !== "guest_widget") {
    return { success: false, error: "المحادثة غير موجودة" };
  }

  if (conversation.status === "closed") {
    return { success: true };
  }

  const canManage =
    agentRole === "admin" ||
    (agentRole === "support" &&
      (conversation.status === "unclaimed" ||
        conversation.assignedAgentId === agentUserId));

  if (!canManage) {
    return { success: false, error: "ممنوع" };
  }

  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");

  await conversationsCollection.updateOne(
    { id: conversationId },
    {
      $set: {
        status: "closed" as GuestConversationStatus,
        closedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return { success: true };
}

export async function deleteGuestConversation(
  conversationId: string,
  agentUserId: string,
  agentRole: UserRole
): Promise<{ success: boolean; error?: string; participantIds?: string[] }> {
  const conversation = await getConversationDocument(conversationId);
  if (!conversation || conversation.source !== "guest_widget") {
    return { success: false, error: "المحادثة غير موجودة" };
  }

  const canManage =
    agentRole === "admin" ||
    (agentRole === "support" &&
      (conversation.status === "unclaimed" ||
        conversation.assignedAgentId === agentUserId));

  if (!canManage) {
    return { success: false, error: "ممنوع" };
  }

  const participantIds = [...conversation.participantIds];
  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");
  const messagesCollection = await getCollection("messages");

  await messagesCollection.deleteMany({ conversationId });
  await conversationsCollection.deleteOne({ id: conversationId });

  return { success: true, participantIds };
}
