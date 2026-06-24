import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import type {
  AISettings,
  AISettingsPublic,
  AIFeatureFlags,
  AIChatbotConfig,
  AIAgentConfig,
} from "@/types";
import { decryptApiKey, isLikelyValidApiKey } from "@/lib/ai/crypto";
import {
  DEFAULT_WIDGET_HEIGHT,
  DEFAULT_WIDGET_WIDTH,
} from "@/lib/ai/widget-theme";
import { ENS_BRAND } from "@/lib/ens-brand";

const COLLECTION = "ai_settings";

const DEFAULT_FEATURES: AIFeatureFlags = {
  chatbot: false,
  agentSuggest: true,
  ticketClassify: false,
};

export const DEFAULT_CHATBOT_CONFIG: AIChatbotConfig = {
  welcomeMessage: ENS_BRAND.aiWelcome,
  fallbackMessage:
    "لم أجد إجابة على ذلك في قاعدة معرفة ENS. هل تود التحدث مع فريق الدعم؟",
  placeholder: ENS_BRAND.aiPlaceholder,
  position: "bottom-left",
  primaryColor: "",
  accentColor: "",
  headerTitle: ENS_BRAND.aiAssistantName,
  footerText: ENS_BRAND.aiFooter,
  headerAvatarUrl: "",
  widgetWidth: DEFAULT_WIDGET_WIDTH,
  widgetHeight: DEFAULT_WIDGET_HEIGHT,
  rateLimitPerMinute: 20,
  ticketRateLimitPerHour: 3,
  showPoweredBy: false,
};

export const DEFAULT_SYSTEM_PROMPT =
  "أنت مساعد دعم ENS لعملاء الشركة. أجب بناءً على قاعدة معرفة ENS والسياق المقدم فقط. ساعد العملاء على فتح التذاكر ومتابعة الطلبات والعثور على الإجابات. إذا لم تجد إجابة مناسبة، أخبر العميل بلطف أنك ستوصله بفريق ENS. رد دائماً باللغة العربية.";

export const DEFAULT_OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";

export const DEFAULT_AGENT_CONFIG: AIAgentConfig = {
  enabled: true,
  maxIterations: 5,
  indexResolvedTickets: true,
};

function mergeAgentConfig(
  stored: Partial<AIAgentConfig> | undefined
): AIAgentConfig {
  return { ...DEFAULT_AGENT_CONFIG, ...(stored ?? {}) };
}

/**
 * Existing settings docs predate the provider/agent fields. Fill defaults
 * lazily so reads always see a complete, well-typed object.
 */
function normalizeAISettings(doc: AISettings): AISettings {
  return {
    ...doc,
    chatProvider: doc.chatProvider ?? "openai",
    embeddingProvider: doc.embeddingProvider ?? "openai",
    ollamaBaseUrl: doc.ollamaBaseUrl || DEFAULT_OLLAMA_BASE_URL,
    agent: mergeAgentConfig(doc.agent),
    chatbot: mergeChatbotConfig(doc.chatbot),
    reindexRequired: doc.reindexRequired ?? false,
    searchMode: doc.searchMode ?? "hybrid",
    rerankEnabled: doc.rerankEnabled ?? true,
    // "atlas" was a removed backend; map any legacy stored value to local so
    // old settings docs keep working without a migration.
    vectorSearchMethod:
      (doc.vectorSearchMethod as string) === "atlas"
        ? "local"
        : (doc.vectorSearchMethod ?? "local"),
  };
}

export function buildDefaultAISettings(): Omit<AISettings, "_id"> {
  const now = new Date();
  return {
    provider: "openai",
    apiKeyEncrypted: "",
    chatModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
    confidenceThreshold: 0.82,
    maxTokens: 500,
    temperature: 0.3,
    features: DEFAULT_FEATURES,
    businessName: "",
    businessDescription: "",
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    vectorSearchMethod: "local",
    chatbot: DEFAULT_CHATBOT_CONFIG,
    generativeMode: "hybrid",
    chatProvider: "openai",
    embeddingProvider: "openai",
    ollamaBaseUrl: DEFAULT_OLLAMA_BASE_URL,
    ollamaChatModel: "llama3.1",
    ollamaEmbeddingModel: "nomic-embed-text",
    agent: DEFAULT_AGENT_CONFIG,
    reindexRequired: false,
    searchMode: "hybrid",
    rerankEnabled: true,
    createdAt: now,
    updatedAt: now,
  };
}

function mergeChatbotConfig(
  stored: Partial<AIChatbotConfig> | undefined
): AIChatbotConfig {
  return { ...DEFAULT_CHATBOT_CONFIG, ...(stored ?? {}) };
}

export async function getAISettingsRaw(): Promise<AISettings | null> {
  const col = await getCollection<AISettings>(COLLECTION);
  const doc = await col.findOne({});
  return doc ? normalizeAISettings(doc) : null;
}

export async function getOrCreateAISettings(): Promise<AISettings> {
  const col = await getCollection<AISettings>(COLLECTION);
  const existing = await col.findOne({});
  if (existing) return normalizeAISettings(existing);

  const doc: AISettings = {
    _id: new ObjectId(),
    ...buildDefaultAISettings(),
  };
  await col.insertOne(doc);
  return doc;
}

export function toPublicAISettings(settings: AISettings): AISettingsPublic {
  const s = normalizeAISettings(settings);
  const key = decryptApiKey(s.apiKeyEncrypted);
  const hasKey = isLikelyValidApiKey(key);
  const ollamaKey = decryptApiKey(s.ollamaApiKeyEncrypted ?? "");
  return {
    chatModel: s.chatModel,
    embeddingModel: s.embeddingModel,
    confidenceThreshold: s.confidenceThreshold,
    maxTokens: s.maxTokens,
    temperature: s.temperature,
    features: s.features,
    businessName: s.businessName,
    businessDescription: s.businessDescription,
    systemPrompt: s.systemPrompt,
    vectorSearchMethod: s.vectorSearchMethod,
    chatbot: mergeChatbotConfig(s.chatbot),
    generativeMode: s.generativeMode ?? "hybrid",
    chatProvider: s.chatProvider,
    embeddingProvider: s.embeddingProvider,
    ollamaBaseUrl: s.ollamaBaseUrl,
    ollamaChatModel: s.ollamaChatModel ?? "",
    ollamaEmbeddingModel: s.ollamaEmbeddingModel ?? "",
    agent: s.agent,
    reindexRequired: s.reindexRequired ?? false,
    searchMode: s.searchMode ?? "hybrid",
    rerankEnabled: s.rerankEnabled ?? true,
    hasApiKey: hasKey,
    apiKeyPreview: hasKey ? `sk-...${key.slice(-4)}` : "",
    hasOllamaApiKey: !!ollamaKey,
  };
}

export function getChatbotConfig(settings: AISettings): AIChatbotConfig {
  return mergeChatbotConfig(settings.chatbot);
}

export function getDecryptedApiKey(settings: AISettings): string {
  return decryptApiKey(settings.apiKeyEncrypted);
}

export function getDecryptedOllamaApiKey(settings: AISettings): string {
  return decryptApiKey(settings.ollamaApiKeyEncrypted ?? "");
}
