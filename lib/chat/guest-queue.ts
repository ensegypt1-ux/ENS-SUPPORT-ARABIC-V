import type { ConversationWithParticipants } from "@/hooks/useRealtimeConversations";

export type GuestQueuePriority = "normal" | "medium" | "high" | "urgent";

const PRIORITY_WEIGHT: Record<GuestQueuePriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  normal: 1,
};

export const GUEST_PRIORITY_LABELS: Record<GuestQueuePriority, string> = {
  normal: "عادي",
  medium: "متوسط",
  high: "مرتفع",
  urgent: "عاجل",
};

export function isGuestLiveChat(conversation: ConversationWithParticipants) {
  return (
    conversation.source === "guest_widget" &&
    conversation.guest_status !== "closed"
  );
}

export function isUnclaimedGuestChat(conversation: ConversationWithParticipants) {
  return (
    conversation.source === "guest_widget" &&
    conversation.guest_status === "unclaimed"
  );
}

export function isClaimedByAgent(
  conversation: ConversationWithParticipants,
  agentUserId: string
) {
  return (
    conversation.source === "guest_widget" &&
    conversation.guest_status === "claimed" &&
    conversation.assigned_agent_id === agentUserId
  );
}

/** Time since the guest entered the queue (conversation created). */
export function getGuestWaitingMs(
  conversation: ConversationWithParticipants,
  now = Date.now()
) {
  const start = new Date(conversation.created_at).getTime();
  return Math.max(0, now - start);
}

export function getGuestQueuePriority(
  waitingMs: number
): GuestQueuePriority {
  const minutes = waitingMs / 60_000;
  if (minutes >= 10) return "urgent";
  if (minutes >= 5) return "high";
  if (minutes >= 2) return "medium";
  return "normal";
}

export function formatWaitingDuration(waitingMs: number): string {
  const totalSeconds = Math.floor(waitingMs / 1000);
  if (totalSeconds < 60) return `${totalSeconds} ث`;

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes} د`;

  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  return remMin > 0 ? `${hours} س ${remMin} د` : `${hours} س`;
}

export function getConversationTypeLabel(
  conversation: ConversationWithParticipants
): string | null {
  if (conversation.source === "guest_widget") {
    return "محادثة مباشرة";
  }
  if (conversation.type === "group") {
    return "مجموعة";
  }
  return "محادثة";
}

export type GuestQueueStats = {
  newChats: number;
  waiting: number;
  claimedByMe: number;
  highPriority: number;
  unclaimedTotal: number;
};

export function computeGuestQueueStats(
  conversations: ConversationWithParticipants[],
  agentUserId: string,
  now = Date.now()
): GuestQueueStats {
  const unclaimed = conversations.filter(isUnclaimedGuestChat);
  const highPriority = unclaimed.filter((conversation) => {
    const priority = getGuestQueuePriority(getGuestWaitingMs(conversation, now));
    return priority === "high" || priority === "urgent";
  });
  const newChats = unclaimed.filter((conversation) => {
    const priority = getGuestQueuePriority(getGuestWaitingMs(conversation, now));
    return priority === "normal";
  });

  return {
    newChats: newChats.length,
    waiting: unclaimed.length,
    claimedByMe: conversations.filter((c) =>
      isClaimedByAgent(c, agentUserId)
    ).length,
    highPriority: highPriority.length,
    unclaimedTotal: unclaimed.length,
  };
}

export function sortConversationsForInbox(
  conversations: ConversationWithParticipants[],
  now = Date.now()
): ConversationWithParticipants[] {
  const unclaimedGuests: ConversationWithParticipants[] = [];
  const rest: ConversationWithParticipants[] = [];

  for (const conversation of conversations) {
    if (isUnclaimedGuestChat(conversation)) {
      unclaimedGuests.push(conversation);
    } else {
      rest.push(conversation);
    }
  }

  unclaimedGuests.sort((a, b) => {
    const waitA = getGuestWaitingMs(a, now);
    const waitB = getGuestWaitingMs(b, now);
    const priA = getGuestQueuePriority(waitA);
    const priB = getGuestQueuePriority(waitB);
    const weightDiff = PRIORITY_WEIGHT[priB] - PRIORITY_WEIGHT[priA];
    if (weightDiff !== 0) return weightDiff;
    return waitB - waitA;
  });

  rest.sort((a, b) => {
    const left = new Date(a.last_message_at || a.created_at).getTime();
    const right = new Date(b.last_message_at || b.created_at).getTime();
    return right - left;
  });

  return [...unclaimedGuests, ...rest];
}

export function shouldHighlightLongWait(priority: GuestQueuePriority) {
  return priority === "high" || priority === "urgent";
}
