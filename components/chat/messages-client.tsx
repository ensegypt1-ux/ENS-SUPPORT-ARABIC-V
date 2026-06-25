/**
 * Messages Client Component
 *
 * Support inbox layout: conversation list + active thread, with optional
 * collapsible details panel for contact info and attachments.
 */

"use client";

import type { UserRole } from "@/types";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageInput } from "@/components/chat/message-input";
import { MessageThread } from "@/components/chat/message-thread";
import { ConversationList } from "@/components/chat/conversation-list";
import { ConversationDetailsPanel } from "@/components/chat/conversation-details-panel";
import {
  Bell,
  BellOff,
  ChevronRight,
  Plus,
  MessageSquare,
  PanelRightOpen,
  Volume2,
  VolumeX,
} from "lucide-react";
import { GuestWhatsAppActions } from "@/components/shared/guest-whatsapp-actions";
import { useRealtimeConversations } from "@/hooks/useRealtimeConversations";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useGuestPresence } from "@/hooks/useGuestPresence";
import { useGuestChatInboxAlerts } from "@/hooks/useGuestChatInboxAlerts";
import { useNow } from "@/hooks/useNow";
import {
  computeGuestQueueStats,
  sortConversationsForInbox,
} from "@/lib/chat/guest-queue";
import {
  archiveGuestConversationAction,
  claimGuestConversationAction,
  deleteGuestConversationAction,
} from "@/actions/messages";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
import { NameWithRole } from "@/components/shared/name-with-role";
import type { Message } from "@/types/realtime";
import { cn } from "@/lib/utils";

type InboxTab = "all" | "unread" | "groups" | "guests" | "archived";

interface MessagesClientProps {
  userId: string;
  userRole: UserRole;
}

export function MessagesClient({ userId, userRole }: MessagesClientProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [showNewConversationDialog, setShowNewConversationDialog] =
    useState(false);
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimingConversationId, setClaimingConversationId] = useState<
    string | null
  >(null);
  const [managing, setManaging] = useState(false);
  const [inboxTab, setInboxTab] = useState<InboxTab>("all");
  const archivedOnly = inboxTab === "archived";
  const now = useNow();

  const { isUserOnline } = useUserPresence(userId);
  const { isGuestOnline } = useGuestPresence(userId);

  const {
    conversations,
    loading: conversationsLoading,
    error: conversationsError,
    refreshConversations,
  } = useRealtimeConversations(userId, {
    archivedOnly,
    activeConversationId: selectedConversationId,
  });

  const {
    soundMuted,
    toggleSoundMuted,
    notificationPermission,
    requestNotificationPermission,
  } = useGuestChatInboxAlerts(conversations, conversationsLoading);

  const queueStats = useMemo(
    () => computeGuestQueueStats(conversations, userId, now),
    [conversations, userId, now]
  );

  const selectedConversation = useMemo(
    () => conversations.find((conv) => conv.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  useEffect(() => {
    if (conversationsLoading) return;

    if (conversations.length === 0) {
      if (selectedConversationId !== null) {
        setSelectedConversationId(null);
      }
      return;
    }

    if (pendingConversationId) {
      const pendingConversationExists = conversations.some(
        (conversation) => conversation.id === pendingConversationId
      );

      if (pendingConversationExists) {
        if (selectedConversationId !== pendingConversationId) {
          setSelectedConversationId(pendingConversationId);
          setReplyToMessage(null);
        }
        setPendingConversationId(null);
      }
      return;
    }

    const hasValidSelection =
      selectedConversationId !== null &&
      conversations.some(
        (conversation) => conversation.id === selectedConversationId
      );

    if (!hasValidSelection) {
      const firstId =
        sortConversationsForInbox(conversations, now)[0]?.id ?? null;
      setSelectedConversationId(firstId);
      setReplyToMessage(null);
    }
  }, [
    conversations,
    conversationsLoading,
    pendingConversationId,
    selectedConversationId,
    now,
  ]);

  const selectedParticipant = useMemo(() => {
    if (!selectedConversation) return null;
    const others = selectedConversation.participants.filter(
      (p) => p.user_id !== userId
    );
    return others[0] || null;
  }, [selectedConversation, userId]);

  const isGuestUnclaimed =
    selectedConversation?.source === "guest_widget" &&
    selectedConversation?.guest_status === "unclaimed";

  const isGuestArchived =
    selectedConversation?.source === "guest_widget" &&
    selectedConversation?.guest_status === "closed";

  const isGuest =
    selectedConversation?.source === "guest_widget" ||
    selectedParticipant?.user_role === "guest";

  const displayName =
    selectedParticipant?.user_name ||
    selectedConversation?.guest_name ||
    (isGuest ? "زائر" : "مستخدم");

  const participantOnline =
    selectedParticipant &&
    selectedParticipant.user_role !== "guest" &&
    isUserOnline(selectedParticipant.user_id);

  const guestOnline =
    isGuest &&
    !isGuestArchived &&
    selectedConversationId !== null &&
    isGuestOnline(selectedConversationId);

  const statusLine = isGuest
    ? isGuestArchived
      ? "محادثة مؤرشفة"
      : isGuestUnclaimed
        ? "بانتظار الاستلام"
        : guestOnline
          ? "الزائر متصل"
          : "الزائر غير متصل"
    : participantOnline
      ? "متصل"
      : "غير متصل";

  const claimConversation = useCallback(
    async (conversationId: string) => {
      setClaiming(true);
      setClaimingConversationId(conversationId);
      try {
        const result = await claimGuestConversationAction(conversationId);
        if (result.success) {
          toast.success("تم استلام المحادثة");
          setSelectedConversationId(conversationId);
          await refreshConversations();
        } else {
          toast.error(result.error || "تعذّر استلام المحادثة");
        }
      } finally {
        setClaiming(false);
        setClaimingConversationId(null);
      }
    },
    [refreshConversations]
  );

  const handleClaimGuestConversation = () => {
    if (!selectedConversationId) return;
    void claimConversation(selectedConversationId);
  };

  const handleArchiveGuestConversation = async () => {
    if (!selectedConversationId) return;
    setManaging(true);
    try {
      const result = await archiveGuestConversationAction(selectedConversationId);
      if (result.success) {
        toast.success("تمت أرشفة المحادثة");
        setSelectedConversationId(null);
        setDetailsOpen(false);
        await refreshConversations();
      } else {
        toast.error(result.error || "تعذّر أرشفة المحادثة");
      }
    } finally {
      setManaging(false);
    }
  };

  const handleDeleteGuestConversation = async () => {
    if (!selectedConversationId) return;
    setManaging(true);
    try {
      const result = await deleteGuestConversationAction(selectedConversationId);
      if (result.success) {
        toast.success("تم حذف المحادثة");
        setSelectedConversationId(null);
        setDetailsOpen(false);
        await refreshConversations();
      } else {
        toast.error(result.error || "تعذّر حذف المحادثة");
      }
    } finally {
      setManaging(false);
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setReplyToMessage(null);
  };

  return (
    <>
      <div
        className={cn(
          "grid h-[calc(100dvh-theme(spacing.14)-1.5rem)] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm",
          "md:h-[calc(100dvh-theme(spacing.14)-3rem)]",
          detailsOpen && selectedConversationId
            ? "grid-cols-1 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)_280px]"
            : "grid-cols-1 lg:grid-cols-[minmax(260px,300px)_minmax(0,1fr)]"
        )}
      >
        {/* Conversation list */}
        <div
          className={cn(
            "flex flex-col overflow-hidden border-e border-border/50 bg-background",
            selectedConversationId ? "hidden lg:flex" : "flex"
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight">صندوق الوارد</h2>
              {queueStats.unclaimedTotal > 0 && (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
                  {queueStats.unclaimedTotal}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg"
                onClick={toggleSoundMuted}
                title={soundMuted ? "تشغيل صوت التنبيه" : "كتم صوت التنبيه"}
              >
                {soundMuted ? (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              {notificationPermission === "default" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => void requestNotificationPermission()}
                  title="تفعيل إشعارات المتصفح"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              {notificationPermission === "denied" && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg opacity-50"
                  disabled
                  title="إشعارات المتصفح معطّلة"
                >
                  <BellOff className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg"
                onClick={() => setShowNewConversationDialog(true)}
                title="محادثة جديدة"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3">
            <ConversationList
              userId={userId}
              conversations={conversations}
              loading={conversationsLoading}
              error={conversationsError}
              onRetry={() => void refreshConversations()}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversationId}
              isGuestOnline={isGuestOnline}
              activeTab={inboxTab}
              onTabChange={setInboxTab}
              onClaimConversation={(id) => void claimConversation(id)}
              claimingConversationId={claimingConversationId}
            />
          </div>
        </div>

        {/* Active thread */}
        <div
          className={cn(
            "flex min-w-0 flex-col overflow-hidden bg-muted/20",
            selectedConversationId ? "flex" : "hidden lg:flex"
          )}
        >
          {selectedConversationId && selectedConversation ? (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/50 bg-background/90 px-3 py-2.5 backdrop-blur-md sm:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-lg lg:hidden"
                    onClick={() => setSelectedConversationId(null)}
                    title="العودة للمحادثات"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9 ring-2 ring-background">
                      {selectedParticipant?.user_image && (
                        <AvatarImage
                          src={selectedParticipant.user_image}
                          alt={displayName}
                        />
                      )}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {displayName[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    {(participantOnline || guestOnline) && (
                      <span className="absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <NameWithRole
                      name={displayName}
                      role={selectedParticipant?.user_role}
                      className="truncate text-sm font-semibold tracking-tight"
                      badgeClassName="h-4 px-1.5 text-[10px]"
                    />
                    <p
                      className={cn(
                        "truncate text-[11px]",
                        isGuest && !isGuestArchived && guestOnline
                          ? "font-medium text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {statusLine}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {isGuestUnclaimed && (
                    <Button
                      size="sm"
                      className="h-8 rounded-lg px-3 text-xs"
                      disabled={claiming}
                      onClick={() => void handleClaimGuestConversation()}
                    >
                      {claiming ? "جاري الاستلام…" : "استلام"}
                    </Button>
                  )}
                  {isGuest && selectedConversation?.guest_phone && !detailsOpen && (
                    <GuestWhatsAppActions
                      phone={selectedConversation.guest_phone}
                      guestName={displayName}
                      compact
                    />
                  )}
                  <Button
                    variant={detailsOpen ? "secondary" : "ghost"}
                    size="icon"
                    className="hidden h-8 w-8 rounded-lg lg:inline-flex"
                    onClick={() => setDetailsOpen((open) => !open)}
                    title="تفاصيل المحادثة"
                    aria-pressed={detailsOpen}
                  >
                    <PanelRightOpen className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="chat-thread-surface flex-1 overflow-y-auto px-3 py-4 sm:px-4" dir="rtl">
                <MessageThread
                  conversationId={selectedConversationId}
                  userId={userId}
                  participants={selectedConversation.participants}
                  onReplyToMessage={setReplyToMessage}
                  hideAvatars={selectedConversation.type !== "group"}
                  guestName={selectedConversation.guest_name}
                />
              </div>

              <div className="shrink-0 border-t border-border/50 bg-background/95 px-3 py-3 backdrop-blur-md sm:px-4" dir="rtl">
                {isGuestArchived ? (
                  <p className="rounded-xl bg-muted/40 py-2.5 text-center text-sm text-muted-foreground">
                    محادثة مؤرشفة — للقراءة فقط
                  </p>
                ) : isGuestUnclaimed ? (
                  <p className="rounded-xl bg-amber-500/10 py-2.5 text-center text-sm text-amber-800 dark:text-amber-200">
                    استلم المحادثة للرد على الزائر
                  </p>
                ) : (
                  <MessageInput
                    conversationId={selectedConversationId}
                    userId={userId}
                    replyToMessage={replyToMessage}
                    onCancelReply={() => setReplyToMessage(null)}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h3 className="mb-1 text-base font-semibold tracking-tight">اختر محادثة</h3>
              <p className="mb-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
                اختر محادثة من القائمة أو ابدأ محادثة جديدة مع عميل
              </p>
              <Button
                size="sm"
                className="rounded-lg"
                onClick={() => setShowNewConversationDialog(true)}
              >
                <Plus className="me-1.5 h-4 w-4" />
                محادثة جديدة
              </Button>
            </div>
          )}
        </div>

        {/* Collapsible details panel */}
        {detailsOpen && selectedConversationId && selectedConversation && (
          <div className="hidden overflow-hidden border-s border-border/50 lg:block">
            <ConversationDetailsPanel
              conversation={selectedConversation}
              participant={selectedParticipant}
              userId={userId}
              isUserOnline={isUserOnline}
              isGuestOnline={isGuestOnline}
              onClose={() => setDetailsOpen(false)}
              onArchive={
                isGuest && !isGuestArchived
                  ? handleArchiveGuestConversation
                  : undefined
              }
              onDelete={
                isGuest ? handleDeleteGuestConversation : undefined
              }
              managing={managing}
            />
          </div>
        )}
      </div>

      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        currentUserId={userId}
        currentUserRole={userRole}
        onConversationCreated={(conversationId) => {
          setPendingConversationId(conversationId);
          setSelectedConversationId(null);
          void refreshConversations();
          setShowNewConversationDialog(false);
        }}
      />
    </>
  );
}
