"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, RefreshCw, LayoutDashboard } from "lucide-react";
import { ENS_BRAND } from "@/lib/ens-brand";

interface AnalyticsHeaderProps {
  days: number;
}

export function AnalyticsHeader({ days }: AnalyticsHeaderProps) {
  const router = useRouter();

  const handleTimeRangeChange = (value: string) => {
    router.push(`/admin/analytics?days=${value}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
  };

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          تحليلات
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          رؤى شاملة حول {ENS_BRAND.portalTitle}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Select value={days.toString()} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[140px] h-9 text-sm">
            <SelectValue placeholder="اختر الفترة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">آخر 7 أيام</SelectItem>
            <SelectItem value="14">آخر 14 يومًا</SelectItem>
            <SelectItem value="30">آخر 30 يومًا</SelectItem>
            <SelectItem value="60">آخر 60 يومًا</SelectItem>
            <SelectItem value="90">آخر 90 يومًا</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="ghost" size="sm" className="h-9" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="sm" className="h-9" onClick={handleExport}>
          <Download className="h-4 w-4 me-2" />
          تصدير
        </Button>

        <Button asChild variant="outline" size="sm" className="h-9">
          <Link href="/admin">
            <LayoutDashboard className="h-4 w-4 me-2" />
            لوحة التحكم
          </Link>
        </Button>
      </div>
    </div>
  );
}
