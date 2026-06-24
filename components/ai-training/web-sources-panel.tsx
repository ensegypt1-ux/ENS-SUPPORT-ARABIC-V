"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { AISitePublic, AIWebSourcePublic } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteSelect } from "@/components/ai-training/site-select";
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
  listWebSources,
  createWebSource,
  reindexWebSource,
  deleteWebSource,
  updateWebSourceSite,
} from "@/actions/ai-web-sources";

const ACTIVE_STATUSES = new Set(["queued", "crawling"]);

function isActive(sources: AIWebSourcePublic[]): boolean {
  return sources.some((s) => ACTIVE_STATUSES.has(s.status));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ar-SA");
}

function StatusBadge({ source }: { source: AIWebSourcePublic }) {
  if (source.status === "ready") {
    return (
      <Badge
        variant="outline"
        className="border-success/40 bg-success/10 text-success"
      >
        <CheckCircle2 className="me-1 h-3 w-3" />
        جاهز
      </Badge>
    );
  }
  if (source.status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/40 bg-destructive/10 text-destructive"
      >
        <AlertCircle className="me-1 h-3 w-3" />
        تعذّرت الفهرسة
      </Badge>
    );
  }
  if (source.status === "crawling") {
    const p = source.progress;
    const label =
      p && p.total > 0
        ? `${p.phase} ${p.visited}/${p.total}`
        : (p?.phase ?? "جارٍ الفهرسة…");
    return (
      <Badge
        variant="outline"
        className="border-info/40 bg-info/10 text-info"
      >
        <Loader2 className="me-1 h-3 w-3 animate-spin" />
        {label}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-muted-foreground/30 bg-muted text-muted-foreground"
    >
      <Clock className="me-1 h-3 w-3" />
      في الانتظار
    </Badge>
  );
}

function ScopeSelect({
  value,
  sites,
  disabled,
  onChange,
}: {
  value: string;
  sites: AISitePublic[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      aria-label="نطاق المعرفة"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-44"
    >
      <option value="">عام</option>
      {sites.map((s) => (
        <option key={s._id} value={s._id}>
          {s.name}
          {s.enabled ? "" : " (معطّل)"}
        </option>
      ))}
    </select>
  );
}

const MAX_PAGES_CEILING = 500;
const DEFAULT_MAX_PAGES = 100;

function AddSourceDialog({
  onAdded,
  sites,
}: {
  onAdded: () => void;
  sites: AISitePublic[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(String(DEFAULT_MAX_PAGES));
  const [siteId, setSiteId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !url.trim()) {
      toast.error("دخل الاسم والرابط");
      return;
    }
    const pages = Math.round(Number(maxPages));
    if (!Number.isFinite(pages) || pages < 1 || pages > MAX_PAGES_CEILING) {
      toast.error(`الحد الأقصى للصفحات لازم يكون بين 1 و${MAX_PAGES_CEILING}`);
      return;
    }
    setSubmitting(true);
    try {
      const result = await createWebSource({
        name: name.trim(),
        url: url.trim(),
        maxPages: pages,
        siteId: siteId || undefined,
      });
      if (result.success) {
        toast.success("بدأ الزحف — الفهرسة في الخلفية");
        setName("");
        setUrl("");
        setMaxPages(String(DEFAULT_MAX_PAGES));
        setSiteId("");
        setOpen(false);
        onAdded();
      } else {
        toast.error(result.error ?? "تعذّرت إضافة المصدر");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="me-1.5 h-3.5 w-3.5" />
          إضافة رابط
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>إضافة موقع ويب</DialogTitle>
          <DialogDescription>
            أدخل اسمًا ورابط دخول. يزور الزاحف الصفحات ضمن نفس النطاق، ثم
            يتعلّم ويُضمّن محتواها ليجيب الذكاء الاصطناعي منه.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">الاسم</Label>
            <Input
              id="ws-name"
              placeholder="مثال: وثائق المنتج"
              value={name}
              maxLength={60}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-url">الرابط</Label>
            <Input
              id="ws-url"
              type="url"
              placeholder="https://docs.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-max-pages">الحد الأقصى للصفحات</Label>
            <Input
              id="ws-max-pages"
              type="number"
              min={1}
              max={MAX_PAGES_CEILING}
              value={maxPages}
              onChange={(e) => setMaxPages(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              الحد الأعلى للصفحات المزحوفة عبر النطاق بالكامل (1–
              {MAX_PAGES_CEILING}). ارفعه للمواقع الكبيرة؛ القيم الأعلى تستغرق
              وقتًا أطول وتكلف أكثر للتضمين.
            </p>
          </div>
          <SiteSelect
            id="ws-site"
            value={siteId}
            onChange={setSiteId}
            sites={sites}
            disabled={submitting}
          />
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
            {submitting && <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />}
            بدء الفهرسة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WebSourcesPanel({
  initialSources,
  sites = [],
}: {
  initialSources: AIWebSourcePublic[];
  sites?: AISitePublic[];
}) {
  const router = useRouter();
  const [sources, setSources] = useState(initialSources);
  const siteName = (id?: string) =>
    id ? sites.find((s) => s._id === id)?.name : undefined;
  const [busyId, setBusyId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const result = await listWebSources();
    if (result.success && result.data) setSources(result.data);
  }, []);

  // Poll only while a crawl is in flight, then stop to avoid idle traffic.
  useEffect(() => {
    if (!isActive(sources)) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      void refresh();
    }, 2500);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [sources, refresh]);

  const handleReindex = async (id: string) => {
    setBusyId(id);
    try {
      const result = await reindexWebSource(id);
      if (result.success) {
        toast.success("بدأت إعادة الفهرسة");
        await refresh();
      } else {
        toast.error(result.error ?? "تعذّرت إعادة الفهرسة");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const result = await deleteWebSource(id);
      if (result.success) {
        toast.success("اتشالت إزالة المصدر");
        await refresh();
        router.refresh();
      } else {
        toast.error(result.error ?? "تعذّر الحذف");
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleScopeChange = async (id: string, nextSiteId: string) => {
    const current = sources.find((s) => s._id === id)?.siteId ?? "";
    if (current === nextSiteId) return;
    setBusyId(id);
    setSources((prev) =>
      prev.map((s) =>
        s._id === id ? { ...s, siteId: nextSiteId || undefined } : s
      )
    );
    try {
      const result = await updateWebSourceSite(id, {
        siteId: nextSiteId || undefined,
      });
      if (result.success && result.data) {
        toast.success("اتحدّث نطاق المصدر");
        setSources((prev) =>
          prev.map((s) => (s._id === id ? result.data! : s))
        );
        router.refresh();
      } else {
        toast.error(result.error ?? "تعذّر التحديث النطاق");
        await refresh();
      }
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = sources.reduce((n, s) => n + s.pagesIndexed, 0);
  const totalChunks = sources.reduce((n, s) => n + s.chunksIndexed, 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card>
        <CardHeader className="space-y-0">
          <PanelSectionHeader
            title="مصادر المواقع"
            icon={<Globe className="h-4 w-4 text-primary" />}
            description={
              sources.length === 0
                ? "أضف موقعاً للزحف والتعلّم منه."
                : `${sources.length} مصدر · ${totalPages} صفحة · ${totalChunks} جزء مضمّن`
            }
            actions={<AddSourceDialog onAdded={refresh} sites={sites} />}
          />
        </CardHeader>
        <CardContent>
          {sources.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <Globe className="mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                مفيش مواقع بعد
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                أضف موقع وثائق أو مركز مساعدة أو أي رابط عام. يزحف الذكاء
                الاصطناعي عليه ويُضمّن المحتوى ويجيب منه تلقائيًا.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sources.map((s) => (
                <li
                  key={s._id}
                  className={panelListRowClass}
                  style={panelListRowStyle}
                >
                  <div className="flex shrink-0 flex-wrap gap-2 sm:col-start-1 sm:row-start-1">
                    <ScopeSelect
                      value={s.siteId ?? ""}
                      sites={sites}
                      disabled={
                        busyId === s._id || ACTIVE_STATUSES.has(s.status)
                      }
                      onChange={(value) => handleScopeChange(s._id, value)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReindex(s._id)}
                      disabled={
                        busyId === s._id || ACTIVE_STATUSES.has(s.status)
                      }
                    >
                      {busyId === s._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      <span className="ms-1.5 hidden sm:inline">إعادة الفهرسة</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={
                            busyId === s._id || ACTIVE_STATUSES.has(s.status)
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>إزالة مصدر الويب</AlertDialogTitle>
                          <AlertDialogDescription>
                            حذف <strong>{s.name}</strong> وجميع {s.chunksIndexed}{" "}
                            جزءًا مضمّنًا من قاعدة المعرفة؟ مش هينفع الرجوع عن
                            هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(s._id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                        {s.name}
                      </span>
                      <StatusBadge source={s} />
                      <Badge variant="outline" className="text-[10px]">
                        {siteName(s.siteId) ?? "عام"}
                      </Badge>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                      dir="ltr"
                    >
                      {s.url}
                    </a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {s.status === "ready"
                        ? `${s.pagesIndexed} صفحة · ${s.chunksIndexed} جزء · فُهرس ${formatDate(
                            s.lastCrawledAt
                          )}`
                        : s.status === "failed"
                          ? (s.error ?? "تعذّرت الفهرسة")
                          : `حتى ${s.maxPages} صفحة`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
