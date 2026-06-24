import {
  MessageSquare,
  XCircle,
  TrendingUp,
  ThumbsUp,
  Globe2,
} from "lucide-react";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PanelCardHeading } from "@/components/ui/panel-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getChatbotAnalytics,
  getUnansweredQuestions,
  getRecentChatLogs,
  getDomainAccuracyStats,
} from "@/actions/ai-chat";

function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("ar-SA");
}

function formatPercent(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

export async function ChatLogsPanel() {
  const [analyticsResult, unansweredResult, recentResult, domainResult] =
    await Promise.all([
      getChatbotAnalytics(),
      getUnansweredQuestions(15),
      getRecentChatLogs(30),
      getDomainAccuracyStats(20),
    ]);

  if (!analyticsResult.success || !analyticsResult.data) {
    return (
      <p className="text-sm text-destructive">
        {analyticsResult.error ?? "تعذّر التحميل تحليلات المحادثة"}
      </p>
    );
  }

  const a = analyticsResult.data;
  const stats = [
    {
      title: "إجمالي المحادثات",
      value: a.total,
      icon: MessageSquare,
      iconColor: "text-info",
      iconBgColor: "bg-info/15",
      description: `${a.last24h} خلال آخر 24 ساعة`,
    },
    {
      title: "معدل المطابقة",
      value: `${a.matchRate}%`,
      icon: TrendingUp,
      iconColor: "text-primary",
      iconBgColor: "bg-primary/15",
      description: `${a.matched} تمت الإجابة عليها`,
    },
    {
      title: "دقة التقييم",
      value: formatPercent(a.feedbackAccuracy),
      icon: ThumbsUp,
      iconColor: "text-success",
      iconBgColor: "bg-success/15",
      description:
        a.feedbackTotal === 0
          ? "مفيش إجابات مُقيّمة بعد"
          : `${a.positiveFeedback}/${a.feedbackTotal} مفيدة`,
    },
    {
      title: "اتصعّد",
      value: a.escalated,
      icon: XCircle,
      iconColor: "text-destructive",
      iconBgColor: "bg-destructive/15",
      description: `${a.unmatched} بلا إجابة · طُلب التحويل`,
    },
  ];

  const unanswered = unansweredResult.success ? unansweredResult.data ?? [] : [];
  const recent = recentResult.success ? recentResult.data ?? [] : [];
  const domains = domainResult.success ? domainResult.data ?? [] : [];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <StatsGrid stats={stats} />

      <Card>
        <CardHeader>
          <PanelCardHeading
            title="دقة الرد حسب النطاق"
            icon={<Globe2 className="h-4 w-4 text-primary" />}
            description="معدل المطابقة مع تقييم العملاء، مجمّعاً حسب الموقع المُحدّد والنطاق المضيف."
          />
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              تظهر دقة النطاق بمجرد أن يبدأ الزوار باستخدام الأداة.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الموقع / النطاق</TableHead>
                  <TableHead className="w-24 text-end">المحادثات</TableHead>
                  <TableHead className="w-28 text-end">المطابقة</TableHead>
                  <TableHead className="w-32 text-end">الدقة</TableHead>
                  <TableHead className="w-28 text-end">المُصعَّد</TableHead>
                  <TableHead className="w-44">آخر ظهور</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d) => (
                  <TableRow key={d.key}>
                    <TableCell className="max-w-md">
                      <p className="truncate text-sm font-medium">
                        {d.siteName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {d.host ?? "لم يُسجَّل مضيف"}
                      </p>
                    </TableCell>
                    <TableCell className="text-end text-sm">
                      {d.total}
                    </TableCell>
                    <TableCell className="text-end text-sm">
                      {d.matchRate}%
                    </TableCell>
                    <TableCell className="text-end text-sm">
                      {formatPercent(d.feedbackAccuracy)}
                    </TableCell>
                    <TableCell className="text-end text-sm">
                      {d.escalated}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(d.lastSeen)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelCardHeading
            title="أبرز الأسئلة بلا إجابة"
            description="أسئلة طرحها الزوار ولم تطابق أي زوج تدريب. استخدمها لتوسيع قاعدة المعرفة."
          />
        </CardHeader>
        <CardContent>
          {unanswered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              لا شيء هنا بعد — ستظهر الأسئلة غير المُجاب عليها بمجرد أن يبدأ
              الزوار بالمحادثة.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>السؤال</TableHead>
                  <TableHead className="w-20 text-end">العدد</TableHead>
                  <TableHead className="w-44">آخر ظهور</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unanswered.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-md truncate text-sm">
                      {u.question}
                    </TableCell>
                    <TableCell className="text-end text-sm font-medium">
                      {u.count}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.lastSeen)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelCardHeading
            title="المحادثات الأخيرة"
            description="آخر 30 تفاعل مع روبوت المحادثة."
          />
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              مفيش سجلات محادثة بعد.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>السؤال</TableHead>
                  <TableHead className="w-40">النطاق</TableHead>
                  <TableHead className="w-40">النتيجة</TableHead>
                  <TableHead className="w-28">التقييم</TableHead>
                  <TableHead className="w-20 text-end">الخطوات</TableHead>
                  <TableHead className="w-44">الوقت</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="max-w-md truncate text-sm">
                      {r.question}
                    </TableCell>
                    <TableCell className="max-w-40 truncate text-xs text-muted-foreground">
                      {r.host ?? (r.siteId ? "مقيّد بالموقع" : "عام / التطبيق")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          r.outcome === "escalated_ticket"
                            ? "border-destructive/40 bg-destructive/10 text-destructive"
                            : r.outcome === "no_answer"
                              ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                              : "border-success/40 bg-success/10 text-success"
                        }
                      >
                        {r.outcome.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.feedback ? (
                        <Badge
                          variant="outline"
                          className={
                            r.feedback === "up"
                              ? "border-success/40 bg-success/10 text-success"
                              : "border-destructive/40 bg-destructive/10 text-destructive"
                          }
                        >
                          {r.feedback === "up" ? "مفيد" : "غير مفيد"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-end text-sm">
                      {r.iterations ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
