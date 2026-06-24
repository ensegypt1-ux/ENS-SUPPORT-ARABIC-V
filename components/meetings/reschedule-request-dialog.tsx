"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { requestMeetingReschedule } from "@/actions/meetings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const rescheduleRequestSchema = z.object({
  preferredDate: z.string().min(1, "التاريخ المفضل مطلوب"),
  preferredTime: z.string().min(1, "الوقت المفضل مطلوب"),
  reason: z.string().optional(),
});

type RescheduleRequestFormData = z.infer<typeof rescheduleRequestSchema>;

interface RescheduleRequestDialogProps {
  meetingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleRequestDialog({
  meetingId,
  open,
  onOpenChange,
}: RescheduleRequestDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RescheduleRequestFormData>({
    resolver: zodResolver(rescheduleRequestSchema),
    defaultValues: {
      preferredDate: "",
      preferredTime: "",
      reason: "",
    },
  });

  const onSubmit = async (data: RescheduleRequestFormData) => {
    setIsSubmitting(true);

    try {
      // Combine date and time
      const preferredDateTime = new Date(`${data.preferredDate}T${data.preferredTime}`);

      // Check if the date is in the future
      if (preferredDateTime <= new Date()) {
        toast.error("لازم يكون الوقت المفضل في المستقبل");
        setIsSubmitting(false);
        return;
      }

      const result = await requestMeetingReschedule(
        meetingId,
        preferredDateTime,
        data.reason
      );

      if (result.success) {
        toast.success("اتبعت طلب إعادة الجدولة");
        form.reset();
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "تعذّر الإرسال طلب إعادة الجدولة");
      }
    } catch (error) {
      console.error("Error submitting reschedule request:", error);
      toast.error("حصل خطأ وإنت إرسال الطلب");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>طلب إعادة جدولة الاجتماع</DialogTitle>
          <DialogDescription>
            أرسل طلباً لإعادة جدولة هذا الاجتماع بالوقت المفضل لديك. سيراجع
            فريق الدعم طلبك.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="preferredDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التاريخ المفضل</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوقت المفضل</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>السبب (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder=" توضيح سبب حاجتك لإعادة الجدولة..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "إرسال الطلب"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
