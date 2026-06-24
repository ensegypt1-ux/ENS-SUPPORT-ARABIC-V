"use client";

import { useState } from "react";
import { Search, Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { NotificationType } from "@/types";

export interface NotificationFiltersState {
  search: string;
  type: NotificationType | "all";
  read: "all" | "read" | "unread";
  dateRange: "all" | "today" | "week" | "month" | "custom";
  dateFrom?: Date;
  dateTo?: Date;
  sortBy: "date" | "read";
  sortOrder: "asc" | "desc";
}

interface NotificationFiltersProps {
  filters: NotificationFiltersState;
  onFiltersChange: (filters: NotificationFiltersState) => void;
}

const notificationTypes: { value: NotificationType | "all"; label: string }[] =
  [
    { value: "all", label: "جميع الأنواع" },
    { value: "new_message", label: "رسائل جديدة" },
    { value: "new_ticket", label: "تذاكر جديدة" },
    { value: "ticket_status", label: "حالة التذكرة" },
    { value: "ticket_assignment", label: "إسناد التذكرة" },
    { value: "meeting_scheduled", label: "اجتماع مجدول" },
    { value: "meeting_cancelled", label: "اجتماع ملغى" },
    { value: "installation_status", label: "حالة التثبيت" },
    { value: "customization_status", label: "حالة التخصيص" },
    { value: "comment", label: "تعليقات" },
  ];

export function NotificationFilters({
  filters,
  onFiltersChange,
}: NotificationFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof NotificationFiltersState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFiltersChange({
      search: "",
      type: "all",
      read: "all",
      dateRange: "all",
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  const activeFiltersCount = [
    filters.search !== "",
    filters.type !== "all",
    filters.read !== "all",
    filters.dateRange !== "all",
  ].filter(Boolean).length;

  const handleDateRangeChange = (value: string) => {
    const now = new Date();
    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    switch (value) {
      case "today":
        dateFrom = new Date(now.setHours(0, 0, 0, 0));
        dateTo = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "week":
        dateFrom = new Date(now.setDate(now.getDate() - 7));
        dateTo = new Date();
        break;
      case "month":
        dateFrom = new Date(now.setDate(now.getDate() - 30));
        dateTo = new Date();
        break;
      case "all":
        dateFrom = undefined;
        dateTo = undefined;
        break;
    }

    onFiltersChange({
      ...filters,
      dateRange: value as any,
      dateFrom,
      dateTo,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الإشعارات..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="ps-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="me-2 h-4 w-4" />
          تصفية
          {activeFiltersCount > 0 && (
            <Badge
              variant="default"
              className="ms-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={resetFilters}>
            <X className="me-2 h-4 w-4" />
            مسح
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
          {/* Type Filter */}
          <div className="space-y-2">
            <Label>النوع</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => updateFilter("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {notificationTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Read Status Filter */}
          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select
              value={filters.read}
              onValueChange={(value) => updateFilter("read", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="unread">غير مقروء</SelectItem>
                <SelectItem value="read">مقروء</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <Label>النطاق الزمني</Label>
            <Select
              value={filters.dateRange}
              onValueChange={handleDateRangeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الوقت</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر 7 أيام</SelectItem>
                <SelectItem value="month">آخر 30 يوماً</SelectItem>
                <SelectItem value="custom">نطاق مخصص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label>ترتيب حسب</Label>
            <div className="flex gap-2">
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilter("sortBy", value)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">التاريخ</SelectItem>
                  <SelectItem value="read">الحالة</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.sortOrder}
                onValueChange={(value) => updateFilter("sortOrder", value)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓</SelectItem>
                  <SelectItem value="asc">↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range Picker */}
          {filters.dateRange === "custom" && (
            <div className="col-span-full space-y-2">
              <Label>نطاق تاريخ مخصص</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-start font-normal"
                    >
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {filters.dateFrom
                        ? format(filters.dateFrom, "PPP")
                        : "من تاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom}
                      onSelect={(date) => updateFilter("dateFrom", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-start font-normal"
                    >
                      <CalendarIcon className="me-2 h-4 w-4" />
                      {filters.dateTo
                        ? format(filters.dateTo, "PPP")
                        : "إلى تاريخ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo}
                      onSelect={(date) => updateFilter("dateTo", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
