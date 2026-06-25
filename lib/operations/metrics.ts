import { startOfDay, subDays } from "date-fns";

import type { ConversationDocument } from "@/lib/chat/server";
import { getCollection, getDb } from "@/lib/db";
import { getSystemSettings } from "@/lib/settings-utils";
import { isQdrantConfigured, qdrantHealth } from "@/lib/ai/qdrant";
import { getSocketServer } from "@/lib/socket/server";
import {
  getAvailableStaffUserIds,
  getConnectedStaffUserIds,
  getStaffMembers,
  getSupportAvailabilitySnapshot,
} from "@/lib/chat/availability";
import { formatOperationsDuration } from "@/lib/operations/format-duration";
import { computeGuestQueueMetricsFromDocuments } from "@/lib/operations/guest-queue-metrics";
import type {
  ActivityFeedItem,
  AgentPresenceRow,
  OperationsAlert,
  OperationsCenterSnapshot,
  ServiceHealthItem,
} from "@/lib/operations/types";
import type { AIChatLog, Ticket, TicketHistory, User } from "@/types";

const ACTIVE_TICKET_STATUSES = [
  "open",
  "in_progress",
  "waiting_on_customer",
  "scheduled_meeting",
] as const;

async function buildServiceHealth(): Promise<ServiceHealthItem[]> {
  const checkedAt = new Date().toISOString();
  const items: ServiceHealthItem[] = [];

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    items.push({
      id: "mongodb",
      name: "قاعدة البيانات",
      status: "healthy",
      detail: "MongoDB متصل",
      checkedAt,
    });
  } catch (error) {
    items.push({
      id: "mongodb",
      name: "قاعدة البيانات",
      status: "down",
      detail:
        error instanceof Error ? error.message : "تعذّر الاتصال بقاعدة البيانات",
      checkedAt,
    });
  }

  const socket = getSocketServer();
  items.push({
    id: "socket",
    name: "الاتصال الفوري",
    status: socket ? "healthy" : "degraded",
    detail: socket ? "خادم Socket.IO يعمل" : "خادم Socket.IO غير متاح",
    checkedAt,
  });

  try {
    const settings = await getSystemSettings();
    const emailEnabled =
      process.env.EMAIL_NOTIFICATIONS_ENABLED === "true" &&
      settings.email.enabled;
    items.push({
      id: "email",
      name: "البريد الإلكتروني",
      status: emailEnabled ? "healthy" : "unknown",
      detail: emailEnabled
        ? "إشعارات البريد مفعّلة"
        : "إشعارات البريد غير مفعّلة",
      checkedAt,
    });
  } catch {
    items.push({
      id: "email",
      name: "البريد الإلكتروني",
      status: "unknown",
      detail: "تعذّر التحقق من إعدادات البريد",
      checkedAt,
    });
  }

  if (isQdrantConfigured()) {
    const health = await qdrantHealth();
    items.push({
      id: "qdrant",
      name: "فهرس المعرفة (Qdrant)",
      status: health.ok ? "healthy" : "down",
      detail: health.ok
        ? "Qdrant متصل"
        : health.error || "تعذّر الاتصال بـ Qdrant",
      checkedAt,
    });
  } else {
    items.push({
      id: "qdrant",
      name: "فهرس المعرفة (Qdrant)",
      status: "unknown",
      detail: "غير مُعدّ — يستخدم MongoDB للفهرسة",
      checkedAt,
    });
  }

  const onlineStaff = await getConnectedStaffUserIds();
  const availability = await getSupportAvailabilitySnapshot();
  items.push({
    id: "support_presence",
    name: "المحادثة المباشرة",
    status:
      availability.count > 0
        ? "healthy"
        : availability.availableCount > 0
          ? "degraded"
          : "unknown",
    detail:
      availability.count > 0
        ? `${availability.count} موظف جاهز للمحادثة المباشرة`
        : availability.availableCount > 0
          ? `${availability.availableCount} موظف متاح لكن غير متصل`
          : "لا يوجد موظفون متاحون للمحادثة المباشرة",
    checkedAt,
  });

  return items;
}

async function buildResponseTimes(startOfToday: Date) {
  const historyCollection = await getCollection<TicketHistory>("ticket_history");
  const ticketsCollection = await getCollection<Ticket>("tickets");
  const lookbackStart = subDays(startOfToday, 7);

  type TicketRow = Pick<Ticket, "_id" | "createdAt" | "customerId">;

  const recentTickets = (await ticketsCollection
    .find({ createdAt: { $gte: startOfToday } })
    .project({ _id: 1, createdAt: 1, customerId: 1 })
    .toArray()) as TicketRow[];

  const lookbackTickets = (await ticketsCollection
    .find({ createdAt: { $gte: lookbackStart } })
    .project({ _id: 1, createdAt: 1, customerId: 1 })
    .toArray()) as TicketRow[];

  function ticketKeys(ticket: TicketRow) {
    const id = ticket._id?.toString?.() ? ticket._id.toString() : String(ticket._id);
    return {
      id,
      keys: [id, ticket._id],
      createdAt:
        ticket.createdAt instanceof Date
          ? ticket.createdAt
          : new Date(ticket.createdAt),
      customerId: ticket.customerId,
    };
  }

  const todayTicketData = recentTickets.map(ticketKeys);
  const lookbackTicketData = lookbackTickets.map(ticketKeys);

  async function averageFirstResponseMinutes(
    ticketData: ReturnType<typeof ticketKeys>[]
  ) {
    if (ticketData.length === 0) return { average: 0, sampleSize: 0 };

    const firstResponses = await historyCollection
      .aggregate<{
        _id: string;
        firstResponseDate: Date;
        userId: string;
      }>([
        {
          $match: {
            ticketId: { $in: ticketData.flatMap((ticket) => ticket.keys) },
            action: "comment_added",
          },
        },
        { $sort: { createdAt: 1 } },
        {
          $group: {
            _id: { $toString: "$ticketId" },
            firstResponseDate: { $first: "$createdAt" },
            userId: { $first: "$userId" },
          },
        },
      ])
      .toArray();

    const ticketCreationMap = new Map(
      ticketData.map((ticket) => [ticket.id, ticket.createdAt] as const)
    );

    const ticketCustomerMap = new Map(
      ticketData.map((ticket) => [ticket.id, ticket.customerId] as const)
    );

    const responseMinutes: number[] = [];
    for (const response of firstResponses) {
      if (response.userId === ticketCustomerMap.get(response._id)) continue;
      const createdAt = ticketCreationMap.get(response._id);
      if (!createdAt) continue;
      const minutes =
        (new Date(response.firstResponseDate).getTime() - createdAt.getTime()) /
        60_000;
      if (minutes >= 0) responseMinutes.push(minutes);
    }

    return {
      average:
        responseMinutes.length > 0
          ? Math.round(
              (responseMinutes.reduce((sum, value) => sum + value, 0) /
                responseMinutes.length) *
                10
            ) / 10
          : 0,
      sampleSize: responseMinutes.length,
    };
  }

  const [todayResponse, lookbackResponse] = await Promise.all([
    averageFirstResponseMinutes(todayTicketData),
    averageFirstResponseMinutes(lookbackTicketData),
  ]);

  return {
    avgFirstResponseMinutes: todayResponse.average,
    avgResponseMinutes: lookbackResponse.average,
    sampleSize: todayResponse.sampleSize,
  };
}

async function buildAgentRows(
  connectedStaffIds: Set<string>,
  availableStaffIds: Set<string>,
  startOfToday: Date
): Promise<AgentPresenceRow[]> {
  const staffMembers = await getStaffMembers();
  const ticketsCollection = await getCollection<Ticket>("tickets");
  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");

  const rows = await Promise.all(
    staffMembers.map(async ({ userId, role }) => {
      const usersCollection = await getCollection<User>("user");
      const user = await usersCollection.findOne({
        $or: [{ id: userId }, { _id: userId as unknown as User["_id"] }],
      });

      const [openTickets, claimedChats, resolvedToday] = await Promise.all([
        ticketsCollection.countDocuments({
          assignedToId: userId,
          status: { $in: [...ACTIVE_TICKET_STATUSES] },
        }),
        conversationsCollection.countDocuments({
          source: "guest_widget",
          status: "claimed",
          assignedAgentId: userId,
        }),
        ticketsCollection.countDocuments({
          assignedToId: userId,
          resolvedAt: { $gte: startOfToday },
        }),
      ]);

      return {
        userId,
        name: user?.name || "موظف",
        role,
        connected: connectedStaffIds.has(userId),
        chatAvailable: availableStaffIds.has(userId),
        liveChatReady:
          connectedStaffIds.has(userId) && availableStaffIds.has(userId),
        openTickets,
        claimedChats,
        resolvedToday,
      };
    })
  );

  return rows.sort((a, b) => {
    if (a.liveChatReady !== b.liveChatReady) return a.liveChatReady ? -1 : 1;
    if (a.connected !== b.connected) return a.connected ? -1 : 1;
    return b.openTickets + b.claimedChats - (a.openTickets + a.claimedChats);
  });
}

async function buildActivityFeed(limit = 20): Promise<ActivityFeedItem[]> {
  const historyCollection = await getCollection<TicketHistory>("ticket_history");
  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");
  const aiLogsCollection = await getCollection<AIChatLog>("ai_chat_logs");
  const usersCollection = await getCollection<User>("user");

  const [historyRows, recentGuestChats, recentEscalations] = await Promise.all([
    historyCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray(),
    conversationsCollection
      .find({ source: "guest_widget" })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
    aiLogsCollection
      .find({ outcome: "escalated_ticket" })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
  ]);

  const actorIds = [
    ...new Set(
      historyRows
        .map((row) => row.userId)
        .filter((id) => id && id !== "ai-agent")
    ),
  ];

  const actors = await usersCollection
    .find({ id: { $in: actorIds } })
    .project({ id: 1, name: 1 })
    .toArray();

  const actorMap = new Map(actors.map((user) => [user.id, user.name || "موظف"]));

  const historyItems: ActivityFeedItem[] = historyRows.map((row) => {
    const rawTicketId = row.ticketId as string | { toString(): string };
    const ticketId =
      typeof rawTicketId === "string" ? rawTicketId : rawTicketId.toString();
    const actionLabels: Record<string, string> = {
      created: "تذكرة جديدة",
      status_changed: "تغيير حالة تذكرة",
      assigned: "تعيين تذكرة",
      comment_added: "تعليق جديد",
      resolved: "حل تذكرة",
      closed: "إغلاق تذكرة",
      meeting_scheduled: "جدولة اجتماع",
    };

    return {
      id: `history-${row._id?.toString?.() || row.ticketId}-${row.createdAt}`,
      type:
        row.action === "created"
          ? "ticket_created"
          : row.action === "assigned"
            ? "ticket_assigned"
            : row.action === "status_changed"
              ? "ticket_status"
              : row.action === "comment_added"
                ? "comment"
                : "other",
      title: actionLabels[row.action] || "نشاط على تذكرة",
      description: row.newValue || row.metadata?.title?.toString(),
      actorName:
        row.userId === "ai-agent"
          ? "مساعد الذكاء الاصطناعي"
          : actorMap.get(row.userId) || undefined,
      href: ticketId ? `/admin/tickets/${ticketId}` : undefined,
      createdAt: new Date(row.createdAt).toISOString(),
    };
  });

  const guestItems: ActivityFeedItem[] = recentGuestChats.map((conversation) => ({
    id: `guest-${conversation.id}`,
    type: "guest_chat",
    title: "محادثة زائر جديدة",
    description:
      conversation.guestName?.trim() ||
      conversation.guestPhone ||
      "زائر",
    href: `/admin/messages?conversation=${conversation.id}`,
    createdAt: new Date(conversation.createdAt).toISOString(),
  }));

  const aiItems: ActivityFeedItem[] = recentEscalations.map((log) => ({
    id: `ai-${log._id.toString()}`,
    type: "ai_escalation",
    title: "تصعيد من المساعد الذكي",
    description: log.question.slice(0, 120),
    href: log.createdTicketId
      ? `/admin/tickets/${log.createdTicketId}`
      : "/admin/ai-support-agent",
    createdAt: new Date(log.createdAt).toISOString(),
  }));

  return [...historyItems, ...guestItems, ...aiItems]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

function buildAlerts(input: {
  conversations: OperationsCenterSnapshot["conversations"];
  tickets: OperationsCenterSnapshot["tickets"];
  agents: OperationsCenterSnapshot["agents"];
  serviceHealth: ServiceHealthItem[];
}): OperationsAlert[] {
  const alerts: OperationsAlert[] = [];

  if (input.conversations.highPriorityWaiting > 0) {
    alerts.push({
      id: "guest-high-priority",
      severity: "critical",
      title: "محادثات زوار بانتظار طويل",
      message: `${input.conversations.highPriorityWaiting} محادثة تجاوزت وقت الانتظار المقبول`,
      href: "/admin/messages",
    });
  } else if (input.conversations.waiting > 0) {
    alerts.push({
      id: "guest-waiting",
      severity: input.conversations.waiting >= 5 ? "warning" : "info",
      title: "محادثات بانتظار الاستلام",
      message: `${input.conversations.waiting} محادثة زائر بانتظار موظف`,
      href: "/admin/messages",
    });
  }

  if (input.tickets.urgent > 0) {
    alerts.push({
      id: "urgent-tickets",
      severity: "critical",
      title: "تذاكر عاجلة",
      message: `${input.tickets.urgent} تذكرة عاجلة تحتاج اهتمامًا`,
      href: "/admin/tickets?priority=urgent",
    });
  }

  if (input.tickets.unassigned > 0) {
    alerts.push({
      id: "unassigned-tickets",
      severity: "warning",
      title: "تذاكر غير مُعيَّنة",
      message: `${input.tickets.unassigned} تذكرة بدون موظف مسؤول`,
      href: "/admin/tickets",
    });
  }

  if (
    input.agents.availableForChatCount === 0 &&
    input.agents.totalStaff > 0 &&
    input.conversations.waiting > 0
  ) {
    alerts.push({
      id: "no-agents-available-for-chat",
      severity: "warning",
      title: "لا يوجد موظفون جاهزون للمحادثة",
      message:
        input.agents.availableOptInCount > 0
          ? "يوجد موظفون متاحون لكن غير متصلين — المحادثات المباشرة غير جاهزة للعملاء"
          : "فعّل «متاح للمحادثة» من لوحة الدعم لاستقبال الزوار",
      href: "/admin/messages",
    });
  }

  if (input.conversations.avgWaitMinutes >= 5 && input.conversations.waiting > 0) {
    alerts.push({
      id: "avg-wait-high",
      severity: "warning",
      title: "متوسط انتظار مرتفع",
      message: `متوسط انتظار الزوار ${formatOperationsDuration(input.conversations.avgWaitMinutes)}`,
      href: "/admin/messages",
    });
  }

  for (const service of input.serviceHealth) {
    if (service.status === "down") {
      alerts.push({
        id: `service-${service.id}`,
        severity: "critical",
        title: `تعطل: ${service.name}`,
        message: service.detail,
      });
    }
  }

  return alerts;
}

export async function buildOperationsCenterSnapshot(): Promise<OperationsCenterSnapshot> {
  const now = new Date();
  const startOfToday = startOfDay(now);

  const ticketsCollection = await getCollection<Ticket>("tickets");
  const conversationsCollection =
    await getCollection<ConversationDocument>("conversations");
  const aiLogsCollection = await getCollection<AIChatLog>("ai_chat_logs");

  const [
    guestConversations,
    openTickets,
    inProgressTickets,
    waitingOnCustomer,
    urgentTickets,
    unassignedTickets,
    scheduledMeetingTickets,
    newToday,
    resolvedToday,
    aiSessionsToday,
    aiMatchedToday,
    aiEscalatedToday,
    liveChatsToday,
    connectedStaffIds,
    availableStaffIds,
    supportAvailability,
    staffMembers,
    responseTimes,
    activityFeed,
    serviceHealth,
  ] = await Promise.all([
    conversationsCollection
      .find({ source: "guest_widget" })
      .toArray(),
    ticketsCollection.countDocuments({ status: "open" }),
    ticketsCollection.countDocuments({ status: "in_progress" }),
    ticketsCollection.countDocuments({ status: "waiting_on_customer" }),
    ticketsCollection.countDocuments({ priority: "urgent", status: { $nin: ["resolved", "closed"] } }),
    ticketsCollection.countDocuments({
      status: { $nin: ["resolved", "closed"] },
      $or: [
        { assignedToId: { $exists: false } },
        { assignedToId: undefined },
      ],
    } as Record<string, unknown>),
    ticketsCollection.countDocuments({ status: "scheduled_meeting" }),
    ticketsCollection.countDocuments({ createdAt: { $gte: startOfToday } }),
    ticketsCollection.countDocuments({ resolvedAt: { $gte: startOfToday } }),
    aiLogsCollection.countDocuments({ createdAt: { $gte: startOfToday } }),
    aiLogsCollection.countDocuments({
      createdAt: { $gte: startOfToday },
      matched: true,
    }),
    aiLogsCollection.countDocuments({
      createdAt: { $gte: startOfToday },
      outcome: "escalated_ticket",
    }),
    conversationsCollection.countDocuments({
      source: "guest_widget",
      createdAt: { $gte: startOfToday },
    }),
    getConnectedStaffUserIds(),
    getAvailableStaffUserIds(),
    getSupportAvailabilitySnapshot(),
    getStaffMembers(),
    buildResponseTimes(startOfToday),
    buildActivityFeed(20),
    buildServiceHealth(),
  ]);

  const conversationMetrics = computeGuestQueueMetricsFromDocuments(
    guestConversations,
    now
  );

  const activeTickets =
    openTickets +
    inProgressTickets +
    waitingOnCustomer +
    scheduledMeetingTickets;

  const connectedStaffSet = new Set(connectedStaffIds);
  const availableStaffSet = new Set(availableStaffIds);
  const agentRows = await buildAgentRows(
    connectedStaffSet,
    availableStaffSet,
    startOfToday
  );

  const aiAssistedToday = aiMatchedToday;
  const humanAssistedToday = liveChatsToday + aiEscalatedToday + resolvedToday;

  const snapshot: OperationsCenterSnapshot = {
    generatedAt: now.toISOString(),
    conversations: conversationMetrics,
    tickets: {
      active: activeTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      waitingOnCustomer,
      urgent: urgentTickets,
      unassigned: unassignedTickets,
      newToday,
      resolvedToday,
    },
    agents: {
      availableForChatCount: supportAvailability.count,
      connectedCount: supportAvailability.connectedCount,
      availableOptInCount: supportAvailability.availableCount,
      totalStaff: staffMembers.length,
      onlineCount: supportAvailability.count,
      rows: agentRows,
    },
    responseTimes,
    ai: {
      sessionsToday: aiSessionsToday,
      aiAssistedToday,
      escalatedToday: aiEscalatedToday,
      humanAssistedToday,
      liveChatsToday,
      aiMatchRateToday:
        aiSessionsToday > 0
          ? Math.round((aiMatchedToday / aiSessionsToday) * 100)
          : 0,
    },
    alerts: [],
    activityFeed,
    serviceHealth,
  };

  snapshot.alerts = buildAlerts({
    conversations: snapshot.conversations,
    tickets: snapshot.tickets,
    agents: snapshot.agents,
    serviceHealth: snapshot.serviceHealth,
  });

  return snapshot;
}
