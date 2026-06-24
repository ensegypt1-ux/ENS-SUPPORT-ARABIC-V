"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importAITrainingPairs } from "@/actions/ai-training";

interface ImportPair {
  question: string;
  answer: string;
  category?: string;
}

function parseCsv(text: string): ImportPair[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        if (field.length > 0 || row.length > 0) {
          row.push(field);
          rows.push(row);
          row = [];
          field = "";
        }
        if (ch === "\r" && text[i + 1] === "\n") i++;
      } else {
        field += ch;
      }
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (rows.length === 0) return [];

  const [header, ...dataRows] = rows;
  const normalized = header.map((h) => h.trim().toLowerCase());
  const qIdx = normalized.indexOf("question");
  const aIdx = normalized.indexOf("answer");
  const cIdx = normalized.indexOf("category");

  if (qIdx === -1 || aIdx === -1) {
    throw new Error('ملف CSV لازم يحتوي على أعمدة "question" و"answer"');
  }

  return dataRows
    .filter((r) => r.length > 0 && (r[qIdx] || r[aIdx]))
    .map((r) => ({
      question: (r[qIdx] ?? "").trim(),
      answer: (r[aIdx] ?? "").trim(),
      category: cIdx >= 0 ? (r[cIdx] ?? "").trim() || undefined : undefined,
    }))
    .filter((p) => p.question && p.answer);
}

function parsePairs(text: string): ImportPair[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    const data = JSON.parse(trimmed);
    const arr = Array.isArray(data) ? data : data.pairs;
    if (!Array.isArray(arr))
      throw new Error('JSON لازم يكون مصفوفة أو { pairs: [...] }');
    return arr
      .filter((p) => p?.question && p?.answer)
      .map((p) => ({
        question: String(p.question).trim(),
        answer: String(p.answer).trim(),
        category: p.category ? String(p.category).trim() : undefined,
      }));
  }
  return parseCsv(trimmed);
}

export function ImportPairsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    let parsed: ImportPair[];
    try {
      parsed = parsePairs(content);
    } catch (error: any) {
      toast.error(error?.message ?? "تعذّر تحليل المدخلات");
      return;
    }

    if (parsed.length === 0) {
      toast.error("ملقيناش أزواج صالحة");
      return;
    }

    if (parsed.length > 500) {
      toast.error("الحد الأقصى 500 زوج لكل استيراد");
      return;
    }

    setIsLoading(true);
    try {
      const result = await importAITrainingPairs({ pairs: parsed });
      if (result.success && result.data) {
        toast.success(
          `اتستورد ${result.data.imported} زوج` +
            (result.data.failed ? `، ${result.data.failed}` : "") +
            (result.data.skipped ? `، اتتخطي ${result.data.skipped}` : "")
        );
        setContent("");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "تعذّر الاستيراد");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="me-1.5 h-3.5 w-3.5" />
          استيراد
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>استيراد أزواج التدريب</DialogTitle>
          <DialogDescription>
            الصق CSV (مع ترويسة <code>question,answer,category</code>) أو JSON.
            الحد الأقصى 500 زوج لكل استيراد.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label className="text-xs font-medium">المحتوى</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder={`question,answer,category\n"How do I reset my password?","Go to Settings > Account","Account"`}
            className="resize-none font-mono text-xs"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button onClick={handleImport} disabled={isLoading || !content.trim()}>
            {isLoading && <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />}
            استيراد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
