/**
 * Conversation List Component
 *
 * Operational support inbox list with guest queue priority and claim actions.
 */

"use client";

import { useMemo, useState } from "react";
import { Headset, RefreshCw, Search, Users } from "lucide-react";

import {
  GuestPriorityBadge,
  getPriorityRowClass,
} from "@/components/chat/guest-priority-badge";
import { GuestQueueStatsBar } from "@/components/chat/guest-queue-stats-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ConversationListSkeleton, Spinner } from "@/components/ui/loading";
import { useNow } from "@/hooks/useNow";
import { useUserPresence } from "@/hooks/useUserPresence";
import type { ConversationWithParticipants } from "@/hooks/useRealtimeConversations";
import {
  computeGuestQueueStats,
  formatWaitingDuration,
  getConversationTypeLabel,
  getGuestQueuePriority,
  getGuestWaitingMs,
  isGuestLiveChat,
  isUnclaimedGuestChat,
  shouldHighlightLongWait,
  sortConversationsForInbox,
} from "@/lib/chat/guest-queue";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "unread" | "groups" | "guests" | "archived";

interface ConversationListProps {
  userId: string;
  conversations: ConversationWithParticipants[];
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string | null;
  isGuestOnline?: (conversationId: string) => boolean;
  activeTab?: FilterTab;
  onTabChange?: (tab: FilterTab) => void;
  onClaimConversation?: (conversationId: string) => void;
  claimingConversationId?: string | null;
}

export function ConversationList({
  userId,
  conversations,
  loading = false,
  error = null,
  onRetry,
  onSelectConversation,
  selectedConversationId,
  isGuestOnline,
  activeTab: controlledTab,
  onTabChange,
  onClaimConversation,
  claimingConversationId,
}: ConversationListProps) {
  const now = useNow();
  const { isUserOnline } = useUserPresence(userId);
  const [searchQuery, setSearchQuery] = useState("");
  const [internalTab, setInternalTab] = useState<FilterTab>("all");
  const activeTab = controlledTab ?? internalTab;

  const setActiveTab = (tab: FilterTab) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const queueStats = useMemo(
    () => computeGuestQueueStats(conversations, userId, now),
    [conversations, userId, now]
  );

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    switch (activeTab) {
      case "unread":
        filtered = filtered.filter(
          (conv) => conv.unreadCount && conv.unreadCount > 0
        );
        break;
      case "groups":
        filtered = filtered.filter(
          (conv) =>
            conv.type === "group" || (conv.participants?.length || 0) > 2
        );
        break;
      case "guests":
        filtered = filtered.filter(isGuestLiveChat);
        break;
      case "archived":
        filtered = filtered.filter((conv) => conv.guest_status === "closed");
        break;
      default:
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conversation) => {
        const otherParticipants = conversation.participants.filter(
          (p) => p.user_id !== userId
        );
        const guestName = conversation.guest_name?.toLowerCase() || "";
        return (
          guestName.includes(query) ||
          otherParticipants.some((participant) =>
            participant.user_name?.toLowerCase().includes(query)
          )
        );
      });
    }

    return sortConversationsForInbox(filtered, now);
  }, [conversations, searchQuery, userId, activeTab, now]);

  const tabs: { key: FilterTab; label: string; badge?: number }[] = [
    { key: "all", label: "الكل" },
    {
      key: "guests",
      label: "الزوار",
      badge: queueStats.unclaimedTotal || undefined,
    },
    { key: "unread", label: "غير مقروء" },
    { key: "groups", label: "مجموعات" },
    { key: "archived", label: "مؤرشف" },
  ];

  if (loading && conversations.length === 0) {
    return <ConversationListSkeleton />;
  }

  if (error && conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/30 px-4 py-10 text-center">
        <p className="text-sm font-medium text-foreground">
          تعذّر تحميل المحادثات
        </p>
        <p className="mt-1 max-w-[240px] text-xs text-muted-foreground">
          {error.message || "تحقق من الاتصال وحاول مرة أخرى."}
        </p>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            className="mt-4 rounded-lg"
            onClick={onRetry}
          >
            <RefreshCw className="me-1.5 h-3.5 w-3.5" />
            إعادة المحاولة
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!archivedOnly(activeTab) && (
        <GuestQueueStatsBar stats={queueStats} />
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="بحث في المحادثات…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 rounded-xl border-border/50 bg-muted/25 ps-9 text-sm transition-colors focus-visible:bg-background"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all duration-150",
              activeTab === tab.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={cn(
                  "min-w-[1rem] rounded-full px-1 text-[9px] font-bold leading-4",
                  activeTab === tab.key
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredConversations.length === 0 ? (
        <InboxEmptyState activeTab={activeTab} hasSearch={Boolean(searchQuery.trim())} />
      ) : (
        <div className="space-y-0.5">
          {filteredConversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              userId={userId}
              now={now}
              isSelected={selectedConversationId === conversation.id}
              isGuestOnline={isGuestOnline}
              isUserOnline={isUserOnline}
              onSelect={() => onSelectConversation(conversation.id)}
              onClaim={
                onClaimConversation
                  ? () => onClaimConversation(conversation.id)
                  : undefined
              }
              isClaiming={claimingConversationId === conversation.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatListTime(iso: string | undefined, now: number): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = now - date.getTime();
  if (diffMs < 60_000) return "الآن";
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin} د`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} س`;
  const dayDiff = Math.floor(diffHr / 24);
  if (dayDiff < 7) return `${dayDiff} ي`;
  return new Intl.DateTimeFormat("ar-SA", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function archivedOnly(tab: FilterTab) {
  return tab === "archived";
}

function InboxEmptyState({
  activeTab,
  hasSearch,
}: {
  activeTab: FilterTab;
  hasSearch: boolean;
}) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">لا توجد نتائج</p>
      </div>
    );
  }

  const messages: Record<FilterTab, { title: string; body: string }> = {
    all: {
      title: "لا محادثات بعد",
      body: "ستظهر محادثات الزوار والعملاء هنا فور وصولها.",
    },
    guests: {
      title: "لا محادثات زوار",
      body: "عندما يبدأ زائر محادثة مباشرة ستظهر في هذه القائمة.",
    },
    unread: {
      title: "لا رسائل غير مقروءة",
      body: "أنت على اطلاع بكل المحادثات.",
    },
    groups: {
      title: "لا محادثات جماعية",
      body: "المحادثات الجماعية ستظهر هنا.",
    },
    archived: {
      title: "لا محادثات مؤرشفة",
      body: "المحادثات المؤرشفة ستظهر هنا.",
    },
  };

  const copy = messages[activeTab];

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 px-4 py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Headset className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">{copy.title}</p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
        {copy.body}
      </p>
    </div>
  );
}

function ConversationRow({
  conversation,
  userId,
  now,
  isSelected,
  isGuestOnline,
  isUserOnline,
  onSelect,
  onClaim,
  isClaiming,
}: {
  conversation: ConversationWithParticipants;
  userId: string;
  now: number;
  isSelected: boolean;
  isGuestOnline?: (conversationId: string) => boolean;
  isUserOnline: (id: string) => boolean;
  onSelect: () => void;
  onClaim?: () => void;
  isClaiming?: boolean;
}) {
  const otherParticipants = conversation.participants.filter(
    (p) => p.user_id !== userId
  );
  const firstParticipant = otherParticipants[0];
  const hasUnread =
    typeof conversation.unreadCount === "number" &&
    conversation.unreadCount > 0;
  const isGuestConversation = isGuestLiveChat(conversation);
  const isArchivedGuest = conversation.guest_status === "closed";
  const isUnclaimedGuest = isUnclaimedGuestChat(conversation);
  const guestOnline =
    isGuestConversation &&
    !isArchivedGuest &&
    (isGuestOnline?.(conversation.id) ?? false);
  const isOnline =
    firstParticipant &&
    firstParticipant.user_role !== "guest" &&
    isUserOnline(firstParticipant.user_id);

  const waitingMs = isUnclaimedGuest ? getGuestWaitingMs(conversation, now) : 0;
  const priority = isUnclaimedGuest
    ? getGuestQueuePriority(waitingMs)
    : "normal";
  const typeLabel =
    !isGuestConversation && getConversationTypeLabel(conversation);

  const title =
    otherParticipants.length > 0
      ? otherParticipants.length > 1
        ? otherParticipants.map((p) => p.user_name || "مستخدم").join(", ")
        : firstParticipant?.user_name ||
          conversation.guest_name ||
          "مستخدم"
      : conversation.guest_name || "زائر";

  const listTime = formatListTime(
    conversation.last_message_at || conversation.created_at,
    now
  );

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "group relative rounded-xl px-2.5 py-2 transition-all duration-150",
        isSelected
          ? "bg-primary/[0.08] shadow-sm ring-1 ring-primary/20"
          : "hover:bg-muted/50",
        isUnclaimedGuest && shouldHighlightLongWait(priority) && !isSelected,
        isUnclaimedGuest && getPriorityRowClass(priority)
      )}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {isSelected && (
        <span className="absolute inset-y-2 end-0 w-0.5 rounded-full bg-primary" />
      )}
      <div className="flex items-start gap-2.5">
        <div className="relative mt-0.5 h-9 w-9 shrink-0">
          <Avatar className="h-9 w-9">
            {otherParticipants.length > 1 ? (
              <AvatarFallback className="bg-muted text-muted-foreground">
                <Users className="h-4 w-4" />
              </AvatarFallback>
            ) : (
              <>
                {firstParticipant?.user_image && (
                  <AvatarImage src={firstParticipant.user_image} alt={title} />
                )}
                <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                  {title[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          {otherParticipants.length === 1 && isOnline && (
            <span className="absolute bottom-0 end-0 block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          )}
          {isGuestConversation && !isArchivedGuest && (
            <span
              className={cn(
                "absolute bottom-0 end-0 block h-2 w-2 rounded-full ring-2 ring-background",
                guestOnline ? "bg-emerald-500" : "bg-muted-foreground/50"
              )}
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <p
              className={cn(
                "min-w-0 flex-1 truncate text-[13px] leading-tight",
                hasUnread || isUnclaimedGuest ? "font-semibold" : "font-medium"
              )}
            >
              {title}
            </p>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {listTime && (
                <span
                  className={cn(
                    "text-[10px] tabular-nums leading-none",
                    hasUnread
                      ? "font-semibold text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {listTime}
                </span>
              )}
              {hasUnread && (
                <span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                  {conversation.unreadCount! > 9
                    ? "9+"
                    : conversation.unreadCount}
                </span>
              )}
            </div>
          </div>

          <p
            className={cn(
              "mt-0.5 truncate text-xs leading-snug",
              hasUnread ? "font-medium text-foreground/85" : "text-muted-foreground"
            )}
          >
            {conversation.lastMessage ? (
              conversation.lastMessage.is_deleted ? (
                <span className="italic">رسالة محذوفة</span>
              ) : (
                <>
                  {conversation.lastMessage.sender_id === userId && (
                    <span className="text-muted-foreground">أنت: </span>
                  )}
                  {conversation.lastMessage.content || "مرفق"}
                </>
              )
            ) : (
              <span className="italic text-muted-foreground/80">لا رسائل</span>
            )}
          </p>

          {(isUnclaimedGuest || typeLabel || (isGuestConversation && !isUnclaimedGuest && !isArchivedGuest)) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {isUnclaimedGuest && (
                <>
                  <GuestPriorityBadge priority={priority} />
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {formatWaitingDuration(waitingMs)}
                  </span>
                </>
              )}
              {typeLabel && (
                <span className="text-[10px] text-muted-foreground">
                  {typeLabel}
                </span>
              )}
              {isGuestConversation && !isUnclaimedGuest && !isArchivedGuest && (
                <span
                  className={cn(
                    "text-[10px]",
                    guestOnline
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {guestOnline ? "متصل" : "غير متصل"}
                </span>
              )}
            </div>
          )}
        </div>

        {isUnclaimedGuest && onClaim && (
          <Button
            size="sm"
            className="mt-1 h-7 shrink-0 rounded-lg px-2.5 text-[11px] shadow-sm"
            disabled={isClaiming}
            onClick={(e) => {
              e.stopPropagation();
              onClaim();
            }}
          >
            {isClaiming ? (
              <Spinner size="xs" />
            ) : (
              "استلام"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
