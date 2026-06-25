"use client";

import ReactMarkdown from "react-markdown";
import { Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveWidgetTheme } from "@/lib/ai/widget-theme";
import { formatWidgetTime } from "@/components/ai-chat/widget-primitives";
import type { ChatMessage } from "./use-chat-session";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  primaryColor?: string;
  accentColor?: string;
  onFeedback?: (message: ChatMessage, feedback: "up" | "down") => void;
}

export function ChatMessageBubble({
  message,
  primaryColor,
  accentColor,
  onFeedback,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";
  const theme = resolveWidgetTheme(primaryColor, accentColor);
  const timeLabel = formatWidgetTime(message.createdAt);

  if (isSystem) {
    return (
      <div className="widget-message-in flex justify-center px-1 py-1.5">
        <p className="max-w-[94%] rounded-full border border-border/35 bg-muted/40 px-3.5 py-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "widget-message-in group/msg flex items-end gap-2.5 px-1",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <div
          className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-[0_2px_8px_rgba(15,23,42,0.12)] ring-2 ring-background"
          style={{ background: theme.headerGradient }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[84%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-[18px] px-3.5 py-2.5 text-[13px] leading-[1.55] break-words shadow-[0_1px_3px_rgba(15,23,42,0.05)]",
            isUser
              ? "rounded-ee-[6px] text-white"
              : "rounded-es-[6px] border border-border/40 bg-background text-foreground"
          )}
          style={isUser ? { backgroundColor: theme.primary } : undefined}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div
              className={cn(
                "space-y-2 [&_p]:m-0",
                "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:ps-4",
                "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:ps-4",
                "[&_li]:my-0.5 [&_strong]:font-semibold",
                "[&_code]:rounded-md [&_code]:bg-muted/80 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em]"
              )}
            >
              <ReactMarkdown
                components={{
                  a: (props) => (
                    <a
                      href={props.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline underline-offset-2 break-words"
                      style={{ color: theme.primary }}
                    >
                      {props.children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-2 flex flex-col gap-1 border-t border-border/35 pt-2">
              <span className="text-[10px] font-medium text-muted-foreground/75">
                المصادر
              </span>
              {message.sources.map((s, i) => (
                <a
                  key={`${s.url}-${i}`}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[11px] underline decoration-dotted underline-offset-2 transition-colors hover:decoration-solid"
                  style={{ color: theme.primary }}
                  title={s.url}
                >
                  {s.title}
                </a>
              ))}
            </div>
          )}

          {!isUser && message.logId && onFeedback && (
            <div className="mt-2 flex items-center gap-1 border-t border-border/35 pt-2">
              {(["up", "down"] as const).map((value) => {
                const active = message.feedback === value;
                const Icon = value === "up" ? ThumbsUp : ThumbsDown;
                return (
                  <button
                    key={value}
                    type="button"
                    title={
                      value === "up" ? "الإجابة مفيدة" : "الإجابة غير مفيدة"
                    }
                    aria-label={
                      value === "up" ? "الإجابة مفيدة" : "الإجابة غير مفيدة"
                    }
                    onClick={() => onFeedback(message, value)}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-200",
                      active
                        ? "border-transparent text-white shadow-sm"
                        : "border-border/45 text-muted-foreground hover:bg-muted/50"
                    )}
                    style={
                      active ? { backgroundColor: theme.primary } : undefined
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {timeLabel ? (
          <span className="px-1 text-[10px] tabular-nums text-muted-foreground/55 opacity-0 transition-opacity duration-200 group-hover/msg:opacity-100">
            {timeLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}
