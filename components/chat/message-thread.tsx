/**
 * Message Thread — premium RTL conversation stream for the support inbox.
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageThreadSkeleton, ThinkingIndicator } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markMessagesAsRead } from "@/actions/messages";
import { MessageReactions } from "@/components/messages/message-reactions";
import { MessageAttachments } from "@/components/messages/message-attachments";
import { MessageEditDialog } from "@/components/messages/message-edit-dialog";
import { deleteMessage } from "@/actions/message-editing";
import {
  MoreVertical,
  Edit,
  Trash2,
  Reply,
  RefreshCw,
  CheckCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type {
  Message,
  ConversationParticipantWithUser,
} from "@/types/realtime";

interface MessageThreadProps {
  conversationId: string;
  userId: string;
  participants?: ConversationParticipantWithUser[];
  onReplyToMessage?: (message: Message) => void;
  hideAvatars?: boolean;
  guestName?: string | null;
}

const GROUP_GAP_MS = 5 * 60 * 1000;

type MessageGroup = {
  senderId: string;
  isOwn: boolean;
  messages: Message[];
};

type ThreadItem =
  | { type: "date"; key: string; label: string }
  | { type: "group"; key: string; group: MessageGroup };

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatMessageTimestamp(date: Date): string {
  const now = new Date();
  const time = new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  const dayDiff = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000
  );

  if (dayDiff === 0) return time;
  if (dayDiff === 1) return `أمس ${time}`;

  const datePart = new Intl.DateTimeFormat("ar-SA", {
    month: "short",
    day: "numeric",
  }).format(date);

  if (date.getFullYear() !== now.getFullYear()) {
    return `${datePart} ${date.getFullYear()}، ${time}`;
  }

  return `${datePart}، ${time}`;
}

function formatDateSeparator(date: Date): string {
  const now = new Date();
  const dayDiff = Math.round(
    (startOfDay(now) - startOfDay(date)) / 86_400_000
  );

  if (dayDiff === 0) return "اليوم";
  if (dayDiff === 1) return "أمس";

  const formatted = new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  }).format(date);

  return formatted;
}

function buildMessageGroups(
  messages: Message[],
  userId: string
): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const last = groups[groups.length - 1];
    const prev = last?.messages[last.messages.length - 1];
    const sameSender = last?.senderId === message.sender_id;
    const withinGap =
      prev &&
      new Date(message.created_at).getTime() -
        new Date(prev.created_at).getTime() <=
        GROUP_GAP_MS;

    if (last && sameSender && withinGap) {
      last.messages.push(message);
    } else {
      groups.push({
        senderId: message.sender_id,
        isOwn: message.sender_id === userId,
        messages: [message],
      });
    }
  }

  return groups;
}

function buildThreadItems(groups: MessageGroup[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastDay: number | null = null;

  for (const group of groups) {
    const firstDate = new Date(group.messages[0].created_at);
    const day = startOfDay(firstDate);

    if (lastDay !== day) {
      items.push({
        type: "date",
        key: `date-${day}`,
        label: formatDateSeparator(firstDate),
      });
      lastDay = day;
    }

    items.push({
      type: "group",
      key: `${group.senderId}-${group.messages[0].id}`,
      group,
    });
  }

  return items;
}

function resolveSenderLabel(
  message: Message,
  userId: string,
  participants: ConversationParticipantWithUser[] | undefined,
  guestName?: string | null
): string {
  const participant = participants?.find((p) => p.user_id === message.sender_id);

  if (message.sender_id === userId) {
    return participant?.user_name || "أنت";
  }

  if (participant?.user_role === "guest") {
    return (
      guestName?.trim() ||
      participant.user_name ||
      message.sender_name ||
      "زائر"
    );
  }

  return participant?.user_name || message.sender_name || "فريق الدعم";
}

function resolveSenderRole(
  message: Message,
  userId: string,
  participants: ConversationParticipantWithUser[] | undefined
): string | null {
  if (message.sender_id === userId) return "الدعم";
  const participant = participants?.find((p) => p.user_id === message.sender_id);
  if (participant?.user_role === "guest") return "زائر";
  if (participant?.user_role === "support-agent") return "الدعم";
  if (participant?.user_role === "admin") return "الإدارة";
  return null;
}

function shouldShowRole(label: string, role: string | null): role is string {
  if (!role) return false;
  if (role === label) return false;
  if (role === "زائر" && label === "زائر") return false;
  return true;
}

function bubbleShape(
  isOwn: boolean,
  position: "single" | "first" | "middle" | "last"
): string {
  if (isOwn) {
    switch (position) {
      case "single":
        return "rounded-[1.125rem] rounded-be-sm";
      case "first":
        return "rounded-[1.125rem] rounded-be-sm";
      case "middle":
        return "rounded-lg rounded-be-sm rounded-bs-sm";
      case "last":
        return "rounded-[1.125rem] rounded-bs-sm rounded-be-md";
    }
  }

  switch (position) {
    case "single":
      return "rounded-[1.125rem] rounded-bs-sm";
    case "first":
      return "rounded-[1.125rem] rounded-bs-sm";
    case "middle":
      return "rounded-lg rounded-be-sm rounded-bs-sm";
    case "last":
      return "rounded-[1.125rem] rounded-be-sm rounded-bs-md";
  }
}

function MessageReplyQuote({
  senderName,
  content,
  isOwnMessage,
}: {
  senderName: string;
  content: string;
  isOwnMessage: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-1.5 rounded-lg border-s-2 px-2 py-1.5",
        isOwnMessage
          ? "border-white/50 bg-white/10"
          : "border-primary/50 bg-primary/[0.06]"
      )}
    >
      <p
        className={cn(
          "line-clamp-1 text-[11px] font-semibold leading-tight",
          isOwnMessage ? "text-white/95" : "text-primary"
        )}
      >
        {senderName}
      </p>
      <p
        className={cn(
          "line-clamp-2 text-[11px] leading-snug",
          isOwnMessage ? "text-white/75" : "text-muted-foreground"
        )}
      >
        {content}
      </p>
    </div>
  );
}

function DateSeparator({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-full bg-background/80 px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-sm">
        {label}
      </span>
    </div>
  );
}

export function MessageThread({
  conversationId,
  userId,
  participants,
  onReplyToMessage,
  hideAvatars = false,
  guestName,
}: MessageThreadProps) {
  const { messages, loading, error, refreshMessages, typingUsers } =
    useConversationMessages(conversationId, userId);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<
    string | null
  >(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const threadItems = useMemo(() => {
    const groups = buildMessageGroups(messages, userId);
    return buildThreadItems(groups);
  }, [messages, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers.length]);

  useEffect(() => {
    if (messages.length === 0) return;

    const unreadMessages = messages.filter(
      (msg) =>
        msg.sender_id !== userId &&
        (!msg.read_by || !msg.read_by.includes(userId))
    );

    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map((msg) => msg.id);
      markMessagesAsRead({ conversationId, messageIds });
    }
  }, [messages, conversationId, userId]);

  const handleDeleteMessageConfirm = async () => {
    if (!pendingDeleteMessageId) return;
    if (isDeleting) return;
    setIsDeleting(true);
    const result = await deleteMessage(pendingDeleteMessageId);
    if (result.success) {
      toast.success("تم الحذف الرسالة");
      setDeleteDialogOpen(false);
      setPendingDeleteMessageId(null);
    } else {
      toast.error(result.error || "تعذّر الحذف الرسالة");
    }
    setIsDeleting(false);
  };

  if (loading && messages.length === 0) {
    return <MessageThreadSkeleton className="flex-1" />;
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-medium text-foreground">
          تعذّر تحميل الرسائل
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          {error.message || "تحقق من الاتصال وحاول مرة أخرى."}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="rounded-lg"
          onClick={() => void refreshMessages()}
        >
          <RefreshCw className="me-1.5 h-3.5 w-3.5" />
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Reply className="h-5 w-5 rotate-180" />
        </div>
        <p className="text-sm font-semibold text-foreground">لا رسائل بعد</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
          اكتب رسالتك الأولى لبدء المحادثة مع الزائر.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col justify-end" dir="rtl">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 pb-1">
          {threadItems.map((item) => {
            if (item.type === "date") {
              return <DateSeparator key={item.key} label={item.label} />;
            }

            const { group } = item;
            const firstMessage = group.messages[0];
            const lastMessage = group.messages[group.messages.length - 1];
            const senderLabel = resolveSenderLabel(
              firstMessage,
              userId,
              participants,
              guestName
            );
            const senderRole = resolveSenderRole(
              firstMessage,
              userId,
              participants
            );
            const showRole = shouldShowRole(senderLabel, senderRole);
            const senderParticipant = participants?.find(
              (p) => p.user_id === group.senderId
            );
            const senderImage = senderParticipant?.user_image;
            const readCount = lastMessage.read_by?.length ?? 0;
            const readByOthers = group.isOwn && readCount > 1;

            return (
              <div
                key={item.key}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-200",
                  "flex w-full",
                  group.isOwn ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "flex max-w-[min(100%,26rem)] gap-2",
                    group.isOwn ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {!group.isOwn && !hideAvatars && (
                    <Avatar className="mt-5 h-8 w-8 shrink-0 ring-2 ring-background">
                      {senderImage ? (
                        <AvatarImage src={senderImage} alt={senderLabel} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                          {senderLabel[0]?.toUpperCase() || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "flex min-w-0 flex-1 flex-col gap-1",
                      group.isOwn && "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-0.5",
                        group.isOwn ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {senderLabel}
                      </span>
                      {showRole && (
                        <span className="rounded-md bg-muted/80 px-1.5 py-px text-[10px] font-medium text-muted-foreground">
                          {senderRole}
                        </span>
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex w-full flex-col gap-0.5",
                        group.isOwn ? "items-end" : "items-start"
                      )}
                    >
                      {group.messages.map((message, index) => {
                        const count = group.messages.length;
                        const position =
                          count === 1
                            ? "single"
                            : index === 0
                              ? "first"
                              : index === count - 1
                                ? "last"
                                : "middle";
                        const isLastInGroup = index === count - 1;
                        const repliedToMessage = message.reply_to_id
                          ? messages.find((m) => m.id === message.reply_to_id)
                          : undefined;

                        return (
                          <div
                            key={message.id}
                            className="group/message relative max-w-full"
                          >
                            {!message.is_deleted && isLastInGroup && (
                              <div
                                className={cn(
                                  "absolute top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5",
                                  "rounded-lg border border-border/50 bg-background/95 p-0.5 shadow-sm backdrop-blur-sm",
                                  "opacity-0 transition-all duration-150",
                                  "group-hover/message:opacity-100 group-focus-within/message:opacity-100",
                                  group.isOwn
                                    ? "start-full ms-2"
                                    : "end-full me-2"
                                )}
                              >
                                <MessageReactions
                                  messageId={message.id}
                                  currentUserId={userId}
                                  reactions={message.reactions}
                                  variant="picker"
                                />
                                {onReplyToMessage && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                    onClick={() => onReplyToMessage(message)}
                                    title="الرد على الرسالة"
                                  >
                                    <Reply className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {group.isOwn && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                      >
                                        <MoreVertical className="h-3.5 w-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => setEditingMessage(message)}
                                      >
                                        <Edit className="h-4 w-4 me-2" />
                                        تعديل
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setPendingDeleteMessageId(message.id);
                                          setDeleteDialogOpen(true);
                                        }}
                                        className="text-destructive"
                                      >
                                        <Trash2 className="h-4 w-4 me-2" />
                                        حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}

                            <div
                              className={cn(
                                "w-fit max-w-full px-3 py-2 text-start text-[13px] leading-relaxed [overflow-wrap:anywhere]",
                                bubbleShape(group.isOwn, position),
                                "transition-shadow duration-150",
                                group.isOwn
                                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                                  : "border border-border/60 bg-background text-foreground shadow-sm",
                                message.is_deleted && "opacity-60"
                              )}
                            >
                              {!message.is_deleted && repliedToMessage && (
                                <MessageReplyQuote
                                  senderName={resolveSenderLabel(
                                    repliedToMessage,
                                    userId,
                                    participants,
                                    guestName
                                  )}
                                  content={
                                    repliedToMessage.content || "[مرفق]"
                                  }
                                  isOwnMessage={group.isOwn}
                                />
                              )}

                              {message.is_deleted ? (
                                <p className="text-xs italic opacity-80">
                                  [تم حذف الرسالة]
                                </p>
                              ) : (
                                <>
                                  {message.content && (
                                    <p className="whitespace-pre-wrap">
                                      {message.content}
                                    </p>
                                  )}
                                  {message.is_edited && (
                                    <span className="ms-1 text-[10px] opacity-60">
                                      (معدّلة)
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {group.messages.some(
                        (m) => !m.is_deleted && (m.reactions?.length ?? 0) > 0
                      ) && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {group.messages.map(
                            (message) =>
                              !message.is_deleted &&
                              (message.reactions?.length ?? 0) > 0 && (
                                <MessageReactions
                                  key={`reactions-${message.id}`}
                                  messageId={message.id}
                                  currentUserId={userId}
                                  reactions={message.reactions}
                                  variant="display"
                                />
                              )
                          )}
                        </div>
                      )}

                      {group.messages.some(
                        (m) => !m.is_deleted && m.attachments?.length > 0
                      ) &&
                        group.messages.map(
                          (message) =>
                            !message.is_deleted &&
                            message.attachments?.length > 0 && (
                              <div key={`att-${message.id}`} className="w-full pt-0.5">
                                <MessageAttachments
                                  currentUserId={userId}
                                  uploadedBy={message.sender_id}
                                  attachments={message.attachments}
                                />
                              </div>
                            )
                        )}

                      <div
                        className={cn(
                          "flex items-center gap-1 px-0.5 tabular-nums",
                          "text-[10px] text-muted-foreground/75",
                          group.isOwn ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <span>
                          {formatMessageTimestamp(
                            new Date(lastMessage.created_at)
                          )}
                        </span>
                        {group.isOwn && readByOthers && (
                          <span className="inline-flex text-primary/80">
                            <CheckCheck className="h-3 w-3" aria-label="مقروءة" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {typingUsers.length > 0 && (
            <div className="flex w-full justify-start animate-in fade-in duration-200">
              <div className="flex max-w-[min(100%,26rem)] items-end gap-2">
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-background">
                  <AvatarFallback className="bg-muted text-[11px] font-semibold text-muted-foreground">
                    {(typingUsers[0].user_name || "ز")[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-[1.125rem] rounded-bs-sm border border-border/60 bg-background px-3.5 py-2.5 shadow-sm">
                  <ThinkingIndicator />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-px shrink-0" />
        </div>
      </div>

      {editingMessage && (
        <MessageEditDialog
          message={editingMessage}
          open={!!editingMessage}
          onOpenChange={(open) => !open && setEditingMessage(null)}
          onSuccess={() => setEditingMessage(null)}
        />
      )}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteMessageId(null);
          if (!isDeleting) setDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الرسالة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف هذه الرسالة؟ لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMessageConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "جارٍ الحذف..." : "حذف"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
