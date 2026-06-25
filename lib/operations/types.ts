export type OperationsAlertSeverity = "info" | "warning" | "critical";

export type OperationsAlert = {
  id: string;
  severity: OperationsAlertSeverity;
  title: string;
  message: string;
  href?: string;
};

export type ActivityFeedItem = {
  id: string;
  type:
    | "ticket_created"
    | "ticket_status"
    | "ticket_assigned"
    | "guest_chat"
    | "ai_escalation"
    | "comment"
    | "other";
  title: string;
  description?: string;
  actorName?: string;
  href?: string;
  createdAt: string;
};

export type AgentPresenceRow = {
  userId: string;
  name: string;
  role: string;
  /** Active socket connection to the platform. */
  connected: boolean;
  /** Explicitly opted in to receive live chat. */
  chatAvailable: boolean;
  /** Ready for live chat (connected + chatAvailable). */
  liveChatReady: boolean;
  openTickets: number;
  claimedChats: number;
  resolvedToday: number;
};

export type ServiceHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export type ServiceHealthItem = {
  id: string;
  name: string;
  status: ServiceHealthStatus;
  detail: string;
  checkedAt: string;
};

export type OperationsCenterSnapshot = {
  generatedAt: string;
  conversations: {
    live: number;
    waiting: number;
    claimed: number;
    closedToday: number;
    avgWaitMinutes: number;
    maxWaitMinutes: number;
    highPriorityWaiting: number;
  };
  tickets: {
    active: number;
    open: number;
    inProgress: number;
    waitingOnCustomer: number;
    urgent: number;
    unassigned: number;
    newToday: number;
    resolvedToday: number;
  };
  agents: {
    /** Agents ready for live chat (available + connected). */
    availableForChatCount: number;
    connectedCount: number;
    availableOptInCount: number;
    totalStaff: number;
    /** @deprecated Use availableForChatCount */
    onlineCount: number;
    rows: AgentPresenceRow[];
  };
  responseTimes: {
    avgFirstResponseMinutes: number;
    avgResponseMinutes: number;
    sampleSize: number;
  };
  ai: {
    sessionsToday: number;
    aiAssistedToday: number;
    escalatedToday: number;
    humanAssistedToday: number;
    liveChatsToday: number;
    aiMatchRateToday: number;
  };
  alerts: OperationsAlert[];
  activityFeed: ActivityFeedItem[];
  serviceHealth: ServiceHealthItem[];
};
