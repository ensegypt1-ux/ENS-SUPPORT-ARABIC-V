"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateMeetingSchema } from "@/lib/validations";
import { updateMeeting } from "@/actions/meetings";
import type { Meeting, MeetingFormData } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Video, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { TimezoneSelect } from "@/components/ui/timezone-select";

interface MeetingEditorProps {
  meeting: Meeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingEditor({
  meeting,
  open,
  onOpenChange,
}: MeetingEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(updateMeetingSchema),
    defaultValues: {
      platform: meeting.platform,
      title: meeting.title,
      description: meeting.description || "",
      duration: meeting.duration,
      meetingLink: meeting.meetingLink || "",
      timezone: meeting.timezone || "",
    },
  });

  const platform = watch("platform");
  const timezone = watch("timezone");

  const onSubmit = async (data: Partial<MeetingFormData>) => {
    setIsSubmitting(true);
    setError("");

    const result = await updateMeeting(meeting._id.toString(), data);

    if (result.success) {
      toast.success("تم التحديث الاجتماع");
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error || "تعذّر التحديث الاجتماع");
      toast.error(result.error || "تعذّر التحديث الاجتماع");
    }

    setIsSubmitting(false);
  };

  // Format the date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>تعديل الاجتماع</DialogTitle>
          <DialogDescription>
            حدّث تفاصيل الاجتماع أدناه.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">منصة الاجتماع</Label>
            <Select
              defaultValue={meeting.platform}
              onValueChange={(value) =>
                setValue("platform", value as "zoom" | "google_meet")
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">
                  <div className="flex items-center">
                    <Video className="me-2 h-4 w-4" />
                    Zoom
                  </div>
                </SelectItem>
                <SelectItem value="google_meet">
                  <div className="flex items-center">
                    <Video className="me-2 h-4 w-4" />
                    Google Meet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-sm text-destructive">
                {String(errors.platform.message)}
              </p>
            )}
          </div>

          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="title">عنوان الاجتماع</Label>
            <Input
              id="title"
              placeholder="مثال: مناقشة متطلبات التخصيص"
              {...register("title")}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {String(errors.title.message)}
              </p>
            )}
          </div>

          {/* Meeting Description */}
          <div className="space-y-2">
            <Label htmlFor="description">جدول أعمال الاجتماع (اختياري)</Label>
            <Textarea
              id="description"
              placeholder="أضف جدول أعمال الاجتماع أو الموضوعات للمناقشة..."
              rows={3}
              {...register("description")}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {String(errors.description.message)}
              </p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">التاريخ والوقت</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                defaultValue={formatDateForInput(meeting.scheduledAt)}
                {...register("scheduledAt", {
                  setValueAs: (value) => (value ? new Date(value) : undefined),
                })}
                disabled={isSubmitting}
              />
              {errors.scheduledAt && (
                <p className="text-sm text-destructive">
                  {String(errors.scheduledAt.message)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">المدة (بالدقائق)</Label>
              <Input
                id="duration"
                type="number"
                placeholder="60"
                {...register("duration", {
                  setValueAs: (value) => (value ? parseInt(value) : undefined),
                })}
                disabled={isSubmitting}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">
                  {String(errors.duration.message)}
                </p>
              )}
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone">المنطقة الزمنية (اختياري)</Label>
            <TimezoneSelect
              value={timezone}
              onValueChange={(value) => setValue("timezone", value)}
              disabled={isSubmitting}
              placeholder="اختر المنطقة الزمنية"
            />
            {errors.timezone && (
              <p className="text-sm text-destructive">
                {String(errors.timezone.message)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              اختر المنطقة الزمنية للاجتماع لتجنب الالتباس
            </p>
          </div>

          {/* Meeting Link */}
          <div className="space-y-2">
            <Label htmlFor="meetingLink">رابط الاجتماع (اختياري)</Label>
            <Input
              id="meetingLink"
              type="url"
              placeholder={
                platform === "zoom"
                  ? "https://zoom.us/j/..."
                  : "https://meet.google.com/..."
              }
              {...register("meetingLink")}
              disabled={isSubmitting}
            />
            {errors.meetingLink && (
              <p className="text-sm text-destructive">
                {String(errors.meetingLink.message)}
              </p>
            )}
          </div>

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
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="me-2 h-4 w-4" />
                  حفظ التغييرات
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
