"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  Laptop,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  CalendarPlus,
  CalendarClock,
  Shield,
} from "lucide-react";
import {
  getUserPreferences,
  updateUserPreferences,
} from "@/actions/preferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import type { NotificationClickBehavior } from "@/types";

function ChannelSelector({
  label,
  icon: Icon,
  value,
  onChange,
  id,
}: {
  label: string;
  icon: React.ElementType;
  value: string | undefined;
  onChange: (value: "both" | "email" | "in_app" | "none") => void;
  id: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-4 hover:border-border/60 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <RadioGroup
        value={value || ""}
        onValueChange={(nextValue) =>
          onChange(nextValue as "both" | "email" | "in_app" | "none")
        }
        className="flex flex-wrap gap-2"
      >
        {[
          { value: "both", label: "كلاهما" },
          { value: "email", label: "البريد الإلكتروني" },
          { value: "in_app", label: "داخل التطبيق" },
          { value: "none", label: "لا شيء" },
        ].map((option) => (
          <div key={`${id}-${option.value}`} className="flex items-center">
            <RadioGroupItem
              value={option.value}
              id={`${id}-${option.value}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`${id}-${option.value}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer border border-border/40 bg-background/50 text-muted-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary transition-all hover:border-border"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}

export function NotificationPreferences() {
  const [clickBehavior, setClickBehavior] =
    useState<NotificationClickBehavior>("detail");
  const [channelsDefault, setChannelsDefault] = useState<
    "both" | "email" | "in_app" | "none"
  >("both");
  const [channelsComment, setChannelsComment] = useState<
    "both" | "email" | "in_app" | "none"
  >();
  const [channelsMeetingScheduled, setChannelsMeetingScheduled] = useState<
    "both" | "email" | "in_app" | "none"
  >();
  const [channelsMeetingUpdated, setChannelsMeetingUpdated] = useState<
    "both" | "email" | "in_app" | "none"
  >();
  const [channelsAttachment, setChannelsAttachment] = useState<
    "both" | "email" | "in_app" | "none"
  >();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const {
    permission: pushPermission,
    isSupported: pushSupported,
    isConfigured: pushConfigured,
    isSubscribed: pushSubscribed,
    subscriptionCount,
    loading: pushLoading,
    busy: pushBusy,
    enablePush,
    disablePush,
  } = usePushNotifications();

  // Load current preferences
  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const result = await getUserPreferences();
        if (!active) return;

        if (result.success && result.data) {
          setClickBehavior(result.data.notifications?.clickBehavior || "detail");
          const ch = result.data.notifications?.channels;
          setChannelsDefault(ch?.default || "both");
          setChannelsComment(ch?.comment);
          setChannelsMeetingScheduled(ch?.meetingScheduled);
          setChannelsMeetingUpdated(ch?.meetingUpdated);
          setChannelsAttachment(ch?.attachment);
        } else {
          setLoadError(result.error || "تعذّر تحميل التفضيلات");
        }
      } catch {
        if (active) {
          setLoadError("تعذّر تحميل التفضيلات");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadPreferences();

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateUserPreferences({
      notifications: {
        clickBehavior,
        channels: {
          default: channelsDefault,
          comment: channelsComment,
          meetingScheduled: channelsMeetingScheduled,
          meetingUpdated: channelsMeetingUpdated,
          attachment: channelsAttachment,
        },
      },
    });

    if (result.success) {
      toast.success("تم التحديث تفضيلات الإشعارات");
    } else {
      toast.error(result.error || "تعذّر التحديث التفضيلات");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <h3 className="font-medium text-foreground">تفضيلات الإشعارات</h3>
        </div>
        <div className="space-y-3 py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm font-medium text-foreground">{loadError}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 rounded-lg"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">
            تفضيلات الإشعارات
          </h3>
          <p className="text-xs text-muted-foreground">
            خصّص كيفية عمل الإشعارات بالنسبة لك
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Click Behavior Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">سلوك النقر</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              ما الذي يحدث عند النقر على إشعار
            </p>
          </div>

          <RadioGroup
            value={clickBehavior}
            onValueChange={(value) =>
              setClickBehavior(value as NotificationClickBehavior)
            }
            className="grid gap-3"
          >
            <label
              htmlFor="detail"
              className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                clickBehavior === "detail"
                  ? "border-primary bg-primary/5"
                  : "border-border/40 hover:border-border"
              }`}
            >
              <RadioGroupItem value="detail" id="detail" className="mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-sm">
                  عرض صفحة التفاصيل أولاً
                </span>
                <span className="ms-2 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  موصى به
                </span>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  اعرض محتوى الإشعار كاملاً قبل الانتقال إلى المورد.
                </p>
              </div>
            </label>

            <label
              htmlFor="direct"
              className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all ${
                clickBehavior === "direct"
                  ? "border-primary bg-primary/5"
                  : "border-border/40 hover:border-border"
              }`}
            >
              <RadioGroupItem value="direct" id="direct" className="mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-sm">
                  الانتقال مباشرة إلى المورد
                </span>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  تخطّ صفحة التفاصيل وانتقل مباشرة إلى التذكرة أو الرسالة
                  المرتبطة.
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Channels Section */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">قنوات الإشعارات</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              اختر كيفية استلام أنواع الإشعارات المختلفة
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <ChannelSelector
              label="الافتراضي"
              icon={Mail}
              value={channelsDefault}
              onChange={setChannelsDefault}
              id="ch-default"
            />
            <ChannelSelector
              label="التعليقات"
              icon={MessageSquare}
              value={channelsComment}
              onChange={setChannelsComment}
              id="ch-comment"
            />
            <ChannelSelector
              label="المرفقات"
              icon={Paperclip}
              value={channelsAttachment}
              onChange={setChannelsAttachment}
              id="ch-attachment"
            />
            <ChannelSelector
              label="اجتماع مجدول"
              icon={CalendarPlus}
              value={channelsMeetingScheduled}
              onChange={setChannelsMeetingScheduled}
              id="ch-meeting-scheduled"
            />
            <ChannelSelector
              label="اجتماع محدّث"
              icon={CalendarClock}
              value={channelsMeetingUpdated}
              onChange={setChannelsMeetingUpdated}
              id="ch-meeting-updated"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">إشعارات المتصفح</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              استلم تنبيهات في الخلفية حتى عندما لا يكون التطبيق في
              المقدمة. تتبع الإشعارات الفورية قنوات الإشعارات داخل التطبيق.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-background/30 p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {pushSubscribed
                        ? "إشعارات المتصفح مفعّلة على هذا الجهاز"
                        : "إشعارات المتصفح غير مفعّلة على هذا الجهاز"}
                    </p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      ثبّت التطبيق من قائمة المتصفح للحصول على أفضل تجربة على
                      الهاتف وسطح المكتب، ثم فعّل الإشعارات هنا عندما تكون
                      جاهزاً.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-muted-foreground">
                    {pushSupported ? "الإشعارات مدعومة" : "الإشعارات غير مدعومة"}
                  </span>
                  <span className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-muted-foreground">
                    الخادم {pushConfigured ? "مهيأ" : "غير مهيأ"}
                  </span>
                  <span className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-muted-foreground">
                    الإذن: {pushPermission}
                  </span>
                  <span className="rounded-full border border-border/50 bg-background/70 px-2.5 py-1 text-muted-foreground">
                    المتصفحات النشطة: {subscriptionCount}
                  </span>
                </div>

                {!pushSupported && (
                  <div className="flex items-start gap-2 rounded-xl border border-border/40 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                    <Laptop className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      تتطلب إشعارات المتصفح متصفحاً حديثاً يدعم Service Worker
                      وواجهة Push API، بالإضافة إلى HTTPS في بيئة الإنتاج.
                    </p>
                  </div>
                )}

                {pushSupported && !pushConfigured && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      أضف `NEXT_PUBLIC_VAPID_PUBLIC_KEY` و`VAPID_PRIVATE_KEY`
                      و`VAPID_SUBJECT` على الخادم قبل تفعيل إشعارات
                      المتصفح.
                    </p>
                  </div>
                )}

                {pushPermission === "denied" && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      الإشعارات محظورة لهذا الموقع في متصفحك. أعد تفعيلها في
                      إعدادات المتصفح، ثم حاول مرة أخرى هنا.
                    </p>
                  </div>
                )}
              </div>

              <Button
                type="button"
                variant={pushSubscribed ? "outline" : "default"}
                onClick={pushSubscribed ? disablePush : enablePush}
                disabled={
                  pushLoading ||
                  pushBusy ||
                  !pushSupported ||
                  (!pushConfigured && !pushSubscribed)
                }
                className="rounded-lg lg:min-w-48"
              >
                {pushBusy ? (
                  <>
                    <Loader2 className="me-2 h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : pushSubscribed ? (
                  "تعطيل على هذا الجهاز"
                ) : (
                  "تفعيل إشعارات المتصفح"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-stretch pt-4 border-t border-border/40 sm:justify-end">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg w-full sm:w-auto"
          >
            {isSaving ? (
              <>
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              "حفظ التفضيلات"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
