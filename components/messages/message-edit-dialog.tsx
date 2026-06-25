"use client";

/**
 * Message Edit Dialog Component
 * 
 * Allows users to edit their messages
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { editMessage } from "@/actions/message-editing";
import { toast } from "sonner";
import type { Message } from "@/types/realtime";

interface MessageEditDialogProps {
  message: Message;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MessageEditDialog({
  message,
  open,
  onOpenChange,
  onSuccess,
}: MessageEditDialogProps) {
  const [content, setContent] = useState(message.content);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error("اكتب رسالة");
      return;
    }

    if (content === message.content) {
      toast.info("لا يوجد تغييرات");
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const result = await editMessage(message.id, content);
      
      if (result.success) {
        toast.success("تم التحديث الرسالة");
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.error || "تعذّر التحديث الرسالة");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تعديل الرسالة</DialogTitle>
          <DialogDescription>
            عدّل رسالتك. سيرى الآخرون أنها عُدّلت.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="اكتب رسالتك..."
              className="min-h-[100px]"
              disabled={loading}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
