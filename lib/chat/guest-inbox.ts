import type { ConversationDocument } from "@/lib/chat/server";

/**
 * Guest widget sessions exist internally before the visitor sends a message.
 * Staff inbox, queue, and notifications should only surface conversations once
 * the visitor has actually started chatting.
 */
export function isGuestConversationVisibleInStaffInbox(
  conversation: Pick<
    ConversationDocument,
    "source" | "lastMessageAt" | "awaitingFirstMessage" | "status"
  >
): boolean {
  if (conversation.source !== "guest_widget") return true;
  if (conversation.status === "closed") return true;
  if (conversation.lastMessageAt) return true;
  if (conversation.awaitingFirstMessage === false) return true;
  return false;
}

/** Mongo filter fragment: hide pre-message guest sessions from staff lists. */
export function guestStaffInboxVisibilityClause() {
  return {
    $or: [
      { source: { $ne: "guest_widget" as const } },
      { lastMessageAt: { $ne: null } },
      { awaitingFirstMessage: false },
    ],
  };
}
