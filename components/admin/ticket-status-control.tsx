"use client";

import { useState } from "react";
import { updateTicketStatus } from "@/actions/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TicketStatusControlProps {
  ticketId: string;
  currentStatus: string;
}

export function TicketStatusControl({
  ticketId,
  currentStatus,
}: TicketStatusControlProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<
    | "open"
    | "scheduled_meeting"
    | "in_progress"
    | "waiting_on_customer"
    | "resolved"
    | "closed"
    | null
  >(null);
  const [message, setMessage] = useState("");

  const handleStatusChange = async (
    value:
      | "open"
      | "scheduled_meeting"
      | "in_progress"
      | "waiting_on_customer"
      | "resolved"
      | "closed"
  ) => {
    // Open dialog to optionally add a message
    setPendingStatus(value);
    setMessage("");
    setShowMessageDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    setIsUpdating(true);
    setShowMessageDialog(false);

    try {
      const result = await updateTicketStatus(
        ticketId,
        pendingStatus,
        message.trim() || undefined
      );

      if (result.success) {
        toast.success("تم التحديث حالة التذكرة");
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر التحديث حالة التذكرة");
      }
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("تعذّر التحديث حالة التذكرة");
    } finally {
      setIsUpdating(false);
      setPendingStatus(null);
      setMessage("");
    }
  };

  const cancelStatusChange = () => {
    setShowMessageDialog(false);
    setPendingStatus(null);
    setMessage("");
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "open":
        return "مفتوحة";
      case "scheduled_meeting":
        return "اجتماع مجدول";
      case "in_progress":
        return "قيد المعالجة";
      case "waiting_on_customer":
        return "بانتظار العميل";
      case "resolved":
        return "محلولة";
      case "closed":
        return "مغلقة";
      default:
        return status;
    }
  };

  return (
    <>
      <Select
        value={currentStatus}
        onValueChange={handleStatusChange}
        disabled={isUpdating}
      >
        <SelectTrigger>
          <SelectValue placeholder="اختر الحالة" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">مفتوحة</SelectItem>
          <SelectItem value="scheduled_meeting">اجتماع مجدول</SelectItem>
          <SelectItem value="in_progress">قيد المعالجة</SelectItem>
          <SelectItem value="waiting_on_customer">
            بانتظار العميل
          </SelectItem>
          <SelectItem value="resolved">محلولة</SelectItem>
          <SelectItem value="closed">مغلقة</SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحديث حالة التذكرة</DialogTitle>
            <DialogDescription>
              أنت على وشك تغيير الحالة إلى{" "}
              <strong>{pendingStatus && getStatusLabel(pendingStatus)}</strong>.
              يمكنك إضافة رسالة اختيارية لإبلاغ العميل.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="status-message">
              رسالة للعميل (اختياري)
            </Label>
            <Textarea
              id="status-message"
              placeholder="أضف رسالة لتضمينها في إشعار البريد الإلكتروني..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              ستُضمَّن هذه الرسالة في إشعار البريد الإلكتروني المرسل للعميل.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelStatusChange}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button onClick={confirmStatusChange} disabled={isUpdating}>
              {isUpdating ? "جاري التحديث..." : "تحديث الحالة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
