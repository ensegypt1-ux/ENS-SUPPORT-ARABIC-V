"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PanelSwitchField } from "@/components/ui/panel-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateSettings } from "@/actions/settings";
import { SystemSettings } from "@/types/settings";
import { Shield, Lock, Clock } from "lucide-react";
import { PageSectionLabel } from "@/components/ui/arabic-ux";
import {
  SettingsFormCard,
  SettingsSaveBar,
} from "@/components/settings/settings-form-shell";

const securitySettingsSchema = z.object({
  enableCsrfProtection: z.boolean(),
  sessionMaxAge: z.number().min(3600).max(2592000), // 1 hour to 30 days
  maxLoginAttempts: z.number().min(3).max(10),
  lockoutDuration: z.number().min(5).max(1440), // 5 minutes to 24 hours
  requireEmailVerification: z.boolean(),
  enableTwoFactorAuth: z.boolean(),
});

type SecuritySettingsFormData = z.infer<typeof securitySettingsSchema>;

interface SecuritySettingsFormProps {
  settings: SystemSettings;
}

export function SecuritySettingsForm({ settings }: SecuritySettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SecuritySettingsFormData>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: settings.security,
  });

  const onSubmit = async (data: SecuritySettingsFormData) => {
    setIsLoading(true);

    try {
      const result = await updateSettings({
        security: data,
      });

      if (result.success) {
        toast.success("تم تحديث إعدادات الأمان");
      } else {
        toast.error(result.error || "تعذّر تحديث الإعدادات");
      }
    } catch (error) {
      toast.error("حدث خطأ وإحنا بنحدّث الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsFormCard
      icon={<Shield className="h-5 w-5 text-green-500" />}
      iconWrapperClassName="rounded-md bg-green-500/10"
      title="إعدادات الأمان"
      description="اضبط إعدادات الأمان والمصادقة"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Protection Settings */}
        <div className="space-y-4">
          <PageSectionLabel className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            إعدادات الحماية
          </PageSectionLabel>
          <div className="space-y-3">
            <PanelSwitchField
              label="تفعيل حماية CSRF"
              description="الحماية من هجمات تزوير الطلبات عبر المواقع"
              control={
                <Switch
                  id="enableCsrfProtection"
                  checked={watch("enableCsrfProtection")}
                  onCheckedChange={(checked) =>
                    setValue("enableCsrfProtection", checked)
                  }
                />
              }
            />

            <PanelSwitchField
              label="طلب التحقق من البريد الإلكتروني"
              description="يجب على المستخدم يفعّل بريده قبل ما يدخل"
              control={
                <Switch
                  id="requireEmailVerification"
                  checked={watch("requireEmailVerification")}
                  onCheckedChange={(checked) =>
                    setValue("requireEmailVerification", checked)
                  }
                />
              }
            />

            <PanelSwitchField
              className="opacity-60"
              label="تفعيل المصادقة الثنائية"
              description="السماح للمستخدمين بتفعيل المصادقة الثنائية لمزيد من الأمان (قريباً)"
              control={
                <Switch
                  id="enableTwoFactorAuth"
                  checked={watch("enableTwoFactorAuth")}
                  onCheckedChange={(checked) =>
                    setValue("enableTwoFactorAuth", checked)
                  }
                  disabled
                />
              }
            />
          </div>
        </div>

        {/* Session Settings */}
        <div className="space-y-4">
          <PageSectionLabel className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            إعدادات الجلسة
          </PageSectionLabel>
          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="grid gap-5 sm:grid-cols-3">
              {/* Session Max Age */}
              <div className="space-y-2">
                <Label
                  htmlFor="sessionMaxAge"
                  className="text-sm font-medium"
                >
                  مدة الجلسة (بالساعات)
                </Label>
                <Input
                  id="sessionMaxAge"
                  type="number"
                  value={(watch("sessionMaxAge") / 3600).toFixed(0)}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value);
                    setValue("sessionMaxAge", hours * 3600);
                  }}
                  className="h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  من 1 إلى 720 ساعة (30 يوماً كحد أقصى)
                </p>
                {errors.sessionMaxAge && (
                  <p className="text-sm text-destructive">
                    {errors.sessionMaxAge.message}
                  </p>
                )}
              </div>

              {/* Max Login Attempts */}
              <div className="space-y-2">
                <Label
                  htmlFor="maxLoginAttempts"
                  className="text-sm font-medium"
                >
                  الحد الأقصى لمحاولات تسجيل الدخول
                </Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  {...register("maxLoginAttempts", { valueAsNumber: true })}
                  className="h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  قبل قفل الحساب (من 3 إلى 10)
                </p>
                {errors.maxLoginAttempts && (
                  <p className="text-sm text-destructive">
                    {errors.maxLoginAttempts.message}
                  </p>
                )}
              </div>

              {/* Lockout Duration */}
              <div className="space-y-2">
                <Label
                  htmlFor="lockoutDuration"
                  className="text-sm font-medium"
                >
                  مدة القفل (بالدقائق)
                </Label>
                <Input
                  id="lockoutDuration"
                  type="number"
                  {...register("lockoutDuration", { valueAsNumber: true })}
                  className="h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  من 5 إلى 1440 دقيقة (24 ساعة كحد أقصى)
                </p>
                {errors.lockoutDuration && (
                  <p className="text-sm text-destructive">
                    {errors.lockoutDuration.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting Info */}
        <div className="rounded-xl mb-0 border bg-gradient-to-r from-amber-500/5 to-orange-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
              <Shield className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium">تحديد المعدّل</h3>
              <p className="text-xs text-muted-foreground mt-1">
                إعدادات تحديد المعدّل المتقدمة متاحة في ملفات
                تهيئة النظام.
              </p>
            </div>
          </div>
        </div>

        <SettingsSaveBar isLoading={isLoading} />
      </form>
    </SettingsFormCard>
  );
}
