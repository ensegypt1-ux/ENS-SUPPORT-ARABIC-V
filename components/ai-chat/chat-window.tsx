"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Headset, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveWidgetTheme } from "@/lib/ai/widget-theme";
import type { AIChatbotPublicConfig } from "@/types";
import { useChatSession, type ChatMessage } from "./use-chat-session";
import { ChatMessageBubble } from "./chat-message";
import { GuestTicketForm } from "./guest-ticket-form";
import { StableGuestLiveChatPanel } from "./stable-guest-live-chat-panel";
import {
  SupportOnlineProvider,
  useSupportOnline,
} from "./support-online-context";
import { useGuestLiveChat } from "./use-guest-live-chat";
import { WidgetWelcomeActions } from "./widget-welcome";
import {
  WidgetComposer,
  WidgetFooter,
  WidgetHeader,
  WidgetInlineNotice,
  WidgetScrollArea,
  WidgetShell,
  WidgetTypingIndicator,
} from "./widget-primitives";

const COMPOSER_TEXTAREA_MIN_HEIGHT = 26;
const COMPOSER_TEXTAREA_MAX_HEIGHT = 112;

interface ChatWindowProps {
  config: AIChatbotPublicConfig;
  onClose: () => void;
  embedded?: boolean;
  sizeMode?: "fixed" | "configured";
  appOrigin?: string;
  storageNamespace?: string;
  siteKey?: string;
  host?: string;
}

function ChatHeaderSubtitle({
  isLiveChat,
  isConnected,
}: {
  isLiveChat: boolean;
  isConnected: boolean;
}) {
  const supportOnline = useSupportOnline();

  if (isLiveChat) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isConnected
              ? "bg-emerald-400 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
              : "bg-amber-300 animate-pulse"
          )}
        />
        {isConnected ? "متصل بفريق الدعم" : "جاري الاتصال…"}
      </span>
    );
  }

  if (supportOnline === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          supportOnline ? "bg-emerald-400" : "bg-white/45"
        )}
      />
      {supportOnline
        ? "الدعم المباشر — متاح الآن"
        : "الدعم المباشر — غير متصل حاليًا"}
    </span>
  );
}

function LiveChatHandoffBanner({
  hasLiveChatSession,
  pendingLiveChat,
  showTicketForm,
  hydrated,
  lastUserMessage,
  onHandoff,
}: {
  hasLiveChatSession: boolean;
  pendingLiveChat: boolean;
  showTicketForm: boolean;
  hydrated: boolean;
  lastUserMessage: string;
  onHandoff: (options: { lastMessage?: string }) => void;
}) {
  const supportOnline = useSupportOnline();
  if (
    !supportOnline ||
    hasLiveChatSession ||
    pendingLiveChat ||
    showTicketForm ||
    !hydrated
  ) {
    return null;
  }

  return (
    <div className="widget-panel-in px-3 pb-1 pt-2">
      <button
        type="button"
        onClick={() => onHandoff({ lastMessage: lastUserMessage })}
        className="group flex w-full items-center justify-center gap-2 rounded-[16px] border border-primary/15 bg-primary/[0.06] px-3 py-2.5 text-[12px] font-semibold text-primary transition-all duration-200 hover:border-primary/25 hover:bg-primary/10 active:scale-[0.985]"
      >
        <Headset className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
        التحدث مع موظف الدعم الآن
      </button>
    </div>
  );
}

function ChatWindowBody({
  config,
  onClose,
  embedded,
  sizeMode,
  siteKey,
  host,
  storageNamespace,
  configuredSizeStyle,
}: {
  config: AIChatbotPublicConfig;
  onClose: () => void;
  embedded?: boolean;
  sizeMode?: "fixed" | "configured";
  siteKey?: string;
  host?: string;
  storageNamespace?: string;
  configuredSizeStyle?: CSSProperties;
}) {
  const supportOnline = useSupportOnline();
  const session = useChatSession(storageNamespace);
  const {
    hydrated,
    visitorId,
    sessionId,
    messages,
    addMessage,
    updateMessage,
    getRecentHistory,
  } = session;

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [lastLogId, setLastLogId] = useState<string | undefined>();
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [handoffDepartment, setHandoffDepartment] = useState<
    string | undefined
  >();

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const guestLiveChat = useGuestLiveChat({
    guestSessionId: visitorId,
    storageNamespace,
    guestLiveChatEnabled: config.guestLiveChatEnabled,
  });

  const hasLiveChatSession = Boolean(guestLiveChat.session?.guestPhone?.trim());
  const showLiveChatPanel =
    hasLiveChatSession || Boolean(guestLiveChat.pendingLiveChat);

  const headerTitle =
    config.headerTitle?.trim() ||
    config.businessName?.trim() ||
    "المحادثة المباشرة";

  const theme = resolveWidgetTheme(config.primaryColor, config.accentColor);

  const showWelcomeActions =
    hydrated &&
    !hasLiveChatSession &&
    !showTicketForm &&
    !showLiveChatPanel &&
    !isLoading &&
    messages.length <= 1 &&
    messages.every((m) => m.role === "assistant" || m.role === "system");

  const resizeComposer = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${
      input.trim()
        ? Math.min(textarea.scrollHeight, COMPOSER_TEXTAREA_MAX_HEIGHT)
        : COMPOSER_TEXTAREA_MIN_HEIGHT
    }px`;
  }, [input]);

  useEffect(() => {
    if (hydrated && messages.length === 0) {
      addMessage({
        role: "assistant",
        content: config.welcomeMessage,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, showTicketForm, showLiveChatPanel, guestLiveChat.messages]);

  useEffect(() => {
    resizeComposer();
  }, [resizeComposer, input]);

  const handleHumanHandoff = async (options: {
    chatLogId?: string;
    departmentSlug?: string;
    lastMessage?: string;
  }) => {
    setHandoffDepartment(options.departmentSlug);
    setLastUserMessage(options.lastMessage || lastUserMessage);

    if (hasLiveChatSession || guestLiveChat.pendingLiveChat) {
      return;
    }

    if (config.guestLiveChatEnabled) {
      const result = await guestLiveChat.requestLiveChat({
        chatLogId: options.chatLogId,
        departmentSlug: options.departmentSlug,
      });

      if (result.success) {
        setShowTicketForm(false);
        addMessage({
          role: "system",
          content: "تم فتح محادثة مباشرة مع فريق الدعم. اكتب رسالتك أدناه.",
        });
        return;
      }

      if (result.offline) {
        setShowTicketForm(true);
        addMessage({
          role: "system",
          content:
            "فريق الدعم غير متاح حاليًا. يمكنك إرسال طلب وسنتواصل معك عبر WhatsApp.",
        });
        return;
      }
    }

    setShowTicketForm(true);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || isLoading || !hydrated) return;

    setInput("");
    setError(null);
    setShowTicketForm(false);
    setLastUserMessage(question);

    const history = getRecentHistory(6);

    addMessage({ role: "user", content: question });
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          visitorId,
          sessionId,
          history,
          siteKey: siteKey || undefined,
          host: host || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "حدث خطأ ما");
        addMessage({
          role: "system",
          content: data.error ?? "حدث خطأ ما",
        });
        return;
      }

      const payload = data.data as {
        matched: boolean;
        answer: string;
        outcome: string;
        escalated: boolean;
        suggestedDepartmentSlug?: string;
        sources?: { title: string; url: string }[];
        logId: string;
      };
      setLastLogId(payload.logId);

      addMessage({
        role: "assistant",
        content: payload.answer,
        matched: payload.matched,
        isFallback: payload.escalated,
        logId: payload.logId,
        sources: payload.sources,
      });

      if (payload.escalated) {
        await handleHumanHandoff({
          chatLogId: payload.logId,
          departmentSlug: payload.suggestedDepartmentSlug,
          lastMessage: question,
        });
      }
    } catch {
      setError("خطأ في الشبكة");
      addMessage({
        role: "system",
        content: "خطأ في الشبكة — حاول مرة أخرى.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTicketSubmitted = (ticketNumber: string) => {
    setShowTicketForm(false);
    addMessage({
      role: "system",
      content: `شكرًا! تم إنشاء التذكرة ${ticketNumber} — سنرد عليك قريبًا.`,
    });
  };

  const handleFeedback = async (
    message: ChatMessage,
    feedback: "up" | "down"
  ) => {
    if (!message.logId || !hydrated) return;
    updateMessage(message.id, { feedback });
    try {
      const res = await fetch("/api/ai/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: message.logId,
          visitorId,
          sessionId,
          feedback,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        updateMessage(message.id, { feedback: message.feedback });
      }
    } catch {
      updateMessage(message.id, { feedback: message.feedback });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const headerStatusDot = hasLiveChatSession
    ? guestLiveChat.isConnected
      ? ("online" as const)
      : ("connecting" as const)
    : undefined;

  return (
    <WidgetShell embedded={embedded} sizeMode={sizeMode} style={configuredSizeStyle}>
        <WidgetHeader
          theme={theme}
          title={hasLiveChatSession ? "محادثة مباشرة" : headerTitle}
          subtitle={
            config.guestLiveChatEnabled || hasLiveChatSession ? (
              <ChatHeaderSubtitle
                isLiveChat={hasLiveChatSession}
                isConnected={guestLiveChat.isConnected}
              />
            ) : undefined
          }
          avatarUrl={config.headerAvatarUrl}
          avatarFallback={<Sparkles className="h-4 w-4" />}
          onClose={onClose}
          statusDot={headerStatusDot}
        />

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-hidden",
            !hasLiveChatSession && "bg-[linear-gradient(180deg,hsl(var(--muted)/0.35),transparent_120px)]"
          )}
        >
          <WidgetScrollArea
            scrollRef={scrollRef}
            className={cn(
              hasLiveChatSession
                ? "flex flex-col"
                : "space-y-1 px-3 py-3"
            )}
          >
            {!hasLiveChatSession &&
              messages.map((m: ChatMessage) => (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  primaryColor={config.primaryColor}
                  accentColor={config.accentColor}
                  onFeedback={handleFeedback}
                />
              ))}

            {showWelcomeActions && (
              <WidgetWelcomeActions
                primaryColor={theme.primary}
                accentColor={theme.accent}
                liveChatEnabled={config.guestLiveChatEnabled}
                supportOnline={supportOnline}
                onFocusAi={() => inputRef.current?.focus()}
                onLiveChat={() =>
                  void handleHumanHandoff({ lastMessage: lastUserMessage })
                }
                onTicket={() => setShowTicketForm(true)}
              />
            )}

            {!hasLiveChatSession && isLoading && (
              <WidgetTypingIndicator theme={theme} />
            )}

            {showLiveChatPanel && (
              <StableGuestLiveChatPanel
                session={guestLiveChat.session}
                messages={guestLiveChat.messages}
                bootstrapping={guestLiveChat.bootstrapping}
                error={guestLiveChat.error}
                primaryColor={theme.primary}
                headerGradient={theme.headerGradient}
                onSend={guestLiveChat.sendMessage}
                onUpdateProfile={guestLiveChat.updateProfile}
                onStartLiveChat={async (fields) => {
                  const result = await guestLiveChat.startLiveChat(fields);
                  if (!result.success) {
                    throw new Error(
                      guestLiveChat.error || "تعذّر بدء المحادثة"
                    );
                  }
                }}
                onTyping={guestLiveChat.setTyping}
              />
            )}

            {!hasLiveChatSession && showTicketForm && hydrated && (
              <div className="px-1 pt-2">
                <GuestTicketForm
                  visitorId={visitorId}
                  chatLogId={lastLogId}
                  defaultMessage={lastUserMessage}
                  departmentSlug={handoffDepartment}
                  onSubmitted={handleTicketSubmitted}
                  onCancel={() => setShowTicketForm(false)}
                  primaryColor={theme.primary}
                />
              </div>
            )}

            <LiveChatHandoffBanner
              hasLiveChatSession={hasLiveChatSession}
              pendingLiveChat={Boolean(guestLiveChat.pendingLiveChat)}
              showTicketForm={showTicketForm}
              hydrated={hydrated}
              lastUserMessage={lastUserMessage}
              onHandoff={handleHumanHandoff}
            />
          </WidgetScrollArea>

          {error && (
            <div className="shrink-0 border-t border-destructive/15 px-3 py-2">
              <WidgetInlineNotice tone="error">{error}</WidgetInlineNotice>
            </div>
          )}

          {!hasLiveChatSession && (
            <div
              className={cn(
                "shrink-0 border-t border-border/35 bg-background/95 px-3 pt-2.5 backdrop-blur-sm",
                embedded ? "pb-10" : "pb-3"
              )}
            >
              <WidgetComposer
                inputRef={inputRef}
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                onKeyDown={handleInputKeyDown}
                placeholder={config.placeholder}
                disabled={!hydrated}
                loading={isLoading}
                theme={theme}
              />

              {config.showPoweredBy && config.footerText?.trim() && (
                <WidgetFooter text={config.footerText} />
              )}
            </div>
          )}
        </div>
      </WidgetShell>
  );
}

export function ChatWindow({
  config,
  onClose,
  embedded,
  sizeMode = "fixed",
  storageNamespace,
  siteKey,
  host,
}: ChatWindowProps) {
  const configuredSizeStyle: CSSProperties | undefined =
    !embedded && sizeMode === "configured"
      ? {
          width: config.widgetWidth,
          height: config.widgetHeight,
        }
      : undefined;

  return (
    <SupportOnlineProvider enabled={config.guestLiveChatEnabled}>
      <ChatWindowBody
        config={config}
        onClose={onClose}
        embedded={embedded}
        sizeMode={sizeMode}
        siteKey={siteKey}
        host={host}
        storageNamespace={storageNamespace}
        configuredSizeStyle={configuredSizeStyle}
      />
    </SupportOnlineProvider>
  );
}
