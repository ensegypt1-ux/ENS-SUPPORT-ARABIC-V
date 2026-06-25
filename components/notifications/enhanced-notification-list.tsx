"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  MessageSquare,
  Ticket,
  CheckCircle,
  UserPlus,
  Calendar,
  CalendarX,
  Download,
  Wrench,
  MessageCircle,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { Notification } from "@/types";
import {
  NotificationFilters,
  type NotificationFiltersState,
} from "./notification-filters";
import {
  bulkMarkAsRead,
  bulkMarkAsUnread,
  bulkDeleteNotifications,
  deleteAllReadNotifications,
  getNotifications,
  getNotificationStats,
  markNotificationAsRead,
} from "@/lib/notifications";

// Type for notification with string _id (converted from ObjectId)
type NotificationWithStringId = Omit<Notification, "_id"> & { _id: string };

interface EnhancedNotificationListProps {
  userId: string;
  basePath: string; // e.g., "/dashboard/notifications" or "/admin/notifications"
}

const notificationIcons: Record<string, LucideIcon> = {
  new_message: MessageSquare,
  new_ticket: Ticket,
  ticket_status: CheckCircle,
  ticket_assignment: UserPlus,
  meeting_scheduled: Calendar,
  meeting_cancelled: CalendarX,
  installation_status: Download,
  customization_status: Wrench,
  comment: MessageCircle,
};

const notificationColors: Record<string, string> = {
  new_message: "text-blue-500",
  new_ticket: "text-purple-500",
  ticket_status: "text-green-500",
  ticket_assignment: "text-orange-500",
  meeting_scheduled: "text-indigo-500",
  meeting_cancelled: "text-red-500",
  installation_status: "text-cyan-500",
  customization_status: "text-pink-500",
  comment: "text-teal-500",
};

export function EnhancedNotificationList({
  userId,
  basePath,
}: EnhancedNotificationListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [notifications, setNotifications] = useState<
    NotificationWithStringId[]
  >([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [stats, setStats] = useState({ total: 0, unread: 0, read: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });

  // Filters
  const [filters, setFilters] = useState<NotificationFiltersState>({
    search: searchParams.get("search") || "",
    type:
      (searchParams.get("type") as NotificationFiltersState["type"]) || "all",
    read:
      (searchParams.get("read") as NotificationFiltersState["read"]) || "all",
    dateRange: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const loadNotifications = useCallback(
    async (page: number = 1) => {
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }
      setLoadError(null);

      try {
        const [notificationResult, statsResult] = await Promise.all([
          getNotifications({
            userId,
            page,
            limit: pagination.limit,
            type: filters.type !== "all" ? filters.type : undefined,
            read: filters.read === "all" ? undefined : filters.read === "read",
            search: filters.search || undefined,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          }),
          getNotificationStats(userId),
        ]);

        if (notificationResult.success && notificationResult.notifications) {
          setNotifications(
            notificationResult.notifications as NotificationWithStringId[]
          );
          setPagination(notificationResult.pagination!);
          hasLoadedRef.current = true;
        } else {
          setLoadError("تعذّر تحميل الإشعارات");
        }

        if (statsResult.success && statsResult.stats) {
          setStats(statsResult.stats);
        }
      } catch {
        setLoadError("تعذّر تحميل الإشعارات");
        toast.error("تعذّر تحميل الإشعارات");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit, userId]
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    void loadNotifications(1);
  }, [loadNotifications]);

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n._id.toString())));
    }
  };

  // Bulk actions
  const handleBulkMarkAsRead = async () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      const result = await bulkMarkAsRead(Array.from(selectedIds), userId);
      if (result.success) {
        toast.success(`تم التعليم ${result.count} إشعار مقروء`);
        setSelectedIds(new Set());
        loadNotifications(pagination.page);
      } else {
        toast.error("تعذّر تعليم الإشعارات مقروءة");
      }
    });
  };

  const handleBulkMarkAsUnread = async () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      const result = await bulkMarkAsUnread(Array.from(selectedIds), userId);
      if (result.success) {
        toast.success(`تم التعليم ${result.count} إشعار غير مقروءة`);
        setSelectedIds(new Set());
        loadNotifications(pagination.page);
      } else {
        toast.error("تعذّر تعليم الإشعارات غير مقروءةة");
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    startTransition(async () => {
      const result = await bulkDeleteNotifications(
        Array.from(selectedIds),
        userId
      );
      if (result.success) {
        toast.success(`تم الحذف ${result.count} إشعار`);
        setSelectedIds(new Set());
        loadNotifications(pagination.page);
      } else {
        toast.error("تعذّر حذف الإشعارات");
      }
    });
  };

  const handleDeleteAllRead = async () => {
    startTransition(async () => {
      const result = await deleteAllReadNotifications(userId);
      if (result.success) {
        toast.success(`تم الحذف ${result.count} إشعار مقروء`);
        setShowDeleteAllDialog(false);
        loadNotifications(1);
      } else {
        toast.error("تعذّر حذف الإشعارات المقروءة");
      }
    });
  };

  // Navigation
  const handleNotificationClick = async (
    notification: NotificationWithStringId
  ) => {
    if (!notification.read) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      await markNotificationAsRead(notification._id, userId);
    }
    router.push(`${basePath}/${notification._id}`);
  };

  const handlePageChange = (newPage: number) => {
    loadNotifications(newPage);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">الإشعارات</h1>
            <p className="text-muted-foreground mt-1">
              {stats.unread > 0 ? (
                <>
                  لديك{" "}
                  <span className="font-semibold text-primary">
                    {stats.unread}
                  </span>{" "}
                  {stats.unread === 1
                    ? "إشعار غير مقروء"
                    : "إشعارات غير مقروءة"}{" "}
                  من أصل {stats.total}
                </>
              ) : (
                <>
                  خلصت كل الإشعارات! ({stats.total} إشعاراً إجمالاً)
                </>
              )}
            </p>
          </div>
          {stats.read > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(true)}
              disabled={isPending}
            >
              <Trash2 className="me-2 h-4 w-4" />
              مسح جميع المقروءة
            </Button>
          )}
        </div>

        {/* Filters */}
        <NotificationFilters filters={filters} onFiltersChange={setFilters} />

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <Card className="bg-muted/50">
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1 ? "إشعار" : "إشعارات"} محددة
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkMarkAsRead}
                    disabled={isPending}
                  >
                    <Check className="me-2 h-4 w-4" />
                    تحديد كمقروء
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkMarkAsUnread}
                    disabled={isPending}
                  >
                    <X className="me-2 h-4 w-4" />
                    تحديد كغير مقروء
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={isPending}
                  >
                    <Trash2 className="me-2 h-4 w-4" />
                    حذف
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loadError && notifications.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-sm font-medium">{loadError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => void loadNotifications(1)}
              >
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                لا يوجد إشعارات
              </h3>
              <p className="text-muted-foreground">
                {filters.search ||
                filters.type !== "all" ||
                filters.read !== "all"
                  ? "جرّب تعديل عوامل التصفية"
                  : "لا يوجد إشعارات لا تزال"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={
                  selectedIds.size === notifications.length &&
                  notifications.length > 0
                }
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                تحديد الكل في هذه الصفحة
              </span>
            </div>

            {/* Notification Items */}
            <div className="space-y-3">
              {notifications.map((notification) => {
                const Icon =
                  notificationIcons[notification.type] || MessageCircle;
                const iconColor =
                  notificationColors[notification.type] || "text-gray-500";
                const isSelected = selectedIds.has(notification._id.toString());

                return (
                  <Card
                    key={notification._id.toString()}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      !notification.read ? "border-s-4 border-s-primary" : ""
                    } ${isSelected ? "bg-muted/50" : ""}`}
                  >
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleSelect(notification._id.toString())
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className="flex-1 flex items-start gap-4"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div
                            className={`rounded-full p-2 bg-muted ${iconColor}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm mb-1 truncate">
                                  {notification.title}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {notification.body}
                                </p>
                              </div>
                              {!notification.read && (
                                <Badge variant="default" className="shrink-0">
                                  جديد
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(
                                new Date(notification.sentAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  عرض {(pagination.page - 1) * pagination.limit + 1} إلى{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  من {pagination.total} إشعار
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || isPending}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    السابق
                  </Button>
                  <span className="text-sm">
                    صفحة {pagination.page} من {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={
                      pagination.page === pagination.totalPages || isPending
                    }
                  >
                    التالي
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete All Read Dialog */}
      <AlertDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف جميع الإشعارات المقروءة؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتمسح {stats.read} إشعار مقروء نهائي — لن تتمكن من الاسترجاع.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllRead}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف جميع المقروءة"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
