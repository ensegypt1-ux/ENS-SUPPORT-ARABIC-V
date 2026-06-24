"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimezoneSelect } from "@/components/ui/timezone-select";
import { Settings } from "lucide-react";
import { SystemSettings } from "@/types/settings";
import { ENS_BRAND } from "@/lib/ens-brand";
import {
  deleteLogo,
  deleteLogoDark,
  updateSettings,
  uploadLogo,
  uploadLogoDark,
} from "@/actions/settings";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { BrandImageUploader } from "@/components/settings/brand-image-uploader";
import { PageSectionLabel } from "@/components/ui/arabic-ux";
import { getDateFormatLabel } from "@/lib/strings";
import {
  SettingsFormCard,
  SettingsSaveBar,
} from "@/components/settings/settings-form-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const generalSettingsSchema = z.object({
  siteName: z.string().min(1, "اسم الموقع مطلوب"),
  siteDescription: z.string().min(1, "وصف الموقع مطلوب"),
  supportEmail: z.union([
    z.literal(""),
    z.string().email("عنوان بريد إلكتروني مش صح"),
  ]),
  companyName: z.string().min(1, "اسم الشركة مطلوب"),
  timezone: z.string().min(1, "المنطقة الزمنية مطلوبة"),
  dateFormat: z.string().min(1, "تنسيق التاريخ مطلوب"),
  timeFormat: z.enum(["12h", "24h"]),
});

type GeneralSettingsFormData = z.infer<typeof generalSettingsSchema>;

interface GeneralSettingsFormProps {
  settings: SystemSettings;
}

export function GeneralSettingsForm({ settings }: GeneralSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(settings.appearance.logoUrl || "");
  const [logoDarkUrl, setLogoDarkUrl] = useState(
    settings.appearance.logoDarkUrl || ""
  );
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GeneralSettingsFormData>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: settings.general,
  });

  const timeFormat = watch("timeFormat");
  const dateFormat = watch("dateFormat");

  const onSubmit = async (data: GeneralSettingsFormData) => {
    setIsLoading(true);

    try {
      const result = await updateSettings({
        general: data,
      });

      if (result.success) {
        router.refresh();
        toast.success("اتحدّثت الإعدادات");
      } else {
        toast.error(result.error || "مقدرناش نحدّث الإعدادات");
      }
    } catch {
      toast.error("حصل خطأ وإحنا بنحدّث الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SettingsFormCard
      icon={<Settings className="h-5 w-5 text-primary" />}
      title="عام"
      description="اضبط المعلومات الأساسية لبوابة دعم ENS."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Site Information Section */}
        <div className="space-y-4">
          <PageSectionLabel>معلومات الموقع</PageSectionLabel>
          <div className="rounded-xl border bg-muted/20 p-5 space-y-5">
            {/* Site Name */}
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-sm font-medium">
                اسم الموقع
              </Label>
              <Input
                id="siteName"
                {...register("siteName")}
                placeholder={ENS_BRAND.portalTitle}
                className="h-11 bg-background/80 border-input/50 text-right focus:border-primary transition-colors"
              />
              {errors.siteName && (
                <p className="text-sm text-destructive">
                  {errors.siteName.message}
                </p>
              )}
            </div>

            {/* Site Description */}
            <div className="space-y-2">
              <Label
                htmlFor="siteDescription"
                className="text-sm font-medium"
              >
                وصف الموقع
              </Label>
              <Textarea
                id="siteDescription"
                {...register("siteDescription")}
                placeholder={ENS_BRAND.siteDescription}
                rows={3}
                className="bg-background/80 border-input/50 text-right focus:border-primary transition-colors resize-none"
              />
              {errors.siteDescription && (
                <p className="text-sm text-destructive">
                  {errors.siteDescription.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Brand Assets Section */}
        <div className="space-y-4">
          <PageSectionLabel>أصول العلامة التجارية</PageSectionLabel>
          <div className="grid gap-5 xl:grid-cols-2">
            <BrandImageUploader
              label="شعار الوضع الفاتح"
              description="يُستخدم على الخلفيات الفاتحة في الصفحات العامة والشريط الجانبي."
              value={logoUrl}
              previewAlt="معاينة شعار الوضع الفاتح"
              uploadLabel="انقر للرفع أو اسحب وأفلت"
              uploadAction={uploadLogo}
              deleteAction={deleteLogo}
              onChange={setLogoUrl}
              onSaved={() => router.refresh()}
            />
            <BrandImageUploader
              label="شعار الوضع الداكن"
              description="يُستخدم تلقائياً عند تفعيل الوضع الداكن."
              value={logoDarkUrl}
              previewAlt="معاينة شعار الوضع الداكن"
              uploadLabel="انقر للرفع أو اسحب وأفلت"
              uploadAction={uploadLogoDark}
              deleteAction={deleteLogoDark}
              onChange={setLogoDarkUrl}
              onSaved={() => router.refresh()}
            />
          </div>
        </div>

        {/* Company Information Section */}
        <div className="space-y-4">
          <PageSectionLabel>معلومات الشركة</PageSectionLabel>
          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium">
                  اسم الشركة
                </Label>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  placeholder={ENS_BRAND.companyName}
                  className="h-11 bg-background/80 border-input/50 text-right focus:border-primary transition-colors"
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              {/* Support Email */}
              <div className="space-y-2">
                <Label htmlFor="supportEmail" className="text-sm font-medium">
                  الإيميل للدعم
                </Label>
                <Input
                  id="supportEmail"
                  type="email"
                  dir="ltr"
                  {...register("supportEmail")}
                  placeholder="support@ens.eg"
                  className="input-ltr h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
                />
                {errors.supportEmail && (
                  <p className="text-sm text-destructive">
                    {errors.supportEmail.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings Section */}
        <div className="space-y-4 mb-0">
          <PageSectionLabel>الإعدادات الإقليمية</PageSectionLabel>
          <div className="rounded-xl border bg-muted/20 p-5 space-y-5">
            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-sm font-medium">
                المنطقة الزمنية
              </Label>
              <TimezoneSelect
                value={watch("timezone")}
                onValueChange={(value) => setValue("timezone", value)}
              />
              {errors.timezone && (
                <p className="text-sm text-destructive">
                  {errors.timezone.message}
                </p>
              )}
            </div>

            {/* Date & Time Format */}
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Date Format */}
              <div className="space-y-2">
                <Label htmlFor="dateFormat" className="text-sm font-medium">
                  تنسيق التاريخ
                </Label>
                <Select
                  value={watch("dateFormat")}
                  onValueChange={(value) => setValue("dateFormat", value)}
                >
                  <SelectTrigger className="h-11 bg-background/80 border-input/50">
                    <SelectValue placeholder="اختر تنسيق التاريخ">
                      {dateFormat ? getDateFormatLabel(dateFormat) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MMM dd, yyyy">٠١ يناير ٢٠٢٤</SelectItem>
                    <SelectItem value="dd/MM/yyyy">٠١/٠١/٢٠٢٤</SelectItem>
                    <SelectItem value="MM/dd/yyyy">٠١/٠١/٢٠٢٤</SelectItem>
                    <SelectItem value="yyyy-MM-dd">٢٠٢٤-٠١-٠١</SelectItem>
                    <SelectItem value="dd MMM yyyy">٠١ يناير ٢٠٢٤</SelectItem>
                  </SelectContent>
                </Select>
                {errors.dateFormat && (
                  <p className="text-sm text-destructive">
                    {errors.dateFormat.message}
                  </p>
                )}
              </div>

              {/* Time Format */}
              <div className="space-y-2">
                <Label htmlFor="timeFormat" className="text-sm font-medium">
                  تنسيق الوقت
                </Label>
                <Select
                  value={timeFormat}
                  onValueChange={(value: "12h" | "24h") =>
                    setValue("timeFormat", value)
                  }
                >
                  <SelectTrigger className="h-11 bg-background/80 border-input/50">
                    <SelectValue placeholder="اختر تنسيق الوقت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12 ساعة (2:30 م)</SelectItem>
                    <SelectItem value="24h">24 ساعة (14:30)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.timeFormat && (
                  <p className="text-sm text-destructive">
                    {errors.timeFormat.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <SettingsSaveBar isLoading={isLoading} />
      </form>
    </SettingsFormCard>
  );
}
