"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2,
  KeyRound,
  PlugZap,
  MessageCircle,
  Sparkles,
  RefreshCcw,
  Server,
  Search,
  SlidersHorizontal,
  Building2,
  LayoutGrid,
  Cloud,
  HardDrive,
  ExternalLink,
  AlertTriangle,
  DatabaseZap,
} from "lucide-react";
import {
  PanelActionRow,
  PanelCardHeading,
  PanelFormActions,
  PanelFormLayout,
  PanelSwitchField,
} from "@/components/ui/panel-form";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  updateAISettings,
  testAISettingsConnection,
  testAIChatConnection,
  reindexKnowledgeBase,
  syncQdrant,
  getRetrievalHealth,
} from "@/actions/ai-training";
import type { AISettingsPublic, RetrievalIndexHealth } from "@/types";

const schema = z.object({
  apiKey: z.string().optional(),
  ollamaApiKey: z.string().optional(),
  chatProvider: z.enum(["openai", "ollama"]),
  embeddingProvider: z.enum(["openai", "ollama"]),
  ollamaBaseUrl: z.string().max(300),
  ollamaChatModel: z.string().max(100),
  ollamaEmbeddingModel: z.string().max(100),
  chatModel: z.string().min(1).max(100),
  embeddingModel: z.string().min(1).max(100),
  confidenceThreshold: z.number().min(0.5).max(0.95),
  maxTokens: z.number().int().min(50).max(4000),
  temperature: z.number().min(0).max(1),
  businessName: z.string().max(200),
  businessDescription: z.string().max(2000),
  systemPrompt: z.string().max(4000),
  vectorSearchMethod: z.enum(["local", "qdrant"]),
  searchMode: z.enum(["vector", "hybrid"]),
  rerankEnabled: z.boolean(),
  agent: z.object({
    enabled: z.boolean(),
    maxIterations: z.number().int().min(1).max(8),
    indexResolvedTickets: z.boolean(),
  }),
  features: z.object({
    chatbot: z.boolean(),
    agentSuggest: z.boolean(),
    ticketClassify: z.boolean(),
    guestLiveChat: z.boolean(),
  }),
  // Appearance fields (position, colors, powered-by) live on the Widget tab.
  chatbot: z.object({
    welcomeMessage: z.string().max(500),
    fallbackMessage: z.string().max(500),
    placeholder: z.string().max(100),
    rateLimitPerMinute: z.number().int().min(1).max(200),
    ticketRateLimitPerHour: z.number().int().min(1).max(50),
  }),
});

type FormData = z.infer<typeof schema>;

type Provider = "openai" | "ollama";

const PROVIDER_OPTIONS = [
  { value: "openai", label: "OpenAI", icon: Sparkles },
  { value: "ollama", label: "Ollama", icon: Server },
] as const;

type OllamaMode = "cloud" | "local";

const OLLAMA_CLOUD_URL = "https://ollama.com/v1";
const OLLAMA_LOCAL_URL = "http://localhost:11434/v1";

const OLLAMA_MODE_OPTIONS = [
  {
    value: "cloud",
    label: "Ollama Cloud",
    icon: Cloud,
    desc: "مستضاف من Ollama · مفتاح API مطلوب",
  },
  {
    value: "local",
    label: "محلي / ذاتي الاستضافة",
    icon: HardDrive,
    desc: "يعمل على جهازك · لا حاجة لمفتاح",
  },
] as const;

/**
 * Cloud vs Local is purely a function of the base URL — an ollama.com endpoint
 * is the managed cloud, anything else is a machine the operator runs. An unset
 * URL defaults to cloud, the recommended starting point.
 */
function ollamaModeFromUrl(url: string | undefined): OllamaMode {
  const u = url?.trim() ?? "";
  return !u || u.includes("ollama.com") ? "cloud" : "local";
}

const SECTIONS = [
  { id: "providers", label: "المزوّدون" },
  { id: "tuning", label: "ضبط الردود" },
  { id: "business", label: "سياق النشاط" },
  { id: "agent", label: "الوكيل المستقل" },
  { id: "search", label: "البحث والميزات" },
  { id: "widget", label: "الرسائل والحدود" },
] as const;

const SECTION_IDS = SECTIONS.map((s) => s.id);

/** Highlights whichever section is currently nearest the top of the viewport. */
function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          );
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-15% 0px -70% 0px" }
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

/** Sticky in-page jump nav for the settings sections. */
function SectionNav() {
  const active = useActiveSection(SECTION_IDS);
  return (
    <nav className="sticky top-52 w-44 shrink-0 text-right" dir="rtl">
      <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">
        في هذه الصفحة
      </p>
      <ul className="space-y-0.5">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(s.id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className={cn(
                "w-full rounded-md px-3 py-1.5 text-right text-sm transition-colors",
                active === s.id
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Segmented two-option selector for picking a provider. */
function ProviderToggle({
  value,
  onChange,
}: {
  value: Provider;
  onChange: (value: Provider) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup">
      {PROVIDER_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary/10 text-primary shadow-xs"
                : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            )}
            dir="ltr"
          >
            <span>{opt.label}</span>
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

/** Two-option selector distinguishing hosted Ollama Cloud from a local server. */
function OllamaModeToggle({
  value,
  onChange,
}: {
  value: OllamaMode;
  onChange: (value: OllamaMode) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup">
      {OLLAMA_MODE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex w-full flex-col items-end gap-1 rounded-lg border px-3 py-2.5 text-right transition-all",
              "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active
                ? "border-primary bg-primary/10 text-primary shadow-xs"
                : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
            )}
            dir="rtl"
          >
            <span
              className="inline-flex w-full items-center justify-end gap-2 text-sm font-medium"
              dir="ltr"
            >
              <span>{opt.label}</span>
              <Icon className="h-4 w-4" />
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {opt.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AISettingsForm({
  settings,
}: {
  settings: AISettingsPublic;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingChat, setIsTestingChat] = useState(false);
  const [isReindexing, setIsReindexing] = useState(false);
  const [isSyncingQdrant, setIsSyncingQdrant] = useState(false);
  const [health, setHealth] = useState<RetrievalIndexHealth | null>(null);
  // Start split only if the saved config already mixes providers.
  const [splitProviders, setSplitProviders] = useState(
    settings.chatProvider !== settings.embeddingProvider
  );

  // Load index size/backend once so we can recommend Qdrant when local cosine
  // is being pushed past the point it scales.
  useEffect(() => {
    let cancelled = false;
    void getRetrievalHealth().then((res) => {
      if (!cancelled && res.success && res.data) setHealth(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      apiKey: settings.hasApiKey ? settings.apiKeyPreview : "",
      ollamaApiKey: settings.hasOllamaApiKey ? "***saved***" : "",
      chatProvider: settings.chatProvider,
      embeddingProvider: settings.embeddingProvider,
      ollamaBaseUrl: settings.ollamaBaseUrl,
      ollamaChatModel: settings.ollamaChatModel,
      ollamaEmbeddingModel: settings.ollamaEmbeddingModel,
      chatModel: settings.chatModel,
      embeddingModel: settings.embeddingModel,
      confidenceThreshold: settings.confidenceThreshold,
      maxTokens: settings.maxTokens,
      temperature: settings.temperature,
      businessName: settings.businessName,
      businessDescription: settings.businessDescription,
      systemPrompt: settings.systemPrompt,
      vectorSearchMethod: settings.vectorSearchMethod,
      searchMode: settings.searchMode,
      rerankEnabled: settings.rerankEnabled,
      agent: settings.agent,
      features: settings.features,
      chatbot: settings.chatbot,
    },
  });

  const threshold = watch("confidenceThreshold");
  const features = watch("features");
  const chatProvider = watch("chatProvider");
  const embeddingProvider = watch("embeddingProvider");
  const usesOpenAI = chatProvider === "openai" || embeddingProvider === "openai";
  const usesOllama = chatProvider === "ollama" || embeddingProvider === "ollama";
  const agent = watch("agent");

  const ollamaBaseUrl = watch("ollamaBaseUrl");
  const ollamaMode = ollamaModeFromUrl(ollamaBaseUrl);

  // Switching mode just repoints the base URL: Cloud → the hosted endpoint,
  // Local → localhost. A custom self-hosted URL is treated as Local.
  const setOllamaMode = (mode: OllamaMode) =>
    setValue(
      "ollamaBaseUrl",
      mode === "cloud" ? OLLAMA_CLOUD_URL : OLLAMA_LOCAL_URL,
      { shouldDirty: true }
    );

  // When Ollama is first selected, default to Cloud unless the operator has
  // already pointed the base URL at their own server.
  const defaultToCloudIfUnset = () => {
    const url = watch("ollamaBaseUrl");
    if (!url || url === OLLAMA_LOCAL_URL) {
      setValue("ollamaBaseUrl", OLLAMA_CLOUD_URL, { shouldDirty: true });
    }
  };

  // Ollama Cloud serves no embedding models, and chat + embedding Ollama
  // clients share one base URL — so the only working partner for cloud chat is
  // OpenAI. This splits providers and moves embeddings there in one click.
  const useOpenAIForEmbeddings = () => {
    setSplitProviders(true);
    setValue("embeddingProvider", "openai", { shouldDirty: true });
  };

  // Unified mode sets both chat and embedding to the same provider.
  const setUnifiedProvider = (value: Provider) => {
    const wasOllama = usesOllama;
    setValue("chatProvider", value, { shouldDirty: true });
    setValue("embeddingProvider", value, { shouldDirty: true });
    if (value === "ollama" && !wasOllama) defaultToCloudIfUnset();
  };

  const toggleSplitProviders = (split: boolean) => {
    setSplitProviders(split);
    // Collapsing back to unified: embeddings follow the chat provider.
    if (!split)
      setValue("embeddingProvider", chatProvider, { shouldDirty: true });
  };
  const vectorMethod = watch("vectorSearchMethod");
  const searchMode = watch("searchMode");
  const rerankEnabled = watch("rerankEnabled");

  const onSubmit = async (data: FormData) => {
    setIsSaving(true);
    try {
      const payload = { ...data };
      if (payload.apiKey?.startsWith("sk-...")) {
        delete payload.apiKey;
      }
      if (payload.ollamaApiKey?.startsWith("***")) {
        delete payload.ollamaApiKey;
      }
      const result = await updateAISettings(payload);
      if (result.success) {
        if (result.data?.reindexRequired) {
          toast.warning(
            "تغيّر نموذج التضمين — انقر إعادة الفهرسة لإعادة بناء الفهرس."
          );
        } else {
          toast.success("تم حفظ إعدادات الذكاء الاصطناعي");
        }
      } else {
        toast.error(result.error ?? "تعذّر الحفظ");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalid = () => {
    toast.error("صحّح الحقول المعلّمة قبل ما تحفظ.");
  };

  const handleReindex = async () => {
    setIsReindexing(true);
    try {
      const result = await reindexKnowledgeBase();
      if (result.success && result.data) {
        const { kb, services, resolvedTickets, web, files, failed } =
          result.data;
        toast.success(
          `أُعيدت الفهرسة: ${kb} قاعدة معرفة · ${services} خدمة · ` +
            `${resolvedTickets} تذكرة محلولة · ${web} صفحة ويب · ` +
            `${files} جزء ملف${failed ? ` · ${failed}` : ""}`
        );
      } else {
        toast.error(result.error ?? "تعذّرت إعادة الفهرسة");
      }
    } finally {
      setIsReindexing(false);
    }
  };

  const handleSyncQdrant = async () => {
    setIsSyncingQdrant(true);
    try {
      const result = await syncQdrant();
      if (result.success && result.data) {
        toast.success(`تم مزامنة ${result.data.synced} متجهًا مع Qdrant`);
      } else {
        toast.error(result.error ?? "تعذّرت مزامنة Qdrant");
      }
    } finally {
      setIsSyncingQdrant(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const result = await testAISettingsConnection();
      if (result.success) {
        toast.success("مزوّد التضمين يعمل");
      } else {
        toast.error(result.error ?? "تعذّر الاتصال");
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestChat = async () => {
    setIsTestingChat(true);
    try {
      const result = await testAIChatConnection();
      if (result.success) {
        toast.success("مزوّد المحادثة يعمل");
      } else {
        toast.error(result.error ?? "تعذّر الاتصال");
      }
    } finally {
      setIsTestingChat(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} dir="rtl" className="text-right">
      <PanelFormLayout nav={<SectionNav />}>
      <Card id="providers" className="scroll-mt-52">
        <CardHeader>
          <PanelCardHeading
            title="المزوّدون"
            icon={<PlugZap className="h-4 w-4 text-primary" />}
            description="اختر أين تعمل المحادثة والتضمينات — OpenAI أو خادم Ollama محلي. يستخدم Ollama نقطة النهاية /v1 المتوافقة مع OpenAI. تظهر بيانات الاعتماد وأسماء النماذج للمزوّدين المختارين أدناه."
          />
        </CardHeader>
        <CardContent className="space-y-6">
          {settings.reindexRequired && (
            <PanelActionRow
              className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
              label="تغيّر نموذج/مزوّد التضمين. فهرس المعرفة قديم — أعد بناءه لتطبيق التغيير."
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReindex}
                  disabled={isReindexing}
                  className="shrink-0 border-amber-500/40 bg-background"
                >
                  {isReindexing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-3.5 w-3.5" />
                  )}
                  <span className="ms-1.5">إعادة الفهرسة الآن</span>
                </Button>
              }
            />
          )}
          {/* Provider selection */}
          <div className="space-y-4">
            {splitProviders ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div
                    className="inline-flex items-center justify-end gap-1.5"
                    dir="ltr"
                  >
                    <Label className="text-sm font-medium">مزوّد المحادثة</Label>
                    <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <ProviderToggle
                    value={chatProvider}
                    onChange={(v) => {
                      const wasOllama = usesOllama;
                      setValue("chatProvider", v, { shouldDirty: true });
                      if (v === "ollama" && !wasOllama) defaultToCloudIfUnset();
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    يولّد ردود روبوت المحادثة والوكيل.
                  </p>
                </div>
                <div className="space-y-2">
                  <div
                    className="inline-flex items-center justify-end gap-1.5"
                    dir="ltr"
                  >
                    <Label className="text-sm font-medium">مزوّد التضمين</Label>
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <ProviderToggle
                    value={embeddingProvider}
                    onChange={(v) => {
                      const wasOllama = usesOllama;
                      setValue("embeddingProvider", v, { shouldDirty: true });
                      if (v === "ollama" && !wasOllama) defaultToCloudIfUnset();
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    يشغّل بحث قاعدة المعرفة والمطابقة.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div
                  className="inline-flex items-center justify-end gap-1.5"
                  dir="ltr"
                >
                  <Label className="text-sm font-medium">المزوّد</Label>
                  <PlugZap className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <ProviderToggle
                  value={chatProvider}
                  onChange={setUnifiedProvider}
                />
                <p className="text-xs text-muted-foreground">
                  يُستخدم لردود المحادثة وبحث قاعدة المعرفة معًا.
                </p>
              </div>
            )}

            {/* Advanced: configure chat and embeddings separately */}
            <PanelSwitchField
              label="استخدام مزوّدين مختلفين للمحادثة والتضمين"
              description="متقدّم — مثل OpenAI للمحادثة وOllama محلي للتضمين."
              className="border-dashed bg-transparent"
              control={
                <Switch
                  checked={splitProviders}
                  onCheckedChange={toggleSplitProviders}
                />
              }
            />
          </div>

          {/* OpenAI config — only when OpenAI is selected */}
          {usesOpenAI && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4 text-right">
              <div
                className="inline-flex items-center justify-end gap-2"
                dir="ltr"
              >
                <p className="text-sm font-medium">OpenAI</p>
                <KeyRound className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">مفتاح API</Label>
                <Input
                  type="password"
                  placeholder="sk-..."
                  className="h-9 font-mono text-xs"
                  dir="ltr"
                  autoComplete="new-password"
                  data-1p-ignore
                  data-lpignore="true"
                  {...register("apiKey")}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.hasApiKey
                    ? "مخزّن مشفّرًا. اتركه دون تغيير للإبقاء على المفتاح الحالي."
                    : "لا يوجد مفتاح محفوظ بعد. الصق مفتاح OpenAI السري ثم احفظ."}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {chatProvider === "openai" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">نموذج المحادثة</Label>
                    <Input
                      className="h-9 font-mono text-xs"
                      dir="ltr"
                      placeholder="gpt-4o-mini"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      {...register("chatModel")}
                    />
                  </div>
                )}
                {embeddingProvider === "openai" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      نموذج التضمين
                    </Label>
                    <Input
                      className="h-9 font-mono text-xs"
                      dir="ltr"
                      placeholder="text-embedding-3-small"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      {...register("embeddingModel")}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ollama config — only when Ollama is selected */}
          {usesOllama && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4 text-right">
              <div
                className="inline-flex items-center justify-end gap-2"
                dir="ltr"
              >
                <p className="text-sm font-medium">Ollama</p>
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Cloud vs Local — the key choice, made explicit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  كيف تشغّل Ollama؟
                </Label>
                <OllamaModeToggle value={ollamaMode} onChange={setOllamaMode} />
                {ollamaMode === "cloud" ? (
                  <p className="text-xs text-muted-foreground">
                    النماذج تعمل على خوادم Ollama — لا حاجة للتثبيت. أنشئ مفتاحًا
                    في صفحة{" "}
                    <a
                      href="https://ollama.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-primary hover:underline"
                    >
                      المفاتيح
                      <ExternalLink className="h-3 w-3" />
                    </a>{" "}
                    في حسابك، ثم استخدم نموذجًا سحابيًا مثل{" "}
                    <code className="text-[11px]">gpt-oss:20b-cloud</code>.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    يعمل Ollama على جهازك أو خادمك. ثبّته وشغّل{" "}
                    <code className="text-[11px]">ollama pull llama3.1</code>،
                    لا حاجة لمفتاح API. يجب أن يكون الخادم متصلًا بهذا الرابط.
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Base URL: fixed/managed for Cloud, editable for Local */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-medium">الرابط الأساسي</Label>
                  <Input
                    className={cn(
                      "h-9 font-mono text-xs",
                      ollamaMode === "cloud" &&
                        "cursor-not-allowed bg-muted text-muted-foreground"
                    )}
                    dir="ltr"
                    placeholder={
                      ollamaMode === "cloud" ? OLLAMA_CLOUD_URL : OLLAMA_LOCAL_URL
                    }
                    readOnly={ollamaMode === "cloud"}
                    autoComplete="off"
                    data-1p-ignore
                    data-lpignore="true"
                    {...register("ollamaBaseUrl")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {ollamaMode === "cloud"
                      ? "نقطة نهاية Ollama Cloud المُدارة — تُعيَّن تلقائيًا."
                      : "مثال: http://localhost:11434/v1، أو رابط خادمك الذاتي."}
                  </p>
                </div>
                {chatProvider === "ollama" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">نموذج المحادثة</Label>
                    <Input
                      className="h-9 font-mono text-xs"
                      dir="ltr"
                      placeholder={
                        ollamaMode === "cloud" ? "gpt-oss:20b-cloud" : "llama3.1"
                      }
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      {...register("ollamaChatModel")}
                    />
                  </div>
                )}
                {embeddingProvider === "ollama" && ollamaMode === "local" && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">
                      نموذج التضمين
                    </Label>
                    <Input
                      className="h-9 font-mono text-xs"
                      dir="ltr"
                      placeholder="nomic-embed-text"
                      autoComplete="off"
                      data-1p-ignore
                      data-lpignore="true"
                      {...register("ollamaEmbeddingModel")}
                    />
                  </div>
                )}
                {embeddingProvider === "ollama" && ollamaMode === "cloud" && (
                  <div className="space-y-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 sm:col-span-2">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                          Ollama Cloud لا يولّد تضمينات
                        </p>
                        <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
                          السحابة تستضيف نماذج المحادثة فقط، لا يمكن تشغيل
                          بحث قاعدة المعرفة هنا. أبقِ المحادثة على Ollama Cloud
                          وولّد التضمينات عبر OpenAI بدلًا من ذلك.
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={useOpenAIForEmbeddings}
                      className="border-amber-500/40 bg-background"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span className="ms-1.5">استخدام OpenAI للتضمين</span>
                    </Button>
                  </div>
                )}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-medium">
                    {ollamaMode === "cloud" ? "مفتاح API" : "مفتاح API (اختياري)"}
                  </Label>
                  <Input
                    type="password"
                    className="h-9 font-mono text-xs"
                    dir="ltr"
                    placeholder={
                      ollamaMode === "cloud"
                        ? "الصق مفتاح Ollama Cloud"
                        : "اتركه فارغًا لـ Ollama المحلي"
                    }
                    autoComplete="new-password"
                    data-1p-ignore
                    data-lpignore="true"
                    {...register("ollamaApiKey")}
                  />
                  {ollamaMode === "cloud" && (
                    <p className="text-xs text-muted-foreground">
                      {settings.hasOllamaApiKey
                        ? "مخزّن مشفّرًا. اتركه دون تغيير للإبقاء على المفتاح الحالي."
                        : "مطلوب لـ Ollama Cloud."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Connection tests */}
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
            <span className="w-full text-xs font-medium text-muted-foreground sm:w-auto">
              اختبار الاتصال:
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTestChat}
              disabled={
                isTestingChat ||
                (chatProvider === "openai" && !settings.hasApiKey)
              }
            >
              {isTestingChat ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageCircle className="h-3.5 w-3.5" />
              )}
              <span className="ms-1.5">المحادثة</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={
                isTesting ||
                (embeddingProvider === "openai" && !settings.hasApiKey)
              }
            >
              {isTesting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Search className="h-3.5 w-3.5" />
              )}
              <span className="ms-1.5">التضمينات</span>
            </Button>
          </div>

          {/* Knowledge index — lives with the embedding settings that invalidate it */}
          <PanelActionRow
            label="فهرس المعرفة"
            description="أعد بناء التضمينات من أزواج السؤال والجواب ومقالات قاعدة المعرفة والخدمات والتذاكر المحلولة. شغّله بعد تغيير نموذج التضمين."
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReindex}
                disabled={isReindexing}
              >
                {isReindexing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3.5 w-3.5" />
                )}
                <span className="ms-1.5">إعادة الفهرسة</span>
              </Button>
            }
          />
        </CardContent>
      </Card>

      <Card id="tuning" className="scroll-mt-52">
        <CardHeader>
          <PanelCardHeading
            title="ضبط الردود"
            icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}
            description="كيف يولّد المساعد الإجابات ويطابقها. ينطبق على أي مزوّد مفعّل أعلاه."
          />
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-primary">
                {Math.round(threshold * 100)}%
              </span>
              <Label className="w-auto shrink-0 text-sm font-medium">عتبة الثقة</Label>
            </div>
            <Input
              type="range"
              min={0.5}
              max={0.95}
              step={0.01}
              className="accent-primary"
              {...register("confidenceThreshold", { valueAsNumber: true })}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>50%</span>
              <span>95%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              الحد الأدنى للتشابه لاعتبار مطابقة أداة lookup_faq واثقة.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">الحد الأقصى للرموز</Label>
            <Input
              type="number"
              className="h-9"
              {...register("maxTokens", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              الحد الأعلى لطول كل رد مُولَّد.
            </p>
            {errors.maxTokens && (
              <p className="text-xs text-destructive">
                {errors.maxTokens.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">درجة الحرارة</Label>
            <Input
              type="number"
              step={0.05}
              className="h-9"
              {...register("temperature", { valueAsNumber: true })}
            />
            <p className="text-xs text-muted-foreground">
              الأقل أكثر تركيزًا وحتمية؛ الأعلى أكثر إبداعًا.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card id="business" className="scroll-mt-52">
        <CardHeader>
          <PanelCardHeading
            title="سياق النشاط"
            icon={<Building2 className="h-4 w-4 text-primary" />}
            description="يُستخدم كأساس عند توليد الذكاء الاصطناعي للردود."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">اسم النشاط</Label>
            <Input
              className="h-9"
              placeholder="شركة أكمي"
              {...register("businessName")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">وصف النشاط</Label>
            <Textarea
              rows={3}
              className="resize-none text-sm"
              placeholder="وصف قصير لما يقدّمه نشاطك التجاري..."
              {...register("businessDescription")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">موجّه النظام</Label>
            <Textarea
              rows={5}
              className="resize-none text-sm font-mono"
              dir="rtl"
              {...register("systemPrompt")}
            />
          </div>
        </CardContent>
      </Card>

      <Card id="agent" className="scroll-mt-52">
        <CardHeader>
          <PanelCardHeading
            title="الوكيل المستقل"
            icon={<Sparkles className="h-4 w-4 text-primary" />}
            description="يفكّر الوكيل في أزواج السؤال والجواب والوثائق والتذاكر المحلولة، ويمكنه افتح تذكرة تصعيد وتعيينها تلقائياً."
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <PanelSwitchField
            label="الوكيل مفعّل"
            description="عند الإيقاف، يُعطّل روبوت المحادثة بالكامل."
            control={
              <Switch
                checked={agent.enabled}
                onCheckedChange={(v) =>
                  setValue("agent.enabled", v, { shouldDirty: true })
                }
              />
            }
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-primary">
                {agent.maxIterations}
              </span>
              <Label className="w-auto shrink-0 text-sm font-medium">الحد الأقصى لتكرارات الأدوات</Label>
            </div>
            <Input
              type="range"
              min={1}
              max={8}
              step={1}
              className="accent-primary"
              {...register("agent.maxIterations", { valueAsNumber: true })}
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>1</span>
              <span>8</span>
            </div>
            <p className="text-xs text-muted-foreground">
              أقصى خطوات تفكير/أدوات قبل أن يجيب الوكيل أو يُصعّد.
            </p>
          </div>

          <PanelSwitchField
            label="فهرسة التذاكر المحلولة"
            description="جعل محادثات التذاكر المحلولة (التعليقات العامة فقط) قابلة للبحث. تحتوي على محتوى العملاء — عطّلها إن لم ترغب بذلك."
            control={
              <Switch
                checked={agent.indexResolvedTickets}
                onCheckedChange={(v) =>
                  setValue("agent.indexResolvedTickets", v, { shouldDirty: true })
                }
              />
            }
          />
        </CardContent>
      </Card>

      <Card id="search" className="scroll-mt-52">
        <CardHeader>
          <PanelCardHeading
            title="البحث والميزات"
            icon={<LayoutGrid className="h-4 w-4 text-primary" />}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">طريقة البحث المتجهي</Label>
            <Select
              value={vectorMethod}
              onValueChange={(v) =>
                setValue(
                  "vectorSearchMethod",
                  v as FormData["vectorSearchMethod"],
                  { shouldDirty: true }
                )
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">جيب التمام المحلي (افتراضي)</SelectItem>
                <SelectItem value="qdrant">Qdrant (موصى به)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              <strong>المحلي</strong> يفحص كل المتجهات في الذاكرة — مناسب
              للمجموعات الصغيرة. <strong>Qdrant</strong> يفوّض البحث المتجهي
              إلى Qdrant ذاتي الاستضافة للتوسّع؛ عيّن{" "}
              <code className="text-[11px]">QDRANT_URL</code> في بيئتك، ثم
              انقر <em>مزامنة مع Qdrant</em> أدناه للتعبئة. إن تعذّر الوصول
              إلى Qdrant، يعود البحث إلى المحلي.
            </p>
            {health?.recommendQdrant && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                فهرس المعرفة لديك{" "}
                <strong>{health.vectorCount.toLocaleString()}</strong> متجهًا —
                تجاوز ~{health.warnThreshold.toLocaleString()} حيث يصبح جيب
                التمام المحلي (الذي يحمّل كل متجه في الذاكرة عند كل استعلام)
                بطيئًا ويستهلك ذاكرة. انتقل إلى <strong>Qdrant</strong>: عيّن{" "}
                <code className="text-[11px]">QDRANT_URL</code>، بدّل الطريقة
                أعلاه، ثم <em>مزامنة مع Qdrant</em>.
              </div>
            )}
            {vectorMethod === "qdrant" && (
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSyncQdrant}
                  disabled={isSyncingQdrant}
                >
                  {isSyncingQdrant ? (
                    <Loader2 className="me-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <DatabaseZap className="me-1.5 h-3.5 w-3.5" />
                  )}
                  مزامنة مع Qdrant
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">وضع الاسترجاع</Label>
            <Select
              value={searchMode}
              onValueChange={(v) =>
                setValue("searchMode", v as FormData["searchMode"], {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">
                  هجين (دلالي + كلمات مفتاحية)
                </SelectItem>
                <SelectItem value="vector">متجهي فقط (دلالي)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              يدمج الوضع الهجين التشابه المتجهي مع مطابقة الكلمات المفتاحية
              (دمج الرتبة المتبادل) — أفضل للمصطلحات الدقيقة مثل رموز الأخطاء
              وأسماء المنتجات. موصى به.
            </p>
          </div>

          <PanelSwitchField
            label="إعادة ترتيب النتائج"
            description="إعادة ترتيب أفضل المرشحين بنموذج المحادثة لدقة أعلى. يضيف زمنًا/تكلفة صغيرة لكل استعلام."
            control={
              <Switch
                checked={rerankEnabled}
                onCheckedChange={(v) =>
                  setValue("rerankEnabled", v, { shouldDirty: true })
                }
              />
            }
          />

          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4 text-right">
            <p className="text-xs font-medium text-muted-foreground">
              مفاتيح الميزات
            </p>
            {(
              [
                {
                  key: "chatbot",
                  label: "روبوت محادثة العملاء",
                  desc: "رد تلقائي على العملاء بإجابات مطابقة",
                },
                {
                  key: "agentSuggest",
                  label: "اقتراحات للوكلاء",
                  desc: "اقتراح ردود لوكلاء الدعم",
                },
                {
                  key: "ticketClassify",
                  label: "تصنيف التذاكر",
                  desc: "وسم التذاكر تلقائياً حسب الموضوع",
                },
                {
                  key: "guestLiveChat",
                  label: "محادثة مباشرة للزوار",
                  desc: "يتصل الزائر بموظف الدعم مباشرة عند توفرهم (بدون تسجيل)",
                },
              ] as const
            ).map((item) => (
              <PanelSwitchField
                key={item.key}
                className="border-0 bg-transparent p-0"
                label={item.label}
                description={item.desc}
                control={
                  <Switch
                    checked={features[item.key]}
                    onCheckedChange={(v) =>
                      setValue(`features.${item.key}`, v, { shouldDirty: true })
                    }
                  />
                }
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card id="widget" className="scroll-mt-52">
        <CardHeader>
          <PanelCardHeading
            title="الرسائل والحدود"
            icon={<MessageCircle className="h-4 w-4 text-primary" />}
            description={
              <>
                ما تقوله أداة المحادثة ومدى تكرار استخدام الزوار لها. للمظهر —
                الألوان والموضع والرأس والصورة — راجع تبويب{" "}
                <strong>الأداة</strong>.
              </>
            }
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">رسالة الترحيب</Label>
            <Textarea
              rows={2}
              className="resize-none text-sm"
              placeholder="مرحبًا! كيف يمكنني مساعدتك اليوم؟"
              {...register("chatbot.welcomeMessage")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">رسالة بديلة</Label>
            <Textarea
              rows={2}
              className="resize-none text-sm"
              placeholder="لم أجد إجابة. هل تريد التواصل مع الدعم؟"
              {...register("chatbot.fallbackMessage")}
            />
            <p className="text-xs text-muted-foreground">
              تُعرض عند عدم العثور على إجابة مطابقة. يظهر نموذج التذكرة مباشرة
              بعدها.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm font-medium">نص الحقل البديل</Label>
              <Input
                className="h-9"
                placeholder="اطرح سؤالًا..."
                {...register("chatbot.placeholder")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                حد المعدل / دقيقة
              </Label>
              <Input
                type="number"
                className="h-9"
                {...register("chatbot.rateLimitPerMinute", {
                  valueAsNumber: true,
                })}
              />
              <p className="text-xs text-muted-foreground">
                أقصى رسائل يمكن لزائر واحد إرسالها كل دقيقة.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                حد التذاكر / ساعة
              </Label>
              <Input
                type="number"
                className="h-9"
                {...register("chatbot.ticketRateLimitPerHour", {
                  valueAsNumber: true,
                })}
              />
              <p className="text-xs text-muted-foreground">
                أقصى تذاكر دعم يمكن للزائر فتحها كل ساعة.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PanelFormActions className="sticky bottom-4 z-10 rounded-lg border border-border bg-background/90 px-4 py-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/75">
            <p className="text-right text-xs text-muted-foreground" dir="rtl">
              {isDirty
                ? "لديك تغييرات غير محفوظة."
                : "تُطبَّق التغييرات بعد الحفظ."}
            </p>
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving && <Loader2 className="me-2 h-3.5 w-3.5 animate-spin" />}
              حفظ
            </Button>
          </PanelFormActions>
      </PanelFormLayout>
    </form>
  );
}
