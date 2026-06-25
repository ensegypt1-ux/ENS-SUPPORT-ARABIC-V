"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadAIWidgetImage } from "@/actions/ai-training";

interface WidgetAvatarUploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

const ALLOWED = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

export function WidgetAvatarUploader({
  value,
  onChange,
}: WidgetAvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error("يُسمح فقط JPG أو PNG أو JPEG أو WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadAIWidgetImage(formData);
      if (result.success && result.data) {
        onChange(result.data.url);
        toast.success("اترفعت الصورة الرمزية");
      } else {
        toast.error(result.error ?? "تعذّر الرفع");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        disabled={isUploading}
      />

      {value ? (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="صورة رأس المحادثة"
            className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              استبدال
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={isUploading}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5" />
              إزالة
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          disabled={isUploading}
          className={`flex w-full cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragOver
              ? "border-primary/60 bg-primary/5"
              : "border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20"
          }`}
        >
          {isUploading ? (
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-sm font-medium text-foreground">
            اسحب الصورة وأفلتها، أو انقر للتصفح
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            صيغ الصور: JPG، PNG، JPEG، WEBP.
          </p>
          <p className="text-xs text-muted-foreground">
            الحجم الموصى به: 256 × 256 بكسل
          </p>
        </button>
      )}
    </div>
  );
}
