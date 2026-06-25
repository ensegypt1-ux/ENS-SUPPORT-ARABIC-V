import type { ConversationDocument } from "@/lib/chat/server";

export type ServerGuestQueueMetrics = {
  waiting: number;
  claimed: number;
  live: number;
  closedToday: number;
  avgWaitMinutes: number;
  maxWaitMinutes: number;
  highPriorityWaiting: number;
};

function getWaitMinutes(createdAt: Date, now: Date) {
  return Math.max(0, (now.getTime() - createdAt.getTime()) / 60_000);
}

function getPriorityFromWaitMinutes(minutes: number) {
  if (minutes >= 10) return "urgent";
  if (minutes >= 5) return "high";
  if (minutes >= 2) return "medium";
  return "normal";
}

export function computeGuestQueueMetricsFromDocuments(
  conversations: ConversationDocument[],
  now = new Date()
): ServerGuestQueueMetrics {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  let waiting = 0;
  let claimed = 0;
  let live = 0;
  let closedToday = 0;
  let highPriorityWaiting = 0;
  const waitMinutes: number[] = [];

  for (const conversation of conversations) {
    if (conversation.source !== "guest_widget") continue;

    const status = conversation.status || "unclaimed";
    const createdAt =
      conversation.createdAt instanceof Date
        ? conversation.createdAt
        : new Date(conversation.createdAt);

    if (status === "closed") {
      const closedAt = conversation.closedAt
        ? conversation.closedAt instanceof Date
          ? conversation.closedAt
          : new Date(conversation.closedAt)
        : null;
      if (closedAt && closedAt >= startOfToday) {
        closedToday += 1;
      }
      continue;
    }

    live += 1;

    if (status === "unclaimed") {
      waiting += 1;
      const minutes = getWaitMinutes(createdAt, now);
      waitMinutes.push(minutes);
      const priority = getPriorityFromWaitMinutes(minutes);
      if (priority === "high" || priority === "urgent") {
        highPriorityWaiting += 1;
      }
    } else if (status === "claimed") {
      claimed += 1;
    }
  }

  const avgWaitMinutes =
    waitMinutes.length > 0
      ? Math.round(
          (waitMinutes.reduce((sum, value) => sum + value, 0) /
            waitMinutes.length) *
            10
        ) / 10
      : 0;

  const maxWaitMinutes =
    waitMinutes.length > 0
      ? Math.round(Math.max(...waitMinutes) * 10) / 10
      : 0;

  return {
    waiting,
    claimed,
    live,
    closedToday,
    avgWaitMinutes,
    maxWaitMinutes,
    highPriorityWaiting,
  };
}
