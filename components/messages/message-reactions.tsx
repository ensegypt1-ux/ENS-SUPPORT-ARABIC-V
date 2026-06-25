"use client";

/**
 * Message Reactions Component
 * 
 * Displays emoji reactions on messages
 */

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toggleMessageReaction } from "@/actions/message-reactions";
import { Smile } from "lucide-react";
import { toast } from "sonner";
import type { MessageReaction } from "@/types/realtime";

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
  reactions: MessageReaction[];
  /** picker: add-reaction control only; display: existing chips only */
  variant?: "full" | "picker" | "display";
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥", "👏"];

export function MessageReactions({
  messageId,
  currentUserId,
  reactions,
  variant = "full",
}: MessageReactionsProps) {
  const handleReaction = async (emoji: string) => {
    const result = await toggleMessageReaction(messageId, emoji);
    if (!result.success) {
      toast.error(result.error || "تعذّر الإضافة التفاعل");
    }
  };

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const hasReactions = Object.keys(groupedReactions).length > 0;
  const showDisplay = variant === "full" || variant === "display";
  const showPicker = variant === "full" || variant === "picker";

  if (!showDisplay && !showPicker) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {showDisplay && hasReactions && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(groupedReactions).map(([emoji, reactions]) => {
            const userReacted = reactions.some((r) => r.user_id === currentUserId);
            const count = reactions.length;

            return (
              <Button
                key={emoji}
                variant={userReacted ? "default" : "outline"}
                size="sm"
                className="h-6 px-1.5 text-xs"
                onClick={() => handleReaction(emoji)}
                title={reactions.map((r) => r.user_name).join(", ")}
              >
                <span className="me-0.5">{emoji}</span>
                <span className="text-[10px]">{count}</span>
              </Button>
            );
          })}
        </div>
      )}

      {showPicker && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
              title="إضافة تفاعل"
            >
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-xl hover:bg-accent"
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
