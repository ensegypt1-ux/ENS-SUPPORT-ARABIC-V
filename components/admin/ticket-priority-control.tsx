"use client";

import { useState } from "react";
import { updateTicketPriority } from "@/actions/admin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TicketPriorityControlProps {
  ticketId: string;
  currentPriority: string;
}

export function TicketPriorityControl({
  ticketId,
  currentPriority,
}: TicketPriorityControlProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePriorityChange = async (
    value: "low" | "medium" | "high" | "urgent"
  ) => {
    setIsUpdating(true);

    try {
      const result = await updateTicketPriority(ticketId, value);

      if (result.success) {
        toast.success("اتحدّث أولوية التذكرة");
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر التحديث أولوية التذكرة");
      }
    } catch (error) {
      console.error("Priority update error:", error);
      toast.error("تعذّر التحديث أولوية التذكرة");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={currentPriority}
      onValueChange={handlePriorityChange}
      disabled={isUpdating}
    >
      <SelectTrigger>
        <SelectValue placeholder="اختر الأولوية" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">منخفضة</SelectItem>
        <SelectItem value="medium">متوسطة</SelectItem>
        <SelectItem value="high">عالية</SelectItem>
        <SelectItem value="urgent">عاجلة</SelectItem>
      </SelectContent>
    </Select>
  );
}
