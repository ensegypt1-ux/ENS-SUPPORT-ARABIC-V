"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadKBImage } from "@/actions/knowledge-base";

interface CoverImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

export function CoverImageUploader({ value, onChange }: CoverImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  const handleFile = async (file: File) => {
    if (!allowedTypes.includes(file.type)) {
      toast.error("مسموح بس صور (JPEG, PNG, GIF, WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("لازم يكون حجم الصورة أقل من 5 ميجابايت");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await uploadKBImage(formData);
      if (result.success && result.data) {
        onChange(result.data.url);
        toast.success("تم رفع الصورة");
      } else {
        toast.error(result.error ?? "تعذّر الرفع");
      }
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleInputChange}
        disabled={isUploading}
      />

      {value ? (
        /* Preview */
        <div className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/20 group">
          <img
            src={value}
            alt="الغلاف"
            className="w-full h-36 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-sm transition-colors"
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
              onClick={handleRemove}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/60 text-white text-xs font-medium backdrop-blur-sm transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              إزالة
            </button>
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          className={`w-full rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center py-8 px-4 ${
            dragOver
              ? "border-primary/60 bg-primary/5"
              : "border-border/60 bg-muted/10 hover:border-border hover:bg-muted/20"
          }`}
        >
          {isUploading ? (
            <Loader2 className="mx-auto h-6 w-6 text-muted-foreground animate-spin mb-2" />
          ) : (
            <Upload className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-muted-foreground">
            {isUploading ? "جارٍ الرفع..." : "انقر للاختيار أو اسحب وأفلت"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            الحجم الأقصى: 5 ميجابايت
          </p>
        </button>
      )}

      <p className="text-xs text-muted-foreground/60 flex items-center gap-1">
        <ImageIcon className="h-3 w-3" />
        المسموح: JPEG, PNG, GIF, WebP
      </p>
    </div>
  );
}
