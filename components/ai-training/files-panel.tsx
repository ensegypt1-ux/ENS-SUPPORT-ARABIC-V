"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  File as FileIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import type { AIFilePublic, AISitePublic } from "@/types";
import { SiteSelect } from "@/components/ai-training/site-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
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
  listFiles,
  uploadAndIndexFile,
  deleteFile,
  updateFileSite,
} from "@/actions/ai-files";

const ACCEPT =
  ".pdf,.xlsx,.xls,.xlsm,.csv,.tsv,.docx,.doc,.txt,.md,.markdown,.text,.log";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA");
}

function FileTypeIcon({ type }: { type: string }) {
  if (type === "spreadsheet")
    return <FileSpreadsheet className="h-4 w-4 text-success" />;
  if (type === "pdf") return <FileText className="h-4 w-4 text-destructive" />;
  if (type === "document")
    return <FileText className="h-4 w-4 text-info" />;
  return <FileIcon className="h-4 w-4 text-muted-foreground" />;
}

function StatusBadge({ file }: { file: AIFilePublic }) {
  if (file.status === "ready") {
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
  if (file.status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/40 bg-destructive/10 text-destructive"
      >
        <AlertCircle className="me-1 h-3 w-3" />
        فشل
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-info/40 bg-info/10 text-info">
      <Loader2 className="me-1 h-3 w-3 animate-spin" />
      قيد المعالجة
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

function UploadDialog({
  onUploaded,
  sites,
}: {
  onUploaded: () => void;
  sites: AISitePublic[];
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [siteId, setSiteId] = useState("");
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setFile(null);
    setSiteId("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("اختار ملف الأول");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (name.trim()) fd.append("name", name.trim());
      if (siteId) fd.append("siteId", siteId);
      const result = await uploadAndIndexFile(fd);
      if (result.success && result.data) {
        toast.success(
          `اتفهرس «${result.data.name}» (${result.data.chunksIndexed} جزء)`
        );
        reset();
        setOpen(false);
        onUploaded();
      } else {
        toast.error(result.error ?? "تعذّرت فهرسة الملف");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="me-1.5 h-3.5 w-3.5" />
          رفع ملف
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>رفع مستند</DialogTitle>
          <DialogDescription>
            PDF أو Excel/CSV أو Word (.docx) أو نص/markdown. يُحلّل الملف
            ويُقسّم ويُضمّن ويُضاف إلى قاعدة المعرفة ليجيب الذكاء الاصطناعي
            منه.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="file-input">الملف</Label>
            <Input
              id="file-input"
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !name.trim()) setName(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                {file.name} · {formatBytes(file.size)}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="file-name">اسم العرض</Label>
            <Input
              id="file-name"
              placeholder="مثال: جدول الأسعار 2026"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <SiteSelect
            id="file-site"
            value={siteId}
            onChange={setSiteId}
            sites={sites}
            disabled={uploading}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={uploading}
          >
            إلغاء
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading && (
              <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            {uploading ? "جارٍ الفهرسة…" : "رفع وفهرسة"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FilesPanel({
  initialFiles,
  sites = [],
}: {
  initialFiles: AIFilePublic[];
  sites?: AISitePublic[];
}) {
  const router = useRouter();
  const [files, setFiles] = useState(initialFiles);
  const [busyId, setBusyId] = useState<string | null>(null);
  const siteName = (id?: string) =>
    id ? sites.find((s) => s._id === id)?.name : undefined;

  const refresh = useCallback(async () => {
    const result = await listFiles();
    if (result.success && result.data) setFiles(result.data);
  }, []);

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      const result = await deleteFile(id);
      if (result.success) {
        toast.success("اتشالت إزالة الملف");
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
    const current = files.find((f) => f._id === id)?.siteId ?? "";
    if (current === nextSiteId) return;
    setBusyId(id);
    setFiles((prev) =>
      prev.map((f) =>
        f._id === id ? { ...f, siteId: nextSiteId || undefined } : f
      )
    );
    try {
      const result = await updateFileSite(id, {
        siteId: nextSiteId || undefined,
      });
      if (result.success && result.data) {
        toast.success("اتحدّث نطاق الملف");
        setFiles((prev) =>
          prev.map((f) => (f._id === id ? result.data! : f))
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

  const totalChunks = files.reduce((n, f) => n + f.chunksIndexed, 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <Card>
        <CardHeader className="space-y-0">
          <PanelSectionHeader
            title="الملفات"
            icon={<FileText className="h-4 w-4 text-primary" />}
            description={
              files.length === 0
                ? "ارفع ملفات PDF أو جداول بيانات أو مستندات للتعلّم منها."
                : `${files.length} ملف · ${totalChunks} جزء مضمّن`
            }
            actions={<UploadDialog onUploaded={refresh} sites={sites} />}
          />
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
              <Upload className="mb-3 h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium text-foreground">
                مفيش ملفات بعد
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                ارفع ملف PDF أو Excel/CSV أو Word أو نص. يُحلّل ويُضمّن ويجيب
                الذكاء الاصطناعي منه تلقائيًا.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {files.map((f) => (
                <li
                  key={f._id}
                  className={panelListRowClass}
                  style={panelListRowStyle}
                >
                  <div className="flex shrink-0 flex-wrap gap-2 sm:col-start-1 sm:row-start-1">
                    <ScopeSelect
                      value={f.siteId ?? ""}
                      sites={sites}
                      disabled={busyId === f._id || f.status === "processing"}
                      onChange={(value) => handleScopeChange(f._id, value)}
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 text-destructive hover:text-destructive"
                          disabled={
                            busyId === f._id || f.status === "processing"
                          }
                        >
                          {busyId === f._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>إزالة الملف</AlertDialogTitle>
                          <AlertDialogDescription>
                            حذف <strong>{f.name}</strong> و{f.chunksIndexed}{" "}
                            جزءًا مضمّنًا من قاعدة المعرفة؟ مش هينفع الرجوع عن
                            هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(f._id)}
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
                      <FileTypeIcon type={f.fileType} />
                      <span className="truncate font-medium text-foreground">
                        {f.name}
                      </span>
                      <StatusBadge file={f} />
                      <Badge variant="outline" className="text-[10px]">
                        {siteName(f.siteId) ?? "عام"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground" dir="ltr">
                      {f.status === "ready"
                        ? `${f.filename} · ${formatBytes(f.sizeBytes)} · ${f.chunksIndexed} جزء · ${formatDate(f.createdAt)}`
                        : f.status === "failed"
                          ? (f.error ?? "تعذّرت الفهرسة")
                          : `${f.filename} · ${formatBytes(f.sizeBytes)}`}
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
