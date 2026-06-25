"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
import { format } from "date-fns";
import {
  Archive,
  Download,
  FileIcon,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Trash2,
  Video,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { NameWithRole } from "@/components/shared/name-with-role";
import { GuestWhatsAppActions } from "@/components/shared/guest-whatsapp-actions";
import type { ConversationWithParticipants } from "@/hooks/useRealtimeConversations";
import type { Message, MessageAttachment } from "@/types/realtime";
import { cn } from "@/lib/utils";

type MediaTab = "media" | "files" | "links";

const MEDIA_TAB_LABELS: Record<MediaTab, string> = {
  media: "وسائط",
  files: "ملفات",
  links: "روابط",
};

interface ConversationDetailsPanelProps {
  conversation: ConversationWithParticipants;
  participant: ConversationWithParticipants["participants"][number] | null;
  userId: string;
  isUserOnline: (id: string) => boolean;
  isGuestOnline: (conversationId: string) => boolean;
  onClose: () => void;
  onArchive?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  managing?: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function groupByMonth<T extends { message: Message }>(items: T[]) {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const key = format(new Date(item.message.created_at), "MMMM yyyy");
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}

function EmptyMediaState({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-8 text-center">
      <Icon className="mb-2 h-4 w-4 text-muted-foreground/70" />
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
  );
}

export function ConversationDetailsPanel({
  conversation,
  participant,
  userId,
  isUserOnline,
  isGuestOnline,
  onClose,
  onArchive,
  onDelete,
  managing = false,
}: ConversationDetailsPanelProps) {
  const [mediaTab, setMediaTab] = useState<MediaTab>("media");
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isGuest = conversation.source === "guest_widget";
  const isArchived = conversation.guest_status === "closed";
  const isGroup =
    conversation.type === "group" || (conversation.participants?.length || 0) > 2;

  const fetchConversationMessages = useCallback(async () => {
    setLoadingMedia(true);
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversation.id}/messages`,
        { cache: "no-store" }
      );
      if (response.ok) {
        const payload = (await response.json()) as { messages: Message[] };
        setConversationMessages(payload.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages for details:", error);
    } finally {
      setLoadingMedia(false);
    }
  }, [conversation.id]);

  useEffect(() => {
    void fetchConversationMessages();
    setMediaTab("media");
  }, [fetchConversationMessages, conversation.id]);

  const { mediaItems, fileItems, linkItems } = useMemo(() => {
    const allAttachments: { attachment: MessageAttachment; message: Message }[] =
      [];

    for (const msg of conversationMessages) {
      if (msg.is_deleted) continue;
      for (const att of msg.attachments) {
        allAttachments.push({ attachment: att, message: msg });
      }
    }

    allAttachments.sort(
      (a, b) =>
        new Date(b.attachment.created_at).getTime() -
        new Date(a.attachment.created_at).getTime()
    );

    const media = allAttachments.filter(
      (item) =>
        item.attachment.file_type === "image" ||
        item.attachment.file_type === "video"
    );

    const files = allAttachments.filter(
      (item) =>
        item.attachment.file_type !== "image" &&
        item.attachment.file_type !== "video"
    );

    const links: { url: string; message: Message }[] = [];
    const urlRegex = /https?:\/\/[^\s]+/g;
    for (const msg of conversationMessages) {
      if (msg.is_deleted || !msg.content) continue;
      const matches = msg.content.match(urlRegex);
      if (matches) {
        for (const url of matches) {
          links.push({ url, message: msg });
        }
      }
    }

    return { mediaItems: media, fileItems: files, linkItems: links };
  }, [conversationMessages]);

  const displayName =
    participant?.user_name ||
    conversation.guest_name ||
    (isGuest ? "زائر" : "مستخدم");

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
        <h3 className="text-sm font-semibold">تفاصيل المحادثة</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={onClose}
          aria-label="إغلاق التفاصيل"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-border/60 px-4 py-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              {participant?.user_image && (
                <AvatarImage src={participant.user_image} alt={displayName} />
              )}
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {displayName[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-0.5">
              <NameWithRole
                name={displayName}
                role={participant?.user_role}
                className="text-sm font-semibold"
                badgeClassName="h-4 px-1.5 text-[10px]"
              />
              {isGuest ? (
                <p
                  className={cn(
                    "text-xs",
                    isArchived
                      ? "text-muted-foreground"
                      : isGuestOnline(conversation.id)
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                  )}
                >
                  {isArchived
                    ? "محادثة مؤرشفة"
                    : conversation.guest_status === "unclaimed"
                      ? "بانتظار الاستلام"
                      : isGuestOnline(conversation.id)
                        ? "متصل الآن"
                        : "غير متصل"}
                </p>
              ) : participant ? (
                <p
                  className={cn(
                    "text-xs",
                    isUserOnline(participant.user_id)
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {isUserOnline(participant.user_id)
                    ? "متصل الآن"
                    : "غير متصل"}
                </p>
              ) : null}
              {isGuest && conversation.guest_email && (
                <p className="truncate text-xs text-muted-foreground">
                  {conversation.guest_email}
                </p>
              )}
            </div>
          </div>

          {isGuest && conversation.guest_phone && (
            <GuestWhatsAppActions
              phone={conversation.guest_phone}
              guestName={displayName}
              className="mt-3"
            />
          )}

          {isGuest && !isArchived && (onArchive || onDelete) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {onArchive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={managing}
                  onClick={() => setConfirmArchive(true)}
                >
                  <Archive className="me-1.5 h-3.5 w-3.5" />
                  أرشفة
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                  disabled={managing}
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="me-1.5 h-3.5 w-3.5" />
                  حذف
                </Button>
              )}
            </div>
          )}

          {isGuest && isArchived && onDelete && (
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs text-destructive hover:text-destructive"
                disabled={managing}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="me-1.5 h-3.5 w-3.5" />
                حذف نهائي
              </Button>
            </div>
          )}
        </section>

        {isGroup && (
          <section className="border-b border-border/60 px-4 py-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              المشاركون ({conversation.participants.length})
            </p>
            <div className="space-y-2">
              {conversation.participants.map((p) => (
                <div key={p.user_id} className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    {p.user_image && (
                      <AvatarImage src={p.user_image} alt={p.user_name || ""} />
                    )}
                    <AvatarFallback className="text-[10px]">
                      {p.user_name?.[0]?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs">
                    {p.user_id === userId ? "أنت" : p.user_name || "مستخدم"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="px-3 py-3">
          <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            المرفقات
          </p>
          <div className="mb-2 flex gap-1 rounded-lg bg-muted/40 p-0.5">
            {(["media", "files", "links"] as MediaTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setMediaTab(tab)}
                className={cn(
                  "flex-1 rounded-md py-1.5 text-[11px] font-medium transition-colors",
                  mediaTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {MEDIA_TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          {loadingMedia ? (
            <div className="grid grid-cols-3 gap-1 p-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square animate-pulse rounded-md bg-muted"
                />
              ))}
            </div>
          ) : mediaTab === "media" ? (
            mediaItems.length === 0 ? (
              <EmptyMediaState icon={ImageIcon} text="لا توجد وسائط" />
            ) : (
              <div className="space-y-3">
                {Object.entries(groupByMonth(mediaItems)).map(([month, items]) => (
                  <div key={month}>
                    <p className="mb-1.5 px-1 text-[10px] font-medium text-muted-foreground">
                      {month}
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {items.map(({ attachment }) => (
                        <a
                          key={attachment.id}
                          href={attachment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square overflow-hidden rounded-md bg-muted"
                        >
                          {attachment.file_type === "image" ? (
                            <img
                              src={attachment.file_url}
                              alt={attachment.file_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Video className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : mediaTab === "files" ? (
            fileItems.length === 0 ? (
              <EmptyMediaState icon={FileIcon} text="لا توجد ملفات" />
            ) : (
              <div className="space-y-1">
                {fileItems.map(({ attachment }) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/60"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                      {attachment.file_type === "pdf" ? (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <FileIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {attachment.file_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                    <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </a>
                ))}
              </div>
            )
          ) : linkItems.length === 0 ? (
            <EmptyMediaState icon={LinkIcon} text="لا توجد روابط" />
          ) : (
            <div className="space-y-1">
              {linkItems.map(({ url, message }, idx) => (
                <a
                  key={`${message.id}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg px-2 py-1.5 hover:bg-muted/60"
                >
                  <p className="truncate text-xs text-primary">{url}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(new Date(message.created_at), "d MMM yyyy")}
                  </p>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>أرشفة محادثة الزائر؟</AlertDialogTitle>
            <AlertDialogDescription>
              ستُنقل المحادثة إلى المؤرشف ولن تظهر في صندوق الوارد. يمكنك
              مراجعتها لاحقاً من تبويب المؤرشف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={managing}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={managing}
              onClick={(e) => {
                e.preventDefault();
                void onArchive?.().finally(() => setConfirmArchive(false));
              }}
            >
              أرشفة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف محادثة الزائر؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف المحادثة وكل رسائلها نهائياً. لا يمكن التراجع عن هذا
              الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={managing}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              disabled={managing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void onDelete?.().finally(() => setConfirmDelete(false));
              }}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}
