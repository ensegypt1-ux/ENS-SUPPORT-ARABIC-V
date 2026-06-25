/**
 * Message Input — polished RTL composer for the support inbox.
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, X } from "lucide-react";
import { sendMessage } from "@/actions/messages";
import { uploadMessageAttachment } from "@/actions/message-attachments";
import { toast } from "sonner";
import { useSocketConnection } from "@/hooks/useSocketConnection";
import { Spinner } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/realtime";

interface MessageInputProps {
  conversationId: string;
  userId: string;
  onMessageSent?: () => void;
  replyToMessage?: Message | null;
  onCancelReply?: () => void;
}

export function MessageInput({
  conversationId,
  userId,
  onMessageSent,
  replyToMessage,
  onCancelReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { socket } = useSocketConnection(userId);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket) return;
      socket.emit("chat:typing:set", { conversationId, isTyping });
    },
    [conversationId, socket]
  );

  const handleTyping = () => {
    setTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTyping(false);
    };
  }, [setTyping]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxSize = 20 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        toast.error(`${file.name} كبير جداً. الحد الأقصى للحجم 20 ميجابايت.`);
        return false;
      }
      return true;
    });
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!content.trim() && selectedFiles.length === 0) || sending) return;

    setSending(true);
    setTyping(false);

    try {
      const result = await sendMessage({
        conversationId,
        content: content.trim() || "",
        replyToId: replyToMessage?.id ?? null,
      });

      if (result.success && result.data) {
        if (selectedFiles.length > 0) {
          setUploading(true);
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append("file", file);
            const uploadResult = await uploadMessageAttachment(
              result.data.id,
              formData
            );
            if (!uploadResult.success) {
              toast.error(`تعذّر رفع ${file.name}: ${uploadResult.error}`);
            }
          }
          setUploading(false);
        }

        setContent("");
        setSelectedFiles([]);
        onMessageSent?.();
        onCancelReply?.();
        textareaRef.current?.focus();
      } else {
        toast.error(result.error || "تعذّر إرسال الرسالة");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const busy = sending || uploading;
  const canSend =
    (content.trim().length > 0 || selectedFiles.length > 0) && !busy;

  return (
    <form onSubmit={handleSubmit} className="space-y-2" dir="rtl">
      {replyToMessage && (
        <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
          <div className="min-w-0 flex-1 border-s-2 border-primary/60 ps-2.5">
            <p className="text-[11px] font-semibold text-primary">
              الرد على {replyToMessage.sender_name || "مستخدم"}
            </p>
            {replyToMessage.content && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {replyToMessage.content}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            aria-label="إلغاء الرد"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-border/50 bg-muted/30 p-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-2 py-1 text-xs shadow-sm"
            >
              <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="max-w-[160px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-border/60 bg-background p-1.5 shadow-sm transition-shadow focus-within:border-primary/30 focus-within:shadow-md focus-within:shadow-primary/5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          title="إرفاق ملف"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,text/*,.zip,.doc,.docx"
        />

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder="اكتب رسالة…"
          rows={1}
          className={cn(
            "min-h-[36px] max-h-[140px] flex-1 resize-none border-0 bg-transparent px-0 py-2 text-sm shadow-none",
            "focus-visible:ring-0 focus-visible:ring-offset-0"
          )}
          disabled={busy}
        />

        <Button
          type="submit"
          size="icon"
          disabled={!canSend}
          className={cn(
            "h-9 w-9 shrink-0 rounded-xl transition-all duration-150",
            canSend
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              : "bg-muted text-muted-foreground"
          )}
          title="إرسال"
        >
          {busy ? (
            <Spinner size="xs" className="text-current" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="hidden text-center text-[10px] text-muted-foreground/70 sm:block">
        Enter للإرسال · Shift+Enter سطر جديد
      </p>
    </form>
  );
}
