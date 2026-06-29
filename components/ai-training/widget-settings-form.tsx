"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Loader2, Maximize2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { PanelCardHeading, PanelFormActions } from "@/components/ui/panel-form";
import { updateAISettings } from "@/actions/ai-training";
import { WidgetAvatarUploader } from "@/components/ai-training/widget-avatar-uploader";
import { WidgetPreview } from "@/components/ai-chat/widget-preview";
import { WidgetLauncherButton } from "@/components/ai-chat/widget-launcher-button";
import {
  DEFAULT_WIDGET_ACCENT,
  DEFAULT_WIDGET_HEIGHT,
  DEFAULT_WIDGET_PRIMARY,
  DEFAULT_WIDGET_WIDTH,
  MAX_WIDGET_HEIGHT,
  MAX_WIDGET_WIDTH,
  MIN_WIDGET_HEIGHT,
  MIN_WIDGET_WIDTH,
} from "@/lib/ai/widget-theme";
import type { AISettingsPublic } from "@/types";
import { cn } from "@/lib/utils";

type WidgetSizeParseResult =
  | { ok: true; width: number; height: number }
  | { ok: false; error: string };

export function WidgetSettingsForm({
  settings,
}: {
  settings: AISettingsPublic;
}) {
  const router = useRouter();
  const c = settings.chatbot;
  const savedWidgetWidth = c.widgetWidth ?? DEFAULT_WIDGET_WIDTH;
  const savedWidgetHeight = c.widgetHeight ?? DEFAULT_WIDGET_HEIGHT;
  const [isSaving, setIsSaving] = useState(false);
  const [headerTitle, setHeaderTitle] = useState(c.headerTitle);
  const [position, setPosition] = useState(c.position);
  const [primaryColor, setPrimaryColor] = useState(
    c.primaryColor || DEFAULT_WIDGET_PRIMARY
  );
  const [accentColor, setAccentColor] = useState(
    c.accentColor || DEFAULT_WIDGET_ACCENT
  );
  const [footerText, setFooterText] = useState(c.footerText);
  const [showPoweredBy, setShowPoweredBy] = useState(c.showPoweredBy);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(c.headerAvatarUrl);
  const [widgetWidth, setWidgetWidth] = useState(String(savedWidgetWidth));
  const [widgetHeight, setWidgetHeight] = useState(String(savedWidgetHeight));

  // Snapshot of the last-saved values; drives the unsaved-changes indicator.
  const [baseline, setBaseline] = useState({
    headerTitle: c.headerTitle,
    position: c.position,
    primaryColor: c.primaryColor || DEFAULT_WIDGET_PRIMARY,
    accentColor: c.accentColor || DEFAULT_WIDGET_ACCENT,
    footerText: c.footerText,
    showPoweredBy: c.showPoweredBy,
    headerAvatarUrl: c.headerAvatarUrl,
    widgetWidth: String(savedWidgetWidth),
    widgetHeight: String(savedWidgetHeight),
  });

  const isDirty =
    headerTitle !== baseline.headerTitle ||
    position !== baseline.position ||
    primaryColor !== baseline.primaryColor ||
    accentColor !== baseline.accentColor ||
    footerText !== baseline.footerText ||
    showPoweredBy !== baseline.showPoweredBy ||
    headerAvatarUrl !== baseline.headerAvatarUrl ||
    widgetWidth !== baseline.widgetWidth ||
    widgetHeight !== baseline.widgetHeight;

  const handleSave = async () => {
    const parsedSize = parseWidgetSize(widgetWidth, widgetHeight);
    if (!parsedSize.ok) {
      toast.error(parsedSize.error);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateAISettings({
        chatbot: {
          headerTitle,
          position,
          primaryColor,
          accentColor,
          footerText,
          showPoweredBy,
          headerAvatarUrl,
          widgetWidth: parsedSize.width,
          widgetHeight: parsedSize.height,
        },
      });
      if (result.success) {
        setBaseline({
          headerTitle,
          position,
          primaryColor,
          accentColor,
          footerText,
          showPoweredBy,
          headerAvatarUrl,
          widgetWidth: String(parsedSize.width),
          widgetHeight: String(parsedSize.height),
        });
        setWidgetWidth(String(parsedSize.width));
        setWidgetHeight(String(parsedSize.height));
        router.refresh();
        toast.success("تم الحفظ مظهر الأداة");
      } else {
        toast.error(result.error ?? "تعذّر الحفظ");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <PanelCardHeading
              title="المظهر"
              icon={<Palette className="h-4 w-4 text-primary" />}
              description="خصّص شكل أداة المحادثة في المتجر كما يراها الزوار."
            />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">عنوان الرأس</Label>
              <Input
                className="h-9"
                placeholder={settings.businessName || "محادثة مباشرة"}
                value={headerTitle}
                maxLength={60}
                onChange={(e) => setHeaderTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                يُعرض في رأس المحادثة. يُستخدم اسم نشاطك التجاري إن تُرك فارغًا.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">الموضع</Label>
              <Select
                value={position}
                onValueChange={(v) =>
                  setPosition(v as "bottom-right" | "bottom-left")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">أسفل اليمين</SelectItem>
                  <SelectItem value="bottom-left">أسفل اليسار</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-2">
                <Maximize2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">الحجم الموسّع</p>
                  <p className="text-xs text-muted-foreground">
                    يُطبَّق على التضمين العائم ومقتطف iframe بعد الحفظ.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DimensionField
                  label="العرض"
                  value={widgetWidth}
                  min={MIN_WIDGET_WIDTH}
                  max={MAX_WIDGET_WIDTH}
                  onChange={setWidgetWidth}
                />
                <DimensionField
                  label="الارتفاع"
                  value={widgetHeight}
                  min={MIN_WIDGET_HEIGHT}
                  max={MAX_WIDGET_HEIGHT}
                  onChange={setWidgetHeight}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                label="اللون الأساسي"
                value={primaryColor}
                onChange={setPrimaryColor}
              />
              <ColorField
                label="لون التمييز"
                value={accentColor}
                onChange={setAccentColor}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">نص التذييل</Label>
              <Input
                className="h-9"
                placeholder="مدعوم بالذكاء الاصطناعي"
                value={footerText}
                maxLength={60}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">إظهار نص التذييل</p>
                <p className="text-xs text-muted-foreground">
                  عرض التسمية الصغيرة في أسفل نافذة المحادثة.
                </p>
              </div>
              <Switch
                checked={showPoweredBy}
                onCheckedChange={setShowPoweredBy}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">صورة رأس المحادثة</Label>
              <WidgetAvatarUploader
                value={headerAvatarUrl}
                onChange={setHeaderAvatarUrl}
              />
              <p className="text-xs text-muted-foreground">
                تُعرض في رأس المحادثة وزر المحادثة العائم. تُستبدل بأيقونة
                المحادثة الافتراضية إن تُركت فارغة.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        <Card>
          <CardHeader>
            <PanelCardHeading
              title="معاينة مباشرة"
              icon={<Eye className="h-4 w-4 text-primary" />}
              description="تتحدّث أثناء التحرير. رسالة الترحيب والنص البديل من تبويب الإعدادات."
            />
          </CardHeader>
          <CardContent className="flex max-h-[48rem] justify-center overflow-auto rounded-xl bg-muted/30 py-6">
            <div
              className={cn(
                "flex w-full max-w-full flex-col gap-4",
                position === "bottom-left" ? "items-start" : "items-end"
              )}
            >
              <WidgetLauncherButton
                headerAvatarUrl={headerAvatarUrl}
                primaryColor={primaryColor}
                onClick={() => {}}
                variant="site"
                className="pointer-events-none"
              />
              <WidgetPreview
                headerTitle={headerTitle || settings.businessName}
                welcomeMessage={c.welcomeMessage}
                placeholder={c.placeholder}
                footerText={footerText}
                showPoweredBy={showPoweredBy}
                primaryColor={primaryColor}
                accentColor={accentColor}
                headerAvatarUrl={headerAvatarUrl}
                widgetWidth={previewDimension(widgetWidth, savedWidgetWidth)}
                widgetHeight={previewDimension(widgetHeight, savedWidgetHeight)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <PanelFormActions className="sticky bottom-4 z-10 rounded-lg border border-border bg-background/90 px-4 py-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/75">
            <p className="text-right text-xs text-muted-foreground" dir="rtl">
              {isDirty
                ? "لديك تغييرات غير محفوظة."
                : "تُطبَّق التغييرات بعد الحفظ."}
            </p>
        <Button onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving && <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />}
          حفظ إعدادات الأداة
        </Button>
      </PanelFormActions>
    </div>
  );
}

function parseWidgetSize(
  width: string,
  height: string
): WidgetSizeParseResult {
  const parsedWidth = parseDimension(
    width,
    MIN_WIDGET_WIDTH,
    MAX_WIDGET_WIDTH,
    "عرض الأداة"
  );
  if (!parsedWidth.ok) return parsedWidth;

  const parsedHeight = parseDimension(
    height,
    MIN_WIDGET_HEIGHT,
    MAX_WIDGET_HEIGHT,
    "ارتفاع الأداة"
  );
  if (!parsedHeight.ok) return parsedHeight;

  return { ok: true, width: parsedWidth.value, height: parsedHeight.value };
}

function parseDimension(
  value: string,
  min: number,
  max: number,
  label: string
): { ok: true; value: number } | { ok: false; error: string } {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    return { ok: false, error: `يجب أن ${label} يكون رقم صحيح.` };
  }
  if (n < min || n > max) {
    return {
      ok: false,
      error: `يجب أن ${label} يكون بين ${min}px و${max}px.`,
    };
  }
  return { ok: true, value: n };
}

function previewDimension(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function DimensionField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        <Input
          className="h-9 pe-9"
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          px
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {min}-{max}px
      </p>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#2563eb"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-background p-1"
          aria-label={label}
        />
        <Input
          className="h-9 font-mono text-xs"
          placeholder="#2563eb"
          value={value}
          maxLength={20}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
