import { getSystemSettings } from "@/lib/settings-utils";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "@/lib/strings";
import type { RequestKind } from "@/lib/request-utils";
import type { Ticket, TicketPriority, UserRole } from "@/types";

type NewTicketIntegrationPayload = {
  ticket: Ticket;
  kind: RequestKind;
  actorName: string;
  actorRole: UserRole;
  customerName: string;
  customerEmail?: string;
  customerCountry?: string;
  adminUrl: string;
  dashboardUrl?: string;
};

function formatLabel(value?: string) {
  const normalized = (value || "").trim();
  if (!normalized) return "غير معروف";

  if (normalized in PRIORITY_LABELS) {
    return PRIORITY_LABELS[normalized as TicketPriority];
  }
  if (normalized in CATEGORY_LABELS) {
    return CATEGORY_LABELS[normalized];
  }

  return normalized.replace(/[_-]+/g, " ");
}

function getRequestLabel(kind: RequestKind, serviceSlug?: string) {
  if (kind === "installation") return "طلب تركيب";
  if (kind === "customization") return "طلب تخصيص";
  if (kind === "service") return `طلب ${formatLabel(serviceSlug || "service")}`;
  return "تذكرة دعم";
}

function getRoleLabel(role: UserRole) {
  if (role === "admin") return "مسؤول";
  if (role === "support") return "دعم";
  return "عميل";
}

function trimText(value?: string, maxLength = 280) {
  const normalized = (value || "").trim();
  if (!normalized) return "مفيش وصف.";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

async function postWebhook(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });

  if (response.ok) return;

  const errorText = (await response.text().catch(() => "")).trim();
  throw new Error(
    errorText
      ? `Webhook request failed (${response.status}): ${errorText.slice(0, 300)}`
      : `Webhook request failed with status ${response.status}`,
  );
}

function buildDetails(payload: NewTicketIntegrationPayload) {
  const requestLabel = getRequestLabel(payload.kind, payload.ticket.serviceSlug);
  const createdAt = payload.ticket.createdAt.toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const details = [
    { label: "النوع", value: requestLabel },
    { label: "الأولوية", value: formatLabel(payload.ticket.priority) },
    { label: "الفئة", value: formatLabel(payload.ticket.category) },
    { label: "العميل", value: payload.customerName || "غير معروف" },
    {
      label: "أُنشئت بواسطة",
      value: `${payload.actorName} (${getRoleLabel(payload.actorRole)})`,
    },
    { label: "تاريخ الإنشاء", value: createdAt },
  ];

  if (payload.customerEmail) {
    details.push({ label: "الإيميل", value: payload.customerEmail });
  }

  if (payload.customerCountry) {
    details.push({ label: "الدولة", value: payload.customerCountry });
  }

  if (payload.ticket.productName) {
    details.push({ label: "المنتج", value: payload.ticket.productName });
  }

  if (payload.ticket.productVersion) {
    details.push({ label: "الإصدار", value: payload.ticket.productVersion });
  }

  if (payload.ticket.purchaseCode) {
    details.push({ label: "رمز الشراء", value: payload.ticket.purchaseCode });
  }

  return { requestLabel, createdAt, details };
}

function buildSlackPayload(payload: NewTicketIntegrationPayload) {
  const { requestLabel, details } = buildDetails(payload);
  const summary = trimText(payload.ticket.description);
  const detailText = details
    .map((detail) => `• *${detail.label}:* ${detail.value}`)
    .join("\n");

  return {
    text: `${requestLabel} جديد: ${payload.ticket.ticketNumber} - ${payload.ticket.title}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🎫 ${requestLabel} جديد`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${payload.ticket.ticketNumber}* — *${payload.ticket.title}*\n${summary}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: detailText,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${payload.adminUrl}|فتح في لوحة الإدارة>${
            payload.dashboardUrl ? ` • <${payload.dashboardUrl}|فتح عرض العميل>` : ""
          }`,
        },
      },
    ],
  };
}

function buildDiscordPayload(payload: NewTicketIntegrationPayload) {
  const { requestLabel, details } = buildDetails(payload);

  return {
    content: `🎫 ${requestLabel} جديد: ${payload.ticket.ticketNumber}`,
    embeds: [
      {
        title: `${payload.ticket.ticketNumber} — ${payload.ticket.title}`,
        url: payload.adminUrl,
        description: trimText(payload.ticket.description, 400),
        color: 5814783,
        fields: details.map((detail) => ({
          name: detail.label,
          value: detail.value,
          inline: detail.label !== "تاريخ الإنشاء",
        })),
        footer: {
          text: requestLabel,
        },
        timestamp: payload.ticket.createdAt.toISOString(),
      },
    ],
  };
}

export async function sendSlackTestNotification(webhookUrl: string) {
  return postWebhook(webhookUrl, {
    text: "نجح اختبار تكامل Slack!",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*اختبار تكامل Slack*\n\nتم ربط webhook إشعارات التذاكر.",
        },
      },
    ],
  });
}

export async function sendDiscordTestNotification(webhookUrl: string) {
  return postWebhook(webhookUrl, {
    content: "نجح اختبار تكامل Discord!",
    embeds: [
      {
        title: "اختبار تكامل Discord",
        description: "تم ربط webhook إشعارات التذاكر.",
        color: 5793266,
        timestamp: new Date().toISOString(),
      },
    ],
  });
}

export async function sendNewTicketIntegrationNotifications(
  payload: NewTicketIntegrationPayload,
) {
  const settings = await getSystemSettings();
  const jobs: Promise<void>[] = [];

  if (
    settings.integrations.slack.enabled &&
    settings.integrations.slack.notifyOnNewTicket &&
    settings.integrations.slack.webhookUrl
  ) {
    jobs.push(
      postWebhook(
        settings.integrations.slack.webhookUrl,
        buildSlackPayload(payload),
      ),
    );
  }

  if (
    settings.integrations.discord.enabled &&
    settings.integrations.discord.notifyOnNewTicket &&
    settings.integrations.discord.webhookUrl
  ) {
    jobs.push(
      postWebhook(
        settings.integrations.discord.webhookUrl,
        buildDiscordPayload(payload),
      ),
    );
  }

  if (!jobs.length) return;

  const results = await Promise.allSettled(jobs);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to send ticket integration notification:", result.reason);
    }
  }
}
