"use client";

import { z } from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useRef, useMemo } from "react";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings, uploadFavicon } from "@/actions/settings";
import { SystemSettings } from "@/types/settings";
import { Loader2, Palette, Upload } from "lucide-react";
import { FixColorsButton } from "./fix-colors-button";
import {
  SettingsFormCard,
  SettingsSaveBar,
  settingsSectionTitleClass,
  settingsFieldClass,
  settingsInputClass,
} from "@/components/settings/settings-form-shell";

const appearanceSettingsSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون hex مش صح"),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون hex مش صح"),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون hex مش صح"),
  successColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون hex مش صح"),
  warningColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون hex مش صح"),
  infoColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "لون hex مش صح")
    .optional(),
  errorColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "لون hex مش صح"),
  footerText: z.string().optional(),
  copyrightText: z.string().optional(),
  customCss: z.string().optional(),
});

type AppearanceSettingsFormData = z.infer<typeof appearanceSettingsSchema>;

interface AppearanceSettingsFormProps {
  settings: SystemSettings;
}

export function AppearanceSettingsForm({
  settings,
}: AppearanceSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState(
    settings.appearance.faviconUrl || ""
  );
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AppearanceSettingsFormData>({
    resolver: zodResolver(appearanceSettingsSchema),
    defaultValues: {
      primaryColor: settings.appearance.primaryColor,
      secondaryColor: settings.appearance.secondaryColor,
      accentColor: settings.appearance.accentColor,
      successColor:
        settings.appearance.successColor ||
        DEFAULT_SETTINGS.appearance.successColor,
      warningColor:
        settings.appearance.warningColor ||
        DEFAULT_SETTINGS.appearance.warningColor,
      infoColor:
        settings.appearance.infoColor || settings.appearance.primaryColor,
      errorColor:
        settings.appearance.errorColor ||
        DEFAULT_SETTINGS.appearance.errorColor,
      footerText: settings.appearance.footerText || "",
      copyrightText: settings.appearance.copyrightText || "",
      customCss: settings.appearance.customCss || "",
    },
  });

  const primaryColor = watch("primaryColor");
  const secondaryColor = watch("secondaryColor");
  const accentColor = watch("accentColor");
  const successColor = watch("successColor");
  const warningColor = watch("warningColor");
  const errorColor = watch("errorColor");
  const infoColor = watch("infoColor");

  const contrast = useMemo(() => {
    const hexToRgb = (hex?: string) => {
      if (!hex) return { r: 0, g: 0, b: 0 };
      const n = hex.replace("#", "");
      const r = parseInt(n.substring(0, 2), 16);
      const g = parseInt(n.substring(2, 4), 16);
      const b = parseInt(n.substring(4, 6), 16);
      return { r, g, b };
    };
    const pick = (hex?: string) => {
      const { r, g, b } = hexToRgb(hex);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 180 ? "#111111" : "#ffffff";
    };
    return {
      primary: pick(primaryColor),
      secondary: pick(secondaryColor),
      accent: pick(accentColor),
      info: pick(infoColor),
    };
  }, [primaryColor, secondaryColor, accentColor, infoColor]);

  const handleFaviconUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFavicon(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadFavicon(formData);

      if (result.success && result.data) {
        setFaviconUrl(result.data.url);
        router.refresh();
        toast.success("اترفعت أيقونة الموقع");
      } else {
        toast.error(result.error || "تعذّر رفع أيقونة الموقع");
      }
    } catch {
      toast.error("حصل خطأ وإحنا رفع أيقونة الموقع");
    } finally {
      setIsUploadingFavicon(false);
      if (faviconInputRef.current) {
        faviconInputRef.current.value = "";
      }
    }
  };

  const onSubmit = async (data: AppearanceSettingsFormData) => {
    setIsLoading(true);

    try {
      const result = await updateSettings({
        appearance: {
          ...data,
          footerText: data.footerText || undefined,
          copyrightText: data.copyrightText || undefined,
          customCss: data.customCss || undefined,
        },
      });

      if (result.success) {
        if (typeof document !== "undefined") {
          const root = document.documentElement;
          const set = (k: string, v?: string) =>
            v && root.style.setProperty(k, v);
          set(
            "--brand-primary",
            result.data?.appearance?.primaryColor || primaryColor
          );
          set(
            "--brand-secondary",
            result.data?.appearance?.secondaryColor || secondaryColor
          );
          set(
            "--brand-accent",
            result.data?.appearance?.accentColor || accentColor
          );
          set("--brand-success", result.data?.appearance?.successColor);
          set("--brand-warning", result.data?.appearance?.warningColor);
          set("--brand-error", result.data?.appearance?.errorColor);
          const ic = result.data?.appearance?.infoColor || infoColor;
          if (ic) set("--brand-info", ic);
        }
        router.refresh();
        toast.success("اتحدّثت إعدادات المظهر");
      } else {
        toast.error(result.error || "مقدرناش نحدّث الإعدادات");
      }
    } catch {
      toast.error("حصل خطأ وإحنا بنحدّث الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  const colorFields = [
    { id: "primaryColor" as const, label: "اللون الأساسي", value: primaryColor, placeholder: "#3b82f6" },
    { id: "secondaryColor" as const, label: "اللون الثانوي", value: secondaryColor, placeholder: "#8b5cf6" },
    { id: "accentColor" as const, label: "لون التمييز", value: accentColor, placeholder: "#10b981" },
    { id: "successColor" as const, label: "لون النجاح", value: successColor, placeholder: "#10b981" },
    { id: "warningColor" as const, label: "لون التحذير", value: warningColor, placeholder: "#f59e0b" },
    { id: "infoColor" as const, label: "لون المعلومات", value: infoColor, placeholder: "#0ea5e9" },
    { id: "errorColor" as const, label: "لون الخطأ", value: errorColor, placeholder: "#ef4444" },
  ];

  return (
    <SettingsFormCard
      icon={<Palette className="h-5 w-5 text-pink-500" />}
      iconWrapperClassName="rounded-lg bg-pink-500/10"
      title="إعدادات المظهر"
      description="تخصيص مظهر وشكل بوابة دعم ENS"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Favicon Upload Section */}
        <div className="space-y-4">
          <p className={settingsSectionTitleClass}>أيقونة الموقع</p>
          <p className="text-sm text-muted-foreground">
            ارفع أيقونة الموقع (الحجم الموصى به: 32×32px أو 16×16px، بحد
            أقصى 1MB)
          </p>

          {faviconUrl && (
            <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
              <div className="shrink-0">
                <Image
                  width={32}
                  height={32}
                  src={faviconUrl}
                  alt="معاينة أيقونة الموقع"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className="flex-1 text-sm text-muted-foreground">
                أيقونة الموقع الحالية
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/*,.ico"
              onChange={handleFaviconUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => faviconInputRef.current?.click()}
              disabled={isUploadingFavicon}
              className="gap-2"
            >
              {isUploadingFavicon ? (
                <>
                  <span>جاري الرفع...</span>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                <>
                  <span>رفع أيقونة الموقع</span>
                  <Upload className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Brand Colors Section */}
        <div className="space-y-4">
          <p className={settingsSectionTitleClass}>ألوان العلامة التجارية</p>

          {colorFields.map(({ id, label, value, placeholder }) => (
            <div key={id} className={settingsFieldClass}>
              <Label htmlFor={id}>{label}</Label>
              <div className="flex gap-2">
                <Input
                  id={id}
                  type="color"
                  {...register(id)}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(id, e.target.value)}
                  placeholder={placeholder}
                  dir="ltr"
                  className={`flex-1 ${settingsInputClass}`}
                />
              </div>
              {errors[id] && (
                <p className="text-sm text-destructive">
                  {errors[id]?.message}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Text Customization Section */}
        <div className="space-y-4">
          <p className={settingsSectionTitleClass}>تخصيص النصوص</p>

          <div className={settingsFieldClass}>
            <Label htmlFor="footerText">نص التذييل (اختياري)</Label>
            <Input
              id="footerText"
              {...register("footerText")}
              placeholder="© 2024 شركتك. جميع الحقوق محفوظة."
              className={settingsInputClass}
            />
            <p className="text-sm text-muted-foreground">
              نص مخصص يُعرض في التذييل
            </p>
            {errors.footerText && (
              <p className="text-sm text-destructive">
                {errors.footerText.message}
              </p>
            )}
          </div>

          <div className={settingsFieldClass}>
            <Label htmlFor="copyrightText">نص حقوق النشر (اختياري)</Label>
            <Input
              id="copyrightText"
              {...register("copyrightText")}
              placeholder="حقوق النشر © 2024 شركتك"
              className={settingsInputClass}
            />
            <p className="text-sm text-muted-foreground">
              إشعار حقوق النشر المعروض
            </p>
            {errors.copyrightText && (
              <p className="text-sm text-destructive">
                {errors.copyrightText.message}
              </p>
            )}
          </div>
        </div>

        {/* Custom CSS */}
        <div className={settingsFieldClass}>
          <Label htmlFor="customCss">CSS مخصص (اختياري)</Label>
          <Textarea
            id="customCss"
            {...register("customCss")}
            placeholder=".custom-class { color: red; }"
            rows={8}
            dir="ltr"
            className="font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            أضف CSS مخصصًا لتجاوز الأنماط الافتراضية. استخدم بحذر.
          </p>
          {errors.customCss && (
            <p className="text-sm text-destructive">
              {errors.customCss.message}
            </p>
          )}
        </div>

        {/* Preview Section */}
        <div className="mb-0 space-y-4 rounded-lg border p-4">
          <p className={settingsSectionTitleClass}>معاينة الألوان</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="space-y-2">
              <Button
                type="button"
                style={{
                  backgroundColor: primaryColor,
                  color: contrast.primary,
                }}
                className="w-full"
              >
                أساسي
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                اللون الأساسي
              </p>
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                style={{
                  backgroundColor: secondaryColor,
                  color: contrast.secondary,
                }}
                className="w-full"
              >
                ثانوي
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                اللون الثانوي
              </p>
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                style={{
                  backgroundColor: accentColor,
                  color: contrast.accent,
                }}
                className="w-full"
              >
                تمييز
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                لون التمييز
              </p>
            </div>
            <div className="space-y-2">
              <Button
                type="button"
                style={{ backgroundColor: infoColor, color: contrast.info }}
                className="w-full"
              >
                معلومات
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                لون المعلومات
              </p>
            </div>
          </div>
        </div>

        <SettingsSaveBar
          isLoading={isLoading}
          label="حفظ"
          secondary={<FixColorsButton />}
        />
      </form>
    </SettingsFormCard>
  );
}
