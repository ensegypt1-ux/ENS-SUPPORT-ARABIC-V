"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { SystemSettings } from "@/types/settings";
import { updateSettings } from "@/actions/settings";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PanelSectionHeader,
  PanelSwitchField,
} from "@/components/ui/panel-form";
import {
  SettingsSaveBar,
  settingsSectionTitleClass,
  settingsFieldClass,
  settingsInputClass,
} from "@/components/settings/settings-form-shell";

const updatesSettingsSchema = z.object({
  announcementsEnabled: z.boolean(),
  announcementTitle: z.string().max(60),
  announcementMessage: z.string().max(500),
  announcementVariant: z.enum(["info", "success", "warning", "maintenance"]),
  announcementDismissible: z.boolean(),
  showOnPublic: z.boolean(),
  showOnDashboard: z.boolean(),
  showOnAdmin: z.boolean(),
  showOnSupport: z.boolean(),
  maintenanceEnabled: z.boolean(),
  maintenanceMessage: z.string().max(500),
  allowAdmin: z.boolean(),
  allowSupport: z.boolean(),
});

type UpdatesSettingsFormData = z.infer<typeof updatesSettingsSchema>;

export function UpdatesSettingsForm({ settings }: { settings: SystemSettings }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const {
    setValue,
    watch,
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdatesSettingsFormData>({
    resolver: zodResolver(updatesSettingsSchema),
    defaultValues: {
      announcementsEnabled: settings.announcements?.enabled ?? false,
      announcementTitle: settings.announcements?.title ?? "ما الجديد",
      announcementMessage: settings.announcements?.message ?? "",
      announcementVariant: settings.announcements?.variant ?? "info",
      announcementDismissible: settings.announcements?.dismissible ?? true,
      showOnPublic: settings.announcements?.showOn?.public ?? false,
      showOnDashboard: settings.announcements?.showOn?.dashboard ?? true,
      showOnAdmin: settings.announcements?.showOn?.admin ?? true,
      showOnSupport: settings.announcements?.showOn?.support ?? true,
      maintenanceEnabled: settings.maintenance?.enabled ?? false,
      maintenanceMessage:
        settings.maintenance?.message ??
        "بنعمل صيانة حاليًا — أعد المحاولة بعد شوية.",
      allowAdmin: settings.maintenance?.allowAdmin ?? true,
      allowSupport: settings.maintenance?.allowSupport ?? true,
    },
  });

  useEffect(() => {
    reset({
      announcementsEnabled: settings.announcements?.enabled ?? false,
      announcementTitle: settings.announcements?.title ?? "ما الجديد",
      announcementMessage: settings.announcements?.message ?? "",
      announcementVariant: settings.announcements?.variant ?? "info",
      announcementDismissible: settings.announcements?.dismissible ?? true,
      showOnPublic: settings.announcements?.showOn?.public ?? false,
      showOnDashboard: settings.announcements?.showOn?.dashboard ?? true,
      showOnAdmin: settings.announcements?.showOn?.admin ?? true,
      showOnSupport: settings.announcements?.showOn?.support ?? true,
      maintenanceEnabled: settings.maintenance?.enabled ?? false,
      maintenanceMessage:
        settings.maintenance?.message ??
        "بنعمل صيانة حاليًا — أعد المحاولة بعد شوية.",
      allowAdmin: settings.maintenance?.allowAdmin ?? true,
      allowSupport: settings.maintenance?.allowSupport ?? true,
    });
  }, [reset, settings]);

  const announcementsEnabled = watch("announcementsEnabled");
  const maintenanceEnabled = watch("maintenanceEnabled");

  const onSubmit = async (data: UpdatesSettingsFormData) => {
    setIsSaving(true);
    try {
      const result = await updateSettings({
        announcements: {
          enabled: data.announcementsEnabled,
          title: data.announcementTitle.trim(),
          message: data.announcementMessage.trim(),
          variant: data.announcementVariant,
          dismissible: data.announcementDismissible,
          showOn: {
            public: data.showOnPublic,
            dashboard: data.showOnDashboard,
            admin: data.showOnAdmin,
            support: data.showOnSupport,
          },
        },
        maintenance: {
          enabled: data.maintenanceEnabled,
          message: data.maintenanceMessage.trim(),
          allowAdmin: data.allowAdmin,
          allowSupport: data.allowSupport,
        },
      });

      if (!result.success) {
        toast.error(result.error || "تعذّر تحديث الإعدادات");
        return;
      }

      toast.success("تم تحديث الإعدادات");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <Card className="overflow-hidden rounded-md border-0 bg-gradient-to-br from-card to-card/80 p-0 shadow-lg">
        <CardHeader className="gap-0 border-b bg-white p-6 dark:bg-card" dir="rtl">
          <PanelSectionHeader
            title="الإعلانات (تحديثات الميزات)"
            description="عرض شريط علوي للإعلان عن ميزات جديدة أو تحديثات مهمة."
            actions={
              <Switch
                checked={announcementsEnabled}
                onCheckedChange={(v) => setValue("announcementsEnabled", v)}
              />
            }
          />
        </CardHeader>
        <CardContent className="space-y-5 p-6 text-right" dir="rtl">
          <div className="grid gap-4 md:grid-cols-2">
            <div className={settingsFieldClass}>
              <Label htmlFor="announcementTitle">العنوان</Label>
              <Input
                id="announcementTitle"
                disabled={!announcementsEnabled || isSaving}
                {...register("announcementTitle")}
                className={settingsInputClass}
              />
              {errors.announcementTitle && (
                <p className="text-sm text-destructive">
                  {errors.announcementTitle.message}
                </p>
              )}
            </div>
            <div className={settingsFieldClass}>
              <Label>النوع</Label>
              <Select
                value={watch("announcementVariant")}
                onValueChange={(v) =>
                  setValue("announcementVariant", v as UpdatesSettingsFormData["announcementVariant"], {
                    shouldValidate: true,
                  })
                }
                disabled={!announcementsEnabled || isSaving}
              >
                <SelectTrigger className={settingsInputClass}>
                  <SelectValue placeholder="اختر النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">معلومات</SelectItem>
                  <SelectItem value="success">نجاح</SelectItem>
                  <SelectItem value="warning">تحذير</SelectItem>
                  <SelectItem value="maintenance">صيانة</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={settingsFieldClass}>
            <Label htmlFor="announcementMessage">الرسالة</Label>
            <Textarea
              id="announcementMessage"
              className="min-h-[100px]"
              disabled={!announcementsEnabled || isSaving}
              {...register("announcementMessage")}
            />
            {errors.announcementMessage && (
              <p className="text-sm text-destructive">
                {errors.announcementMessage.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PanelSwitchField
              label="قابل للإغلاق"
              description="السماح للمستخدمين بإغلاق هذا الشريط."
              control={
                <Switch
                  checked={watch("announcementDismissible")}
                  onCheckedChange={(v) => setValue("announcementDismissible", v)}
                  disabled={!announcementsEnabled || isSaving}
                />
              }
            />

            <div className="space-y-3 rounded-lg border p-3">
              <p className={settingsSectionTitleClass}>عرض في</p>
              <div className="space-y-2">
                <PanelSwitchField
                  label="عام"
                  className="border-0 bg-transparent p-2"
                  control={
                    <Switch
                      checked={watch("showOnPublic")}
                      onCheckedChange={(v) => setValue("showOnPublic", v)}
                      disabled={!announcementsEnabled || isSaving}
                    />
                  }
                />
                <PanelSwitchField
                  label="لوحة التحكم"
                  className="border-0 bg-transparent p-2"
                  control={
                    <Switch
                      checked={watch("showOnDashboard")}
                      onCheckedChange={(v) => setValue("showOnDashboard", v)}
                      disabled={!announcementsEnabled || isSaving}
                    />
                  }
                />
                <PanelSwitchField
                  label="الدعم"
                  className="border-0 bg-transparent p-2"
                  control={
                    <Switch
                      checked={watch("showOnSupport")}
                      onCheckedChange={(v) => setValue("showOnSupport", v)}
                      disabled={!announcementsEnabled || isSaving}
                    />
                  }
                />
                <PanelSwitchField
                  label="مسؤول"
                  className="border-0 bg-transparent p-2"
                  control={
                    <Switch
                      checked={watch("showOnAdmin")}
                      onCheckedChange={(v) => setValue("showOnAdmin", v)}
                      disabled={!announcementsEnabled || isSaving}
                    />
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-md border-0 bg-gradient-to-br from-card to-card/80 p-0 shadow-lg">
        <CardHeader className="gap-0 border-b bg-white p-6 dark:bg-card" dir="rtl">
          <PanelSectionHeader
            title="وضع الصيانة"
            description="العملاء هيتوجّهوا لصفحة الصيانة."
            actions={
              <Switch
                checked={maintenanceEnabled}
                onCheckedChange={(v) => setValue("maintenanceEnabled", v)}
              />
            }
          />
        </CardHeader>
        <CardContent className="space-y-5 p-6 text-right" dir="rtl">
          <div className={settingsFieldClass}>
            <Label htmlFor="maintenanceMessage">رسالة الصيانة</Label>
            <Textarea
              id="maintenanceMessage"
              className="min-h-[90px]"
              disabled={!maintenanceEnabled || isSaving}
              {...register("maintenanceMessage")}
            />
            {errors.maintenanceMessage && (
              <p className="text-sm text-destructive">
                {errors.maintenanceMessage.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <PanelSwitchField
              label="السماح لوصول المسؤول"
              description="يمكن للمسؤولين استخدام التطبيق أثناء الصيانة."
              control={
                <Switch
                  checked={watch("allowAdmin")}
                  onCheckedChange={(v) => setValue("allowAdmin", v)}
                  disabled={!maintenanceEnabled || isSaving}
                />
              }
            />
            <PanelSwitchField
              label="السماح لوصول الدعم"
              description="يمكن لوكلاء الدعم استخدام التطبيق أثناء الصيانة."
              control={
                <Switch
                  checked={watch("allowSupport")}
                  onCheckedChange={(v) => setValue("allowSupport", v)}
                  disabled={!maintenanceEnabled || isSaving}
                />
              }
            />
          </div>
        </CardContent>
      </Card>

      <SettingsSaveBar isLoading={isSaving} className="py-4" />
    </form>
  );
}
