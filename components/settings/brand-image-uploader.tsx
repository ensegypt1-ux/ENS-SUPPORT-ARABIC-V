"use client";

import { useId, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadResult = {
  success: boolean;
  data?: { url: string; storageKey: string };
  error?: string;
};

type DeleteResult = {
  success: boolean;
  data?: { success: boolean };
  error?: string;
};

interface BrandImageUploaderProps {
  label: string;
  description: string;
  value?: string;
  previewAlt: string;
  uploadLabel: string;
  removeLabel?: string;
  onChange: (url: string) => void;
  uploadAction: (formData: FormData) => Promise<UploadResult>;
  deleteAction: () => Promise<DeleteResult>;
  onSaved?: () => void;
  maxFileSize?: number;
}

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export function BrandImageUploader({
  label,
  description,
  value,
  previewAlt,
  uploadLabel,
  removeLabel = "إزالة",
  onChange,
  uploadAction,
  deleteAction,
  onSaved,
  maxFileSize = 5 * 1024 * 1024,
}: BrandImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const validateFile = (file: File) => {
    if (!allowedImageTypes.includes(file.type)) {
      toast.error("مسموح بس صور JPEG و PNG و GIF و WebP و SVG");
      return false;
    }

    if (file.size > maxFileSize) {
      toast.error(
        `File size exceeds ${(maxFileSize / 1024 / 1024).toFixed(0)}MB`
      );
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File) => {
    if (!validateFile(file)) {
      resetInput();
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadAction(formData);

      if (result.success && result.data) {
        onChange(result.data.url);
        onSaved?.();
        toast.success(`${label} اترفع`);
      } else {
        toast.error(result.error || `تعذّر رفع ${label.toLowerCase()}`);
      }
    } catch {
      toast.error(`حصل خطأ وإحنا رفع ${label.toLowerCase()}`);
    } finally {
      setIsUploading(false);
      resetInput();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteAction();

      if (result.success) {
        onChange("");
        onSaved?.();
        toast.success(`اتشالت إزالة ${label}`);
      } else {
        toast.error(result.error || `تعذّر الإزالة ${label.toLowerCase()}`);
      }
    } catch {
      toast.error(`حصل خطأ وإحنا إزالة ${label.toLowerCase()}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-muted/20 p-5 text-right" dir="rtl">
      <div
        className="grid gap-4 max-sm:grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start"
        style={{ direction: "ltr" }}
      >
        {value ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isUploading || isDeleting}
            className="shrink-0 gap-2 sm:col-start-1 sm:row-start-1"
          >
            <span>{removeLabel}</span>
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        ) : null}
        <div
          className={cn(
            "min-w-0 text-right",
            value ? "sm:col-start-2 sm:row-start-1" : "sm:col-span-2"
          )}
          dir="rtl"
        >
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {value && (
        <div className="mt-4 flex h-20 items-center justify-end rounded-lg border bg-background/80 px-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt={previewAlt}
            width={200}
            height={50}
            className="max-h-12 max-w-[220px] object-contain"
          />
        </div>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={allowedImageTypes.join(",")}
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading || isDeleting}
      />

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "mt-4 flex min-h-32 cursor-pointer flex-col items-end justify-center rounded-xl border-2 border-dashed bg-background/60 px-4 py-6 text-right transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-foreground/30",
          (isUploading || isDeleting) && "pointer-events-none opacity-70"
        )}
        dir="rtl"
      >
        {isUploading ? (
          <Loader2 className="mb-3 h-7 w-7 animate-spin text-muted-foreground" />
        ) : value ? (
          <ImageIcon className="mb-3 h-7 w-7 text-muted-foreground" />
        ) : (
          <Upload className="mb-3 h-7 w-7 text-muted-foreground" />
        )}
        <span className="text-sm font-medium text-foreground">
          {isUploading ? "جاري الرفع..." : uploadLabel}
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          PNG أو JPG أو GIF أو WebP أو SVG — بحد أقصى{" "}
          {(maxFileSize / 1024 / 1024).toFixed(0)} ميجابايت
        </span>
      </label>
    </div>
  );
}
