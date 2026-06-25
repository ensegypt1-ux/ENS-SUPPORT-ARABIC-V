"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  Code2,
  Copy,
  Globe,
  KeyRound,
  Loader2,
  Plus,
  SquareCode,
  Trash2,
} from "lucide-react";
import type { AISitePublic } from "@/types";
import {
  DEFAULT_WIDGET_HEIGHT,
  DEFAULT_WIDGET_WIDTH,
} from "@/lib/ai/widget-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  PanelCardHeading,
  PanelSectionHeader,
  panelListRowClass,
  panelListRowStyle,
} from "@/components/ui/panel-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  listSites,
  createSite,
  updateSite,
  deleteSite,
  rotateSiteKey,
} from "@/actions/ai-sites";

/** A small copy-to-clipboard button shared by the snippet and key rows. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className="h-8 w-8 shrink-0"
      title={`نسخ ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`تم النسخ ${label}`);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("تعذّر النسخ — انسخ يدويًا");
        }
      }}
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

/** A read-only code block with a copy button (shared by every snippet). */
function SnippetRow({ code, label }: { code: string; label: string }) {
  return (
    <div className="flex items-center gap-2" style={{ direction: "ltr" }}>
      <pre
        dir="ltr"
        className="min-w-0 flex-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-3 text-left text-xs leading-relaxed"
      >
        <code>{code}</code>
      </pre>
      <CopyButton value={code} label={label} />
    </div>
  );
}

function parseDomains(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((d) => d.trim())
    .filter(Boolean);
}

function SiteDialog({
  site,
  trigger,
  onSaved,
}: {
  site?: AISitePublic;
  trigger: React.ReactNode;
  onSaved: () => void;
}) {
  const isEditing = !!site;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(site?.name ?? "");
  const [domains, setDomains] = useState((site?.domains ?? []).join(", "));
  const [submitting, setSubmitting] = useState(false);

  // Reset fields whenever the dialog (re)opens so stale edits don't linger.
  useEffect(() => {
    if (open) {
      setName(site?.name ?? "");
      setDomains((site?.domains ?? []).join(", "));
    }
  }, [open, site]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("دخل اسم الموقع");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), domains: parseDomains(domains) };
      const result = isEditing
        ? await updateSite(site._id, payload)
        : await createSite(payload);
      if (result.success) {
        toast.success(isEditing ? "تم التحديث الموقع" : "تم الإنشاء الموقع");
        setOpen(false);
        onSaved();
      } else {
        toast.error(result.error ?? "تعذّر حفظ الموقع");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "تعديل الموقع" : "إضافة موقع"}</DialogTitle>
          <DialogDescription>
            الموقع هو نطاق معرفة. عيّن له المصادر (زحف الويب، الملفات، أزواج
            السؤال والجواب)، ثم ضمّن مقتطفه — يجيب الروبوت فقط من مصادر هذا
            الموقع وما يُعلَّم عامًا.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="site-name">الاسم</Label>
            <Input
              id="site-name"
              placeholder="مثال: متجر أكمي"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="site-domains">النطاقات المسموحة (اختياري)</Label>
            <Input
              id="site-domains"
              placeholder="acme.com, shop.acme.com"
              value={domains}
              onChange={(e) => setDomains(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              مفصولة بفواصل. عند التعيين، تجيب الأداة لهذا الموقع فقط عند
              تضمينها على هذه المضيفات. اتركها فارغة للسماح بأي مضيف.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {isEditing ? "حفظ" : "إنشاء موقع"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SitesPanel({
  initialSites,
  appUrl,
  widgetWidth = DEFAULT_WIDGET_WIDTH,
  widgetHeight = DEFAULT_WIDGET_HEIGHT,
}: {
  initialSites: AISitePublic[];
  appUrl: string;
  widgetWidth?: number;
  widgetHeight?: number;
}) {
  const router = useRouter();
  const [sites, setSites] = useState(initialSites);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Prefer the server-provided app URL; fall back to the current origin.
  const [origin, setOrigin] = useState(appUrl);
  useEffect(() => {
    if (!appUrl && typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, [appUrl]);
  const base = origin || "https://your-app.com";
  const globalSnippet = `<script src="${base}/widget.js" async></script>`;
  const iframeSnippet = `<iframe src="${base}/embed" title="محادثة مباشرة" allow="clipboard-write" style="border:0;width:${widgetWidth}px;height:${widgetHeight}px;"></iframe>`;

  const refresh = async () => {
    const result = await listSites();
    if (result.success && result.data) setSites(result.data);
    // Source badges elsewhere depend on the site list too.
    router.refresh();
  };

  const handleToggle = async (site: AISitePublic, enabled: boolean) => {
    setBusyId(site._id);
    // Optimistic flip; revert on failure.
    setSites((prev) =>
      prev.map((s) => (s._id === site._id ? { ...s, enabled } : s))
    );
    try {
      const result = await updateSite(site._id, { enabled });
      if (!result.success) {
        toast.error(result.error ?? "تعذّر التحديث");
        setSites((prev) =>
          prev.map((s) =>
            s._id === site._id ? { ...s, enabled: !enabled } : s
          )
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRotate = async (id: string) => {
    setBusyId(id);
    try {
      const result = await rotateSiteKey(id);
      if (result.success) {
        toast.success("تم التدوير المفتاح — حدّث كود التضمين على الموقع");
        await refresh();
      } else {
        toast.error(result.error ?? "تعذّر تدوير المفتاح");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const result = await deleteSite(id);
      if (result.success) {
        toast.success("تم الحذف الموقع");
        await refresh();
      } else {
        toast.error(result.error ?? "تعذّر الحذف");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card>
        <CardHeader>
          <PanelCardHeading
            title="الأداة العامة — تجيب من كل المعرفة"
            icon={<Globe className="h-4 w-4 text-primary" />}
            description={
              <>
                الصق هذا قبل وسم الإغلاق{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs" dir="ltr">
                  &lt;/body&gt;
                </code>{" "}
                في أي موقع. تظهر فقاعة محادثة في الزاوية وتجيب من{" "}
                <strong>كل</strong> ما درّبته. استخدم موقعاً أدناه للإجابة من
                مصادر موقع واحد فقط.
              </>
            }
          />
        </CardHeader>
        <CardContent>
          <SnippetRow code={globalSnippet} label="المقتطف" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0">
          <PanelSectionHeader
            title="أدوات لكل موقع"
            icon={<Code2 className="h-4 w-4 text-primary" />}
            description={
              sites.length === 0
                ? "أضف موقعاً لتجيب الأداة من مصادر ذلك الموقع فقط (بالإضافة إلى ما يُعلَّم عاماً)."
                : `${sites.length} موقع. كل مقتطف يجيب من مصادر ذلك الموقع بالإضافة إلى العام.`
            }
            actions={
              <SiteDialog
                onSaved={refresh}
                trigger={
                  <Button size="sm">
                    <Plus className="me-1.5 h-3.5 w-3.5" />
                    إضافة موقع
                  </Button>
                }
              />
            }
          />
        </CardHeader>
        <CardContent>
          {sites.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-10 text-center">
              <Globe className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                لا يوجد مواقع بعد. استخدم المقتطف العام أعلاه، أو أضف موقعًا
                لتحديد نطاق الإجابات لكل موقع.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sites.map((s) => (
                <SiteRow
                  key={s._id}
                  site={s}
                  base={base}
                  busy={busyId === s._id}
                  onToggle={(enabled) => handleToggle(s, enabled)}
                  onRotate={() => handleRotate(s._id)}
                  onDelete={() => handleDelete(s._id)}
                  onSaved={refresh}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <PanelCardHeading
            title="طرق تضمين أخرى"
            icon={<SquareCode className="h-4 w-4 text-primary" />}
            description={
              <>
                للمنصات التي تمنع السكربتات لكن تسمح بكتلة HTML/iframe. يُعرض
                مضمّناً حيث تضعه (بدون فقاعة عائمة). لموقع واحد، أضف{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs" dir="ltr">
                  ?key=SITE_KEY
                </code>{" "}
                إلى الرابط.
              </>
            }
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <SnippetRow code={iframeSnippet} label="مقتطف مضمّن" />
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-right text-sm text-muted-foreground">
            <p className="font-medium text-foreground">تقييد أماكن التحميل</p>
            <p className="mt-1" dir="rtl">
              افتراضياً يمكن تضمين الأداة في أي مكان. لقفلها على نطاقات
              محددة، عيّن متغير البيئة{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs" dir="ltr">
                EMBED_ALLOWED_ORIGINS
              </code>{" "}
              إلى قائمة أصول مفصولة بفواصل وأعد النشر.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SiteRow({
  site,
  base,
  busy,
  onToggle,
  onRotate,
  onDelete,
  onSaved,
}: {
  site: AISitePublic;
  base: string;
  busy: boolean;
  onToggle: (enabled: boolean) => void;
  onRotate: () => void;
  onDelete: () => void;
  onSaved: () => void;
}) {
  const snippet = useMemo(
    () => `<script src="${base}/widget.js?key=${site.key}" async></script>`,
    [base, site.key]
  );

  return (
    <li className="space-y-3">
      <div className={panelListRowClass} style={panelListRowStyle}>
        <div className="flex flex-wrap items-center gap-1.5 sm:col-start-1 sm:row-start-1">
          <div className="me-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">مفعّل</span>
            <Switch
              checked={site.enabled}
              disabled={busy}
              onCheckedChange={onToggle}
            />
          </div>
          <SiteDialog
            site={site}
            onSaved={onSaved}
            trigger={
              <Button variant="outline" size="sm" disabled={busy}>
                تعديل
              </Button>
            }
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={busy} title="تدوير المفتاح">
                <KeyRound className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تدوير مفتاح هذا الموقع؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتوقف مقتطف التضمين الحالي لـ <strong>{site.name}</strong> عن
                  تحديد نطاق الإجابات حتى تستبدله بالجديد.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={onRotate}>
                  تدوير المفتاح
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                className="text-destructive hover:text-destructive"
                title="حذف الموقع"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>حذف {site.name}؟</AlertDialogTitle>
                <AlertDialogDescription>
                  يعمل هذا فقط بعد إلغاء تعيين جميع المصادر منه. أعد تعيين أو
                  أزل مصادر الويب والملفات وأزواج السؤال والجواب أولاً.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <div className="min-w-0 text-right sm:col-start-2 sm:row-start-1" dir="rtl">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="truncate font-medium text-foreground">
              {site.name}
            </span>
            {!site.enabled && (
              <Badge variant="outline" className="text-[10px]">
                معطّل
              </Badge>
            )}
            {site.domains.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {site.domains.length} نطاق
              </Badge>
            )}
          </div>
          {site.domains.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground" dir="ltr">
              {site.domains.join(", ")}
            </p>
          )}
        </div>
      </div>

      <SnippetRow code={snippet} label="المقتطف" />
    </li>
  );
}
