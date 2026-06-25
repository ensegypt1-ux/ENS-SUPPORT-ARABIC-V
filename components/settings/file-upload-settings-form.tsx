"use client";

import { z } from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PanelSwitchField } from "@/components/ui/panel-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { updateSettings } from "@/actions/settings";
import { SystemSettings } from "@/types/settings";
import { X, Upload, FileType, HardDrive } from "lucide-react";
import { PageSectionLabel } from "@/components/ui/arabic-ux";
import {
  SettingsFormCard,
  SettingsSaveBar,
} from "@/components/settings/settings-form-shell";

const fileUploadSettingsSchema = z.object({
  enabled: z.boolean(),
  maxFileSize: z.number().min(1024).max(104857600), // 1KB to 100MB
  maxFilesPerTicket: z.number().min(1).max(20),
  allowedFileTypes: z.array(z.string()),
});

type FileUploadSettingsFormData = z.infer<typeof fileUploadSettingsSchema>;

interface FileUploadSettingsFormProps {
  settings: SystemSettings;
}

const COMMON_FILE_TYPES = [
  { label: "صور JPEG", value: "image/jpeg" },
  { label: "صور PNG", value: "image/png" },
  { label: "صور GIF", value: "image/gif" },
  { label: "صور WebP", value: "image/webp" },
  { label: "مستندات PDF", value: "application/pdf" },
  { label: "ملفات نصية", value: "text/plain" },
  { label: "أرشيف ZIP", value: "application/zip" },
  { label: "أرشيف ZIP (بديل)", value: "application/x-zip-compressed" },
  {
    label: "مستندات Word",
    value:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    label: "جداول Excel",
    value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
];

export function FileUploadSettingsForm({
  settings,
}: FileUploadSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newFileType, setNewFileType] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FileUploadSettingsFormData>({
    resolver: zodResolver(fileUploadSettingsSchema),
    defaultValues: settings.fileUploads,
  });

  const allowedFileTypes = watch("allowedFileTypes");
  const fileUploadsEnabled = watch("enabled");

  const onSubmit = async (data: FileUploadSettingsFormData) => {
    setIsLoading(true);

    try {
      const result = await updateSettings({
        fileUploads: data,
      });

      if (result.success) {
        toast.success("تم تحديث إعدادات رفع الملفات");
      } else {
        toast.error(result.error || "تعذّر تحديث الإعدادات");
      }
    } catch (error) {
      toast.error("حدث خطأ وإحنا بنحدّث الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  const addFileType = (fileType: string) => {
    if (fileType && !allowedFileTypes.includes(fileType)) {
      setValue("allowedFileTypes", [...allowedFileTypes, fileType]);
      setNewFileType("");
    }
  };

  const removeFileType = (fileType: string) => {
    setValue(
      "allowedFileTypes",
      allowedFileTypes.filter((type) => type !== fileType)
    );
  };

  return (
    <SettingsFormCard
      icon={<Upload className="h-5 w-5 text-purple-500" />}
      iconWrapperClassName="rounded-md bg-purple-500/10"
      title="إعدادات رفع الملفات"
      description="اضبط إعدادات مرفقات الملفات للتذاكر"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Master Toggle */}
        <div className="space-y-4">
          <PageSectionLabel>خدمة الرفع</PageSectionLabel>
          <PanelSwitchField
            label="تفعيل رفع الملفات"
            description="السماح للعملاء بإرفاق ملفات بالتذاكر"
            control={
              <Switch
                id="enabled"
                checked={watch("enabled")}
                onCheckedChange={(checked) => setValue("enabled", checked)}
              />
            }
          />
        </div>

        {/* Upload Limits */}
        <div className="space-y-4">
          <PageSectionLabel className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            حدود الرفع
          </PageSectionLabel>
          <div className="rounded-xl border bg-muted/20 p-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Max File Size */}
              <div className="space-y-2">
                <Label htmlFor="maxFileSize" className="text-sm font-medium">
                  الحد الأقصى لحجم الملف (ميغابايت)
                </Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  step="0.1"
                  value={(watch("maxFileSize") / 1024 / 1024).toFixed(1)}
                  onChange={(e) => {
                    const mb = parseFloat(e.target.value);
                    setValue("maxFileSize", Math.round(mb * 1024 * 1024));
                  }}
                  disabled={!fileUploadsEnabled}
                  className="h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  من 1 إلى 100 ميغابايت لكل ملف
                </p>
                {errors.maxFileSize && (
                  <p className="text-sm text-destructive">
                    {errors.maxFileSize.message}
                  </p>
                )}
              </div>

              {/* Max Files Per Ticket */}
              <div className="space-y-2">
                <Label
                  htmlFor="maxFilesPerTicket"
                  className="text-sm font-medium"
                >
                  الحد الأقصى للملفات لكل تذكرة
                </Label>
                <Input
                  id="maxFilesPerTicket"
                  type="number"
                  {...register("maxFilesPerTicket", { valueAsNumber: true })}
                  disabled={!fileUploadsEnabled}
                  className="h-11 bg-background/80 border-input/50 focus:border-primary transition-colors"
                />
                <p className="text-xs text-muted-foreground">
                  من 1 إلى 20 ملفاً لكل تذكرة
                </p>
                {errors.maxFilesPerTicket && (
                  <p className="text-sm text-destructive">
                    {errors.maxFilesPerTicket.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Allowed File Types */}
        <div className="space-y-4 mb-0">
          <PageSectionLabel className="flex items-center gap-2">
            <FileType className="h-4 w-4" />
            أنواع الملفات المسموحة
          </PageSectionLabel>
          <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
            <div className="flex gap-2">
              <select
                className="flex h-11 w-full rounded-lg border border-input/50 bg-background/80 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value)}
                disabled={!fileUploadsEnabled}
              >
                <option value="">اختر نوع ملف...</option>
                {COMMON_FILE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={() => addFileType(newFileType)}
                disabled={!newFileType || !fileUploadsEnabled}
                className="h-11 px-5"
              >
                إضافة
              </Button>
            </div>

            {/* Display allowed file types */}
            <div className="flex flex-wrap gap-2">
              {allowedFileTypes.map((fileType) => (
                <Badge
                  key={fileType}
                  variant="secondary"
                  className="gap-1 py-1.5 px-3 bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  <span className="max-w-[200px] truncate text-xs">
                    {COMMON_FILE_TYPES.find((t) => t.value === fileType)
                      ?.label || fileType}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFileType(fileType)}
                    className="ms-1 hover:text-destructive transition-colors"
                    disabled={!fileUploadsEnabled}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {allowedFileTypes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                لا يوجد أنواع ملفات. أضف نوع واحد على الأقل.
              </p>
            )}
          </div>
        </div>

        <SettingsSaveBar isLoading={isLoading} />
      </form>
    </SettingsFormCard>
  );
}
