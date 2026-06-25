"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SystemSettings } from "@/types/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send, Mail } from "lucide-react";
import { updateSettings, testEmailSettings } from "@/actions/settings";
import { PanelSwitchField } from "@/components/ui/panel-form";
import { PageSectionLabel } from "@/components/ui/arabic-ux";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  SettingsFormCard,
  SettingsSaveBar,
} from "@/components/settings/settings-form-shell";

const emailSettingsSchema = z.object({
  enabled: z.boolean(),
  notifyOnNewTicket: z.boolean(),
  notifyOnTicketUpdate: z.boolean(),
  notifyOnNewComment: z.boolean(),
  notifyOnTicketAssignment: z.boolean(),
  notifyOnTicketResolution: z.boolean(),
  adminNotificationEmail: z.string().email("عنوان بريد إلكتروني غير صالح"),
});

type EmailSettingsFormData = z.infer<typeof emailSettingsSchema>;

interface EmailSettingsFormProps {
  settings: SystemSettings;
  serverEmailDisabled?: boolean;
  smtpConfigured?: boolean;
}

export function EmailSettingsForm({
  settings,
  serverEmailDisabled = false,
  smtpConfigured = true,
}: EmailSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmailSettingsFormData>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: settings.email,
  });

  const onSubmit = async (data: EmailSettingsFormData) => {
    setIsLoading(true);

    try {
      const result = await updateSettings({
        email: data,
      });

      if (result.success) {
        toast.success("تم تحديث إعدادات البريد");
      } else {
        toast.error(result.error || "تعذّر تحديث الإعدادات");
      }
    } catch (error) {
      toast.error("حدث خطأ وإحنا بنحدّث الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);

    try {
      const result = await testEmailSettings();

      if (result.success) {
        toast.success("تم الإرسال بريد الاختبار — شيّك على الوارد.");
      } else {
        toast.error(result.error || "تعذّر الإرسال بريد الاختبار");
      }
    } catch (error) {
      toast.error("حدث خطأ وإحنا إرسال بريد الاختبار");
    } finally {
      setIsTesting(false);
    }
  };

  const emailEnabled = watch("enabled");

  return (
    <SettingsFormCard
      icon={<Mail className="h-5 w-5 text-blue-500" />}
      iconWrapperClassName="rounded-md bg-blue-500/10"
      title="إعدادات البريد"
      description="اضبط إشعارات البريد الإلكتروني للتذاكر والتحديثات"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {serverEmailDisabled ? (
          <Alert variant="destructive">
            <AlertTitle>البريد معطّل على مستوى الخادم</AlertTitle>
            <AlertDescription>
              <code dir="ltr" className="text-xs">
                EMAIL_NOTIFICATIONS_ENABLED=false
              </code>{" "}
              في ملف{" "}
              <code dir="ltr" className="text-xs">
                .env.local
              </code>
              . عيّن القيمة{" "}
              <code dir="ltr" className="text-xs">
                true
              </code>{" "}
              أو احذف السطر، ثم أعد تشغيل الخادم.
            </AlertDescription>
          </Alert>
        ) : null}

        {!smtpConfigured ? (
          <Alert variant="destructive">
            <AlertTitle>إعدادات SMTP غير مكتملة</AlertTitle>
            <AlertDescription>
              أكمل{" "}
              <code dir="ltr" className="text-xs">
                EMAIL_SERVER_HOST
              </code>
              ،{" "}
              <code dir="ltr" className="text-xs">
                EMAIL_SERVER_USER
              </code>
              ،{" "}
              <code dir="ltr" className="text-xs">
                EMAIL_SERVER_PASSWORD
              </code>{" "}
              و{" "}
              <code dir="ltr" className="text-xs">
                EMAIL_FROM
              </code>{" "}
              في{" "}
              <code dir="ltr" className="text-xs">
                .env.local
              </code>
              .
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Master Toggle Section */}
        <div className="space-y-4">
          <PageSectionLabel>خدمة البريد</PageSectionLabel>
          <PanelSwitchField
            label="تفعيل إشعارات البريد الإلكتروني"
            description="إرسال إشعارات بريدية لأحداث التذاكر"
            control={
              <Switch
                id="enabled"
                checked={watch("enabled")}
                onCheckedChange={(checked) => setValue("enabled", checked)}
              />
            }
          />
        </div>

        {/* Admin Email Section */}
        <div className="space-y-4">
          <PageSectionLabel>إشعارات المسؤول</PageSectionLabel>
          <div className="rounded-xl border bg-muted/20 p-5 space-y-2">
            <Label
              htmlFor="adminNotificationEmail"
              className="text-sm font-medium"
            >
              بريد إشعارات المسؤول
            </Label>
            <Input
              id="adminNotificationEmail"
              type="email"
              dir="ltr"
              {...register("adminNotificationEmail")}
              placeholder="admin@company.com"
              disabled={!emailEnabled}
              className="input-ltr h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
            />
            <p className="text-xs text-muted-foreground">
              البريد الإلكتروني لاستلام إشعارات المسؤول
            </p>
            {errors.adminNotificationEmail && (
              <p className="text-sm text-destructive">
                {errors.adminNotificationEmail.message}
              </p>
            )}
          </div>
        </div>

        {/* Notification Preferences Section */}
        <div className="space-y-4 mb-0">
          <PageSectionLabel>تفضيلات الإشعارات</PageSectionLabel>
          <div className="space-y-3">
            <PanelSwitchField
              label="تذكرة جديدة"
              description="إشعار عند افتح تذكرة جديدة"
              control={
                <Switch
                  id="notifyOnNewTicket"
                  checked={watch("notifyOnNewTicket")}
                  onCheckedChange={(checked) =>
                    setValue("notifyOnNewTicket", checked)
                  }
                  disabled={!emailEnabled}
                />
              }
            />

            <PanelSwitchField
              label="تغيّر حالة التذكرة"
              description="إشعار عند تحديث حالة التذكرة"
              control={
                <Switch
                  id="notifyOnTicketUpdate"
                  checked={watch("notifyOnTicketUpdate")}
                  onCheckedChange={(checked) =>
                    setValue("notifyOnTicketUpdate", checked)
                  }
                  disabled={!emailEnabled}
                />
              }
            />

            <PanelSwitchField
              label="تعليق جديد"
              description="إشعار عند إضافة تعليق جديد"
              control={
                <Switch
                  id="notifyOnNewComment"
                  checked={watch("notifyOnNewComment")}
                  onCheckedChange={(checked) =>
                    setValue("notifyOnNewComment", checked)
                  }
                  disabled={!emailEnabled}
                />
              }
            />

            <PanelSwitchField
              label="إسناد التذكرة"
              description="إشعار عند إسناد التذكرة لفريق الدعم"
              control={
                <Switch
                  id="notifyOnTicketAssignment"
                  checked={watch("notifyOnTicketAssignment")}
                  onCheckedChange={(checked) =>
                    setValue("notifyOnTicketAssignment", checked)
                  }
                  disabled={!emailEnabled}
                />
              }
            />

            <PanelSwitchField
              label="حلّ التذكرة"
              description="إشعار عند وضع علامة «محلولة» على التذكرة"
              control={
                <Switch
                  id="notifyOnTicketResolution"
                  checked={watch("notifyOnTicketResolution")}
                  onCheckedChange={(checked) =>
                    setValue("notifyOnTicketResolution", checked)
                  }
                  disabled={!emailEnabled}
                />
              }
            />
          </div>
        </div>

        <SettingsSaveBar
          isLoading={isLoading}
          secondary={
            <Button
              type="button"
              variant="outline"
              onClick={handleTestEmail}
              disabled={
                isTesting ||
                !emailEnabled ||
                serverEmailDisabled ||
                !smtpConfigured
              }
              className="h-11 gap-2 px-5"
            >
              {isTesting ? (
                <>
                  <span>جاري الإرسال...</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  <span>إرسال بريد اختبار</span>
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          }
        />
      </form>
    </SettingsFormCard>
  );
}
