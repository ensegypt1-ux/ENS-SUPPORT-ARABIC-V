import { Fragment } from "react";
import type { LucideIcon } from "lucide-react";
import {
  MessageSquare,
  ShieldCheck,
  Wrench,
  GitBranch,
  CheckCircle2,
  UserPlus,
  Users,
  Filter,
  Scale,
  Shuffle,
  Building2,
  Bell,
  RefreshCw,
  Sparkles,
  BookOpen,
  Database,
  LifeBuoy,
  ArrowRight,
  CircleSlash,
  Ticket,
  SlidersHorizontal,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface HowItWorksPanelProps {
  maxIterations: number;
  rateLimitPerMinute: number;
  ticketRateLimitPerHour: number;
  indexResolvedTickets: boolean;
  confidenceThreshold: number;
  agentEnabled: boolean;
  chatbotEnabled: boolean;
}

type Tone = "primary" | "info" | "success" | "destructive" | "muted";

const tone: Record<Tone, { text: string; bg: string; ring: string }> = {
  primary: {
    text: "text-primary",
    bg: "bg-primary/10",
    ring: "ring-primary/20",
  },
  info: { text: "text-info", bg: "bg-info/10", ring: "ring-info/20" },
  success: {
    text: "text-success",
    bg: "bg-success/10",
    ring: "ring-success/20",
  },
  destructive: {
    text: "text-destructive",
    bg: "bg-destructive/10",
    ring: "ring-destructive/20",
  },
  muted: {
    text: "text-muted-foreground",
    bg: "bg-muted",
    ring: "ring-border",
  },
};

function StepNode({
  index,
  icon: Icon,
  color = "primary",
  title,
  children,
  isLast = false,
}: {
  index: number;
  icon: LucideIcon;
  color?: Tone;
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}) {
  const t = tone[color];
  return (
    <div className="relative flex gap-4" dir="rtl">
      <div className="flex flex-col items-center">
        <div
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${t.bg} ${t.ring}`}
        >
          <Icon className={`h-5 w-5 ${t.text}`} />
          <span
            className={`absolute -start-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] font-bold ring-1 ${t.ring} ${t.text}`}
          >
            {index}
          </span>
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-border" />}
      </div>
      <div className={`min-w-0 flex-1 text-right ${isLast ? "pb-1" : "pb-7"}`}>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <div className="mt-1.5 space-y-2 text-sm text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function ToolRow({
  icon: Icon,
  name,
  source,
  desc,
  color,
}: {
  icon: LucideIcon;
  name: string;
  source: string;
  desc: string;
  color: Tone;
}) {
  const t = tone[color];
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-right"
      dir="rtl"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.bg}`}
      >
        <Icon className={`h-4 w-4 ${t.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
            {name}
          </code>
          <span className="text-xs text-muted-foreground">← {source}</span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {desc}
        </p>
      </div>
    </div>
  );
}

function AgentChip({
  name,
  dept,
  load,
  maxLoad,
  chosen,
  tied,
}: {
  name: string;
  dept: string;
  load: number;
  maxLoad: number;
  chosen?: boolean;
  tied?: boolean;
}) {
  const pct = Math.round((load / maxLoad) * 100);
  return (
    <div
      className={`rounded-xl border p-3 text-right transition-colors ${
        chosen
          ? "border-success/40 bg-success/5 ring-1 ring-success/30"
          : "border-border bg-card"
      }`}
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {chosen && (
            <Badge className="bg-success/15 text-success hover:bg-success/15">
              اتعيّن
            </Badge>
          )}
          {tied && !chosen && (
            <Badge variant="secondary" className="text-[11px]">
              تعادل
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div>
            <p className="text-xs font-semibold leading-none text-foreground">
              {name}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{dept}</p>
          </div>
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
              chosen
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {name.charAt(0)}
          </div>
        </div>
      </div>
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{load}</span>
          <span>تذاكر نشطة</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full ${
              chosen ? "bg-success" : "bg-muted-foreground/40"
            }`}
            style={{ width: `${pct}%`, marginInlineStart: "auto" }}
          />
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  icon: Icon,
  color = "primary",
  eyebrow,
  title,
  description,
}: {
  icon: LucideIcon;
  color?: Tone;
  eyebrow: string;
  title: string;
  description: string;
}) {
  const t = tone[color];
  return (
    <div className="flex items-start gap-3 text-right" dir="rtl">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.bg}`}
      >
        <Icon className={`h-5 w-5 ${t.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-semibold ${t.text}`}>{eyebrow}</p>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function HowItWorksPanel({
  maxIterations,
  rateLimitPerMinute,
  ticketRateLimitPerHour,
  indexResolvedTickets,
  confidenceThreshold,
  agentEnabled,
  chatbotEnabled,
}: HowItWorksPanelProps) {
  const live = agentEnabled && chatbotEnabled;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-linear-to-br from-primary/5 via-transparent to-info/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                <h2 className="text-xl font-bold text-foreground">
                  كيف يعمل وكيل الدعم الذكي
                </h2>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                الوكيل روبوت محادثة مستقل يجيب الزوار باستخدام{" "}
                <strong className="text-foreground">معرفتكم فقط</strong> — دون
                اختلاق معلومات. عندما لا يستطيع حل المشكلة، يطلب الإذن لتسليم
                المحادثة لموظف بشري ويوجّه التذكرة تلقائياً إلى أقل موظف
                مشغول في القسم المناسب.
              </p>
            </div>
            <Badge
              className={
                live
                  ? "bg-success/15 text-success hover:bg-success/15"
                  : "bg-muted text-muted-foreground hover:bg-muted"
              }
            >
              <span
                className={`me-1.5 inline-block h-2 w-2 rounded-full ${
                  live ? "bg-success" : "bg-muted-foreground"
                }`}
              />
              {live ? "الوكيل يعمل" : "الوكيل متوقف"}
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                color: "info" as Tone,
                title: "إجابات من بياناتكم",
                desc: "أزواج أسئلة وأجوبة، قاعدة المعرفة، الخدمات والتذاكر السابقة",
              },
              {
                icon: LifeBuoy,
                color: "primary" as Tone,
                title: "تصعيد للبشر",
                desc: "فقط بموافقة الزائر — وليس بصمت",
              },
              {
                icon: Scale,
                color: "success" as Tone,
                title: "توازن عبء العمل",
                desc: "يوجّه التذاكر الجديدة إلى أقل موظف مشغول",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-xl border border-border bg-card/60 p-3 text-right"
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone[c.color].bg}`}
                >
                  <c.icon className={`h-4 w-4 ${tone[c.color].text}`} />
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {c.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {c.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <CardContent className="bg-muted/20 pb-6">
          <p className="flex items-start gap-2 text-right text-xs leading-relaxed text-muted-foreground">
            <SlidersHorizontal className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong className="text-foreground">قابل للضبط بالكامل —</strong>{" "}
              غير مرتبط بنموذج واحد. يعمل الوكيل مع أي نموذج محادثة وتضمين
              تربطونه (مزوّد مستضاف أو نموذج ذاتي الاستضافة)، وحدود المعدل
              وعمق التفكير وعتبة الثقة الموضّحة هنا هي قيمكم الحالية فقط. غيّروا
              أيّاً منها في أي وقت من تبويب{" "}
              <strong className="text-foreground">الإعدادات</strong>.
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle
            icon={MessageSquare}
            color="info"
            eyebrow="المرحلة ١"
            title="حلقة المحادثة"
            description="ما يحدث من لحظة إرسال الزائر رسالة في الأداة."
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col">
            <StepNode
              index={1}
              icon={MessageSquare}
              color="info"
              title="الزائر يطرح سؤالاً"
            >
              <p>
                الزائر (ضيف أو عميل مسجّل) يكتب في أداة المحادثة. تُرسل سجل
                المحادثة الأخير ليتمتع الوكيل بالسياق.
              </p>
            </StepNode>

            <StepNode
              index={2}
              icon={ShieldCheck}
              color="muted"
              title="ضوابط الأمان"
            >
              <p>
                تُرفض الطلبات ما لم تكن أداة المحادثة مفعّلة وحدود المعدل
                تسمح بذلك.
              </p>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Badge variant="secondary">
                  {rateLimitPerMinute} محادثة / دقيقة لكل زائر
                </Badge>
                <Badge variant="secondary">
                  {ticketRateLimitPerHour} تذكرة / ساعة لكل زائر
                </Badge>
              </div>
            </StepNode>

            <StepNode
              index={3}
              icon={Wrench}
              color="primary"
              title={`حلقة الوكيل — يبحث في معرفتكم أولاً (حتى ${maxIterations} جولات)`}
            >
              <p>
                قبل الإجابة، يستدعي الوكيل أدوات قراءة فقط ليربط رده ببيانات
                حقيقية. يكرّر القراءة والبحث حتى يكفي أو تنفد الجولات.
              </p>
              <div className="grid gap-2 pt-1">
                <ToolRow
                  icon={Sparkles}
                  color="success"
                  name="lookup_faq"
                  source="أزواج أسئلة وأجوبة معتمدة"
                  desc={`إجابات مدقّقة. التطابق بدرجة ≥ ${confidenceThreshold.toFixed(
                    2,
                  )} يُعد واثقاً ويُستخدم شبه حرفي.`}
                />
                <ToolRow
                  icon={Database}
                  color="info"
                  name="search_knowledge"
                  source="مستندات وخدمات وأسئلة"
                  desc="بحث متجهي في قاعدة المعرفة عن المنتج والأسعار والميزات وكيفية الاستخدام."
                />
                <ToolRow
                  icon={Ticket}
                  color="primary"
                  name="search_resolved_tickets"
                  source="تذاكر محلولة سابقاً"
                  desc={
                    indexResolvedTickets
                      ? "استكشاف أخطاء من مشكلات حُلّت من قبل. مفعّل حالياً."
                      : "معطّل — التذاكر المحلولة مستبعدة من الفهرس (تحكم في البيانات الشخصية)."
                  }
                />
              </div>
            </StepNode>

            <StepNode
              index={4}
              icon={GitBranch}
              color="primary"
              title="القرار: حل أو تصعيد"
              isLast
            >
              <p>يذكر الوكيل حقائق جاءت من أداة فقط، ثم يتفرّع:</p>
              <div className="grid gap-2 pt-1 sm:grid-cols-2">
                <div className="rounded-lg border border-success/30 bg-success/5 p-3 text-right">
                  <div className="flex items-center justify-end gap-2 text-sm font-medium text-success">
                    <CheckCircle2 className="h-4 w-4" />
                    اتحلّ
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    يرد في ٢–٥ جمل ويسجّل النتيجة:{" "}
                    <code className="rounded bg-muted px-1 text-foreground">
                      answered_faq
                    </code>
                    ،{" "}
                    <code className="rounded bg-muted px-1 text-foreground">
                      answered_kb
                    </code>
                    ،{" "}
                    <code className="rounded bg-muted px-1 text-foreground">
                      answered_resolved_ticket
                    </code>{" "}
                    أو{" "}
                    <code className="rounded bg-muted px-1 text-foreground">
                      answered_general
                    </code>
                    .
                  </p>
                </div>
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-right">
                  <div className="flex items-center justify-end gap-2 text-sm font-medium text-primary">
                    <UserPlus className="h-4 w-4" />
                    لا يمكن الحل
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    <strong>لا</strong> ينشئ شيئاً. يسأل إن كان الزائر يريد
                    موظفاً. بعد الموافقة فقط يستدعي{" "}
                    <code className="rounded bg-muted px-1 text-foreground">
                      request_human_handoff
                    </code>
                    ، يختار أفضل قسم، ويفتح نموذج التذكرة.
                  </p>
                </div>
              </div>
            </StepNode>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle
            icon={Scale}
            color="success"
            eyebrow="المرحلة ٢"
            title="تعيين التذاكر تلقائياً"
            description="عند افتح تذكرة تصعيد، يختار هذا المسار موظف دعم واحداً بالضبط. منطق حتمي — وليس تخمين الذكاء الاصطناعي."
          />
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-3 text-right">
            <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">أولاً، الجسر:</strong> بعد
              الموافقة يفتح الوكيل نموذج اتصال قصير فقط.{" "}
              <strong className="text-foreground">
                الزائر يُرسل اسمه وبريده وتفاصيله
              </strong>
              ، وهذا الإرسال — وليس الذكاء الاصطناعي — هو ما ينشئ التذكرة مع
              القسم الذي صنّفه الوكيل. بعدها يعمل التوجيه أدناه.
            </p>
          </div>
          <div className="flex flex-col">
            <StepNode
              index={1}
              icon={Users}
              color="info"
              title="بناء مجموعة المرشحين"
            >
              <p>
                نبدأ بكل مستخدم دوره{" "}
                <code className="rounded bg-muted px-1 text-foreground">
                  support
                </code>
                .
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
                <CircleSlash className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>
                  إن لم يوجد موظفو دعم، تُنشأ التذكرة —{" "}
                  <strong>بدون تعيين</strong> — ويُبلّغ المسؤولون.
                </span>
              </div>
            </StepNode>

            <StepNode
              index={2}
              icon={Filter}
              color="info"
              title="تصفية حسب القسم المطابق"
            >
              <p>
                نُبقي فقط من{" "}
                <code className="rounded bg-muted px-1 text-foreground">
                  departmentSlugs
                </code>{" "}
                لديه القسم الذي صنّفه الوكيل.
              </p>
              <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-2.5 text-xs">
                <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" />
                <span>
                  <strong>بديل:</strong> إن لم يُصنَّف قسم (أو كان غير صالح)، أو
                  لا يغطيه أحد، تُتخطى التصفية ويُستخدم مجموعة الدعم كاملة —
                  لا تُترك تذكرة بدون تعيين لمجرد أن القسم بلا موظفين.
                </span>
              </div>
            </StepNode>

            <StepNode
              index={3}
              icon={ArrowRight}
              color="muted"
              title="اختصار لمرشح واحد"
            >
              <p>
                إن بقي موظف واحد فقط، يُعيَّن فوراً — دون حساب عبء عمل.
              </p>
            </StepNode>

            <StepNode
              index={4}
              icon={Building2}
              color="primary"
              title="عدّ عبء كل مرشح الحي"
            >
              <p>
                لكل مرشح، نعدّ{" "}
                <strong className="text-foreground">النشطة</strong> من أربعة
                أنواع طلبات:
              </p>
              <div className="flex flex-wrap justify-end gap-1.5 pt-1">
                {[
                  "tickets",
                  "installation_requests",
                  "customization_requests",
                  "service_requests",
                ].map((c) => (
                  <code
                    key={c}
                    className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground"
                  >
                    {c}
                  </code>
                ))}
              </div>
              <p className="pt-1">&laquo;نشطة&raquo; تعني الحالة:</p>
              <div className="flex flex-wrap justify-end gap-1.5">
                {[
                  "open",
                  "scheduled_meeting",
                  "in_progress",
                  "waiting_on_customer",
                ].map((s) => (
                  <Badge key={s} variant="secondary" className="text-[11px]">
                    {s}
                  </Badge>
                ))}
              </div>
              <p className="pt-1 text-xs">
                المحلولة والمغلقة لا تُحسب — إفراغ قائمتكم يحرّر سعة لتعيينات
                جديدة.
              </p>
            </StepNode>

            <StepNode
              index={5}
              icon={Shuffle}
              color="success"
              title="الأقل حملاً يفوز (تعادل عشوائي)"
              isLast
            >
              <p>
                يحصل المرشح بـ<strong>أقل تذاكر نشطة</strong> على التذكرة. إن
                تعادل عدة مرشحين عند الحد الأدنى، يُختار واحد{" "}
                <strong>عشوائياً</strong> بينهم.
              </p>
            </StepNode>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle
            icon={Scale}
            color="success"
            eyebrow="النسبة والتسلسل"
            title="كيف تُوزَّع التذاكر"
            description="السؤال الأكثر شيوعاً: هل بالتناوب أم بنسبة ثابتة؟ لا هذا ولا ذاك."
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-right">
              <p className="text-sm font-semibold text-success">
                ✓ توازن حسب الأقل حملاً
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                كل تذكرة لمن لديه أصغر قائمة انتظار حية الآن.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-right">
              <p className="text-sm font-semibold text-muted-foreground line-through decoration-destructive/60">
                نسبة ثابتة (مثلاً ٦٠/٤٠)
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                لا نسب مُحدَّدة مسبقاً. التوزيع يظهر من سرعة إغلاق التذاكر.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-right">
              <p className="text-sm font-semibold text-muted-foreground line-through decoration-destructive/60">
                تناوب دائري
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                لا مؤشر &laquo;التالي في الدور&raquo; — كل قرار يُحسب من الحمل
                الحالي.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4 text-right">
            <div className="flex items-center justify-end gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">
                مثال عملي — تذكرة &laquo;الفوترة&raquo; جديدة
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              ثلاثة موظفين يغطون الفوترة. الأقل عدّاً نشطاً يفوز؛ ب و ج
              متعادلان عند ١، فيُختار بينهما بالقرعة.
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              <AgentChip name="آدا" dept="الفوترة" load={3} maxLoad={3} />
              <AgentChip
                name="بولا"
                dept="الفوترة"
                load={1}
                maxLoad={3}
                chosen
              />
              <AgentChip
                name="شيدي"
                dept="الفوترة"
                load={1}
                maxLoad={3}
                tied
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              مع كثرة التذاكر تتقارب القوائم، لكن التوازن يصحّح نفسه لمن هو
              فعلاً متاح — وليس جدولاً ثابتاً.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-right">
            <CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <strong className="text-foreground">تحذير التزامن:</strong> يُقرأ
              العبء قبل إدراج التذكرة دون قفل. إن اُنشئت عدة تذاكر في لحظة
              واحدة، قد يرى الجميع نفس الأقل حملاً ويتراكموا على شخص واحد.
              التوازن يفترض فترات معقولة بين التعيينات.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle
            icon={Bell}
            color="primary"
            eyebrow="المرحلة ٣"
            title="بعد إنشاء التذكرة"
            description="كل ما يُفعَّل تلقائياً بعد اختيار التوجيه."
          />
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <span>— يمكن لموظف إعادة الأولوية أو إعادة التعيين في أي وقت.</span>
            <Badge variant="secondary" className="text-[11px]">
              tag: auto-assigned
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              priority: medium
            </Badge>
            <Badge variant="secondary" className="text-[11px]">
              status: open
            </Badge>
            <span className="font-medium text-foreground">
              تُنشأ التذكرة بـ:
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              {
                icon: Bell,
                title: "إشعارات داخل التطبيق",
                desc: "الموظف المعيّن وجميع المسؤولين يتلقون إشعار تذكرة جديدة برابط مباشر.",
              },
              {
                icon: MessageSquare,
                title: "بريد تأكيد",
                desc: "العميل يتلقى بريد إنشاء التذكرة (عند تفعيل إشعارات البريد).",
              },
              {
                icon: Ticket,
                title: "سجل التاريخ",
                desc: 'سجل التذكرة يسجّل أحداث "created" و"assigned" تحت فاعل ai-agent.',
              },
              {
                icon: RefreshCw,
                title: "التكاملات",
                desc: "إشعارات التكامل القياسية للتذكرة الجديدة (مثل Slack/webhooks).",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-right"
                dir="rtl"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <SectionTitle
            icon={RefreshCw}
            color="info"
            eyebrow="حلقة التغذية الراجعة"
            title="يتحسّن كلما درّبتموه"
            description="كيف تغذّي التبويبات الأخرى دقة الوكيل."
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2 sm:flex-row-reverse sm:items-stretch">
            {[
              {
                icon: MessageSquare,
                label: "سجلات المحادثة",
                desc: "اكتشف أسئلة لم يستطع الوكيل الإجابة عليها",
              },
              {
                icon: Sparkles,
                label: "أزواج الأسئلة والأجوبة",
                desc: "أضف إجابة معتمدة",
              },
              {
                icon: Database,
                label: "إعادة التوليد",
                desc: "ابنِ التضمينات لتصبح قابلة للبحث",
              },
              {
                icon: CheckCircle2,
                label: "إجابات أفضل",
                desc: "تصعيدات أقل في المرة القادمة",
              },
            ].map((s, i, arr) => (
              <Fragment key={s.label}>
                <div className="flex flex-1 flex-col rounded-xl border border-border bg-card p-3 text-right">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
                    <s.icon className="h-4 w-4 text-info" />
                  </div>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex shrink-0 items-center justify-center text-muted-foreground">
                    <ArrowRight className="h-4 w-4 rotate-90 rtl:-scale-x-100 sm:rotate-0" />
                  </div>
                )}
              </Fragment>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
