"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export function FixColorsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFixColors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/fix-colors", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "تعذّر إصلاح الألوان");
      }

      if (data.changes && data.changes.length > 0) {
        toast.success("اتصلحت الألوان", {
          description: data.changes.join(", "),
        });
        router.refresh();
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.info("جميع الألوان مضبوطة بالفعل بشكل صحيح");
      }
    } catch (error: any) {
      toast.error(error.message || "تعذّر إصلاح الألوان");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleFixColors}
      disabled={isLoading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "جاري إصلاح الألوان..." : "إصلاح الألوان السوداء"}
    </Button>
  );
}
