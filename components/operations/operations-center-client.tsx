"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Headset,
  MessageSquare,
  RefreshCw,
  Ticket,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { StatsGrid, type StatConfig } from "@/components/shared/stats-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/loading";
import { PanelCardTitle } from "@/components/ui/panel-form";
import { useOperationsCenter } from "@/hooks/useOperationsCenter";
import { formatOperationsDuration } from "@/lib/operations/format-duration";
import type {
  ActivityFeedItem,
  OperationsAlert,
  ServiceHealthItem,
} from "@/lib/operations/types";
import { AR_LOCALE } from "@/lib/strings";
import { cn } from "@/lib/utils";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(AR_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(AR_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function alertStyles(severity: OperationsAlert["severity"]) {
  switch (severity) {
    case "critical":
      return "border-destructive/40 bg-destructive/5 text-destructive";
    case "warning":
      return "border-warning/40 bg-warning/10 text-warning-foreground";
    default:
      return "border-info/30 bg-info/5 text-foreground";
  }
}

function healthStyles(status: ServiceHealthItem["status"]) {
  switch (status) {
    case "healthy":
      return "bg-success/15 text-success";
    case "degraded":
      return "bg-warning/15 text-warning-foreground";
    case "down":
      return "bg-destructive/15 text-destructive";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function healthLabel(status: ServiceHealthItem["status"]) {
  switch (status) {
    case "healthy":
      return "يعمل";
    case "degraded":
      return "متدهور";
    case "down":
      return "متوقف";
    default:
      return "غير معروف";
  }
}

function ActivityIcon({ type }: { type: ActivityFeedItem["type"] }) {
  switch (type) {
    case "guest_chat":
      return <Headset className="h-4 w-4" />;
    case "ai_escalation":
      return <Bot className="h-4 w-4" />;
    case "ticket_created":
    case "ticket_assigned":
    case "ticket_status":
      return <Ticket className="h-4 w-4" />;
    default:
      return <MessageSquare className="h-4 w-4" />;
  }
}

function OperationsAlerts({ alerts }: { alerts: OperationsAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>لا توجد تنبيهات تشغيلية حرجة الآن — الوضع مستقر.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-start justify-between gap-3 rounded-xl border px-4 py-3",
            alertStyles(alert.severity)
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold">{alert.title}</p>
            <p className="mt-0.5 text-xs opacity-90">{alert.message}</p>
          </div>
          {alert.href && (
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href={alert.href}>عرض</Link>
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

function ServiceHealthPanel({ items }: { items: ServiceHealthItem[] }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
        <PanelCardTitle icon={<Activity className="h-4 w-4 text-primary" />}>
          صحة المنصة
        </PanelCardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </div>
            <Badge className={cn("shrink-0", healthStyles(item.status))}>
              {healthLabel(item.status)}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActivityFeedPanel({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
        <PanelCardTitle icon={<Clock className="h-4 w-4 text-info" />}>
          النشاط المباشر
        </PanelCardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا يوجد نشاط حديث
          </p>
        ) : (
          <div className="max-h-[420px] space-y-2 overflow-y-auto pe-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border/45 px-3 py-2.5"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                  <ActivityIcon type={item.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                  {item.actorName && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {item.actorName}
                    </p>
                  )}
                </div>
                {item.href && (
                  <Button asChild variant="ghost" size="sm" className="shrink-0">
                    <Link href={item.href}>فتح</Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OperationsCenterClient({ userId }: { userId: string }) {
  const { snapshot, loading, refreshing, error, isConnected, refresh } =
    useOperationsCenter(userId);

  if (loading && !snapshot) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error && !snapshot) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">{error}</p>
        <Button className="mt-4" variant="outline" onClick={() => void refresh()}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  if (!snapshot) return null;

  const liveStats: StatConfig[] = [
    {
      title: "محادثات مباشرة",
      value: snapshot.conversations.live,
      description: `${snapshot.conversations.claimed} مستلمة`,
      icon: Headset,
    },
    {
      title: "بانتظار الاستلام",
      value: snapshot.conversations.waiting,
      description:
        snapshot.conversations.highPriorityWaiting > 0
          ? `${snapshot.conversations.highPriorityWaiting} أولوية مرتفعة`
          : "في قائمة الانتظار",
      icon: Clock,
    },
    {
      title: "موظفون متصلون",
      value: `${snapshot.agents.onlineCount}/${snapshot.agents.totalStaff}`,
      description: "فريق الدعم الآن",
      icon: Users,
    },
    {
      title: "تذاكر نشطة",
      value: snapshot.tickets.active,
      description: `${snapshot.tickets.unassigned} غير مُعيَّنة`,
      icon: Ticket,
    },
  ];

  const todayStats: StatConfig[] = [
    {
      title: "تذاكر جديدة اليوم",
      value: snapshot.tickets.newToday,
      icon: Ticket,
    },
    {
      title: "تذاكر محلولة اليوم",
      value: snapshot.tickets.resolvedToday,
      icon: CheckCircle2,
    },
    {
      title: "أول رد (اليوم)",
      value: formatOperationsDuration(snapshot.responseTimes.avgFirstResponseMinutes),
      description: `${snapshot.responseTimes.sampleSize} عينة`,
      icon: Clock,
    },
    {
      title: "متوسط الرد (7 أيام)",
      value: formatOperationsDuration(snapshot.responseTimes.avgResponseMinutes),
      icon: Activity,
    },
  ];

  const queueStats: StatConfig[] = [
    {
      title: "متوسط الانتظار",
      value: formatOperationsDuration(snapshot.conversations.avgWaitMinutes),
      icon: Clock,
    },
    {
      title: "أطول انتظار",
      value: formatOperationsDuration(snapshot.conversations.maxWaitMinutes),
      icon: AlertTriangle,
    },
    {
      title: "عاجلة",
      value: snapshot.tickets.urgent,
      description: "تذاكر عاجلة مفتوحة",
      icon: AlertTriangle,
    },
    {
      title: "محادثات اليوم",
      value: snapshot.conversations.closedToday + snapshot.ai.liveChatsToday,
      description: `${snapshot.ai.liveChatsToday} جديدة`,
      icon: MessageSquare,
    },
  ];

  const aiStats: StatConfig[] = [
    {
      title: "جلسات AI اليوم",
      value: snapshot.ai.sessionsToday,
      icon: Bot,
    },
    {
      title: "AI بدون تصعيد",
      value: snapshot.ai.aiAssistedToday,
      description: `${snapshot.ai.aiMatchRateToday}% نسبة مطابقة`,
      icon: Bot,
    },
    {
      title: "تصعيدات AI",
      value: snapshot.ai.escalatedToday,
      icon: AlertTriangle,
    },
    {
      title: "دعم بشري",
      value: snapshot.ai.humanAssistedToday,
      description: "محادثات + تصعيدات + حلول",
      icon: Headset,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium",
              isConnected
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isConnected ? "متصل — تحديث مباشر" : "غير متصل — تحديث دوري"}
          </span>
          {refreshing && (
            <span className="inline-flex items-center gap-1">
              <RefreshCw className="h-3 w-3 animate-spin" />
              جاري التحديث…
            </span>
          )}
          <span>آخر تحديث: {formatDateTime(snapshot.generatedAt)}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refresh({ background: true })}
          disabled={refreshing}
        >
          <RefreshCw className={cn("me-1.5 h-3.5 w-3.5", refreshing && "animate-spin")} />
          تحديث
        </Button>
      </div>

      <OperationsAlerts alerts={snapshot.alerts} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">الوضع الآن</h2>
        <StatsGrid stats={liveStats} className="lg:grid-cols-4" />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">أداء اليوم</h2>
            <StatsGrid stats={todayStats} className="lg:grid-cols-4" />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">قائمة المحادثات</h2>
            <StatsGrid stats={queueStats} className="lg:grid-cols-4" />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">AI مقابل الدعم البشري</h2>
            <StatsGrid stats={aiStats} className="lg:grid-cols-4" />
          </section>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-3">
              <PanelCardTitle icon={<Users className="h-4 w-4 text-primary" />}>
                عبء العمل والأداء
              </PanelCardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto pt-4">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-xs text-muted-foreground">
                    <th className="pb-2 text-start font-medium">الموظف</th>
                    <th className="pb-2 text-center font-medium">الحالة</th>
                    <th className="pb-2 text-center font-medium">تذاكر مفتوحة</th>
                    <th className="pb-2 text-center font-medium">محادثات</th>
                    <th className="pb-2 text-center font-medium">محلولة اليوم</th>
                    <th className="pb-2 text-center font-medium">العبء</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.agents.rows.map((agent) => {
                    const workload = agent.openTickets + agent.claimedChats;
                    return (
                      <tr key={agent.userId} className="border-b border-border/30">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={undefined} />
                              <AvatarFallback className="text-[10px]">
                                {agent.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{agent.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {agent.role === "admin" ? "مدير" : "دعم"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              agent.online
                                ? "border-success/40 bg-success/10 text-success"
                                : "text-muted-foreground"
                            )}
                          >
                            {agent.online ? "متصل" : "غير متصل"}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-center">{agent.openTickets}</td>
                        <td className="py-2.5 text-center">{agent.claimedChats}</td>
                        <td className="py-2.5 text-center">{agent.resolvedToday}</td>
                        <td className="py-2.5 text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              workload >= 8
                                ? "border-destructive/40 text-destructive"
                                : workload >= 4
                                  ? "border-warning/40 text-warning-foreground"
                                  : ""
                            )}
                          >
                            {workload}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <ServiceHealthPanel items={snapshot.serviceHealth} />
          <ActivityFeedPanel items={snapshot.activityFeed} />
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">اختصارات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/messages">
                  <Headset className="me-2 h-4 w-4" />
                  صندوق المحادثات
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/tickets">
                  <Ticket className="me-2 h-4 w-4" />
                  جميع التذاكر
                </Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/ai-support-agent">
                  <Bot className="me-2 h-4 w-4" />
                  تحليلات المساعد الذكي
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
