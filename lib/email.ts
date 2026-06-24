import nodemailer from "nodemailer";
import type { SystemSettings } from "@/types/settings";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/strings";
import { ENS_BRAND } from "@/lib/ens-brand";
import type { TicketPriority } from "@/types";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailNotificationKey =
  | "newTicket"
  | "ticketUpdate"
  | "newComment"
  | "ticketAssignment"
  | "ticketResolution";

const emailSettingByNotificationKey: Record<
  EmailNotificationKey,
  keyof SystemSettings["email"]
> = {
  newTicket: "notifyOnNewTicket",
  ticketUpdate: "notifyOnTicketUpdate",
  newComment: "notifyOnNewComment",
  ticketAssignment: "notifyOnTicketAssignment",
  ticketResolution: "notifyOnTicketResolution",
};

const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

/** Centered call-to-action button used by customer-facing ticket emails. */
function ticketLinkButton(url: string | undefined, label: string): string {
  if (!url) return "";
  return `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(url)}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">${escapeHtml(label)}</a>
        </div>`;
}

export function isEmailServiceEnabled(settings: SystemSettings): boolean {
  const envFlag = process.env.EMAIL_NOTIFICATIONS_ENABLED;
  if (envFlag === "true") return true;
  if (envFlag === "false") return false;
  return Boolean(settings.email?.enabled);
}

export async function shouldSendEmailNotification(
  key: EmailNotificationKey
): Promise<{ enabled: boolean; settings: SystemSettings }> {
  const { getSystemSettings } = await import("@/lib/settings-utils");
  const settings = await getSystemSettings();
  const eventSettingKey = emailSettingByNotificationKey[key];

  return {
    settings,
    enabled:
      isEmailServiceEnabled(settings) && Boolean(settings.email?.[eventSettingKey]),
  };
}

// Create reusable transporter
const createTransporter = () => {
  if (!process.env.EMAIL_SERVER_HOST) {
    throw new Error("Email server configuration is missing");
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    secure: process.env.EMAIL_SERVER_PORT === "465", // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  // Check if email notifications are enabled
  if (process.env.EMAIL_NOTIFICATIONS_ENABLED === "false") {
    return { success: false, message: "Email notifications disabled" };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    });

    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error sending email to ${to}:`, err.message);
    return { success: false, error: err };
  }
}

// Email templates
export const emailTemplates = {
  ticketCreated: (ticketNumber: string, title: string, viewUrl?: string) => ({
    subject: `تذكرة جديدة: ${ticketNumber} - ${title}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">تذكرتك اتعملت</h2>
        <p>شكراً على تواصلك — تذكرة الدعم جاهزة وهنراجعها ونرجعلك في أقرب وقت.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>رقم التذكرة:</strong> ${escapeHtml(ticketNumber)}</p>
          <p style="margin: 5px 0;"><strong>العنوان:</strong> ${escapeHtml(title)}</p>
          <p style="margin: 5px 0;"><strong>الحالة:</strong> <span style="color: #10b981;">${STATUS_LABELS.open}</span></p>
        </div>
        <p>سنراجع تذكرتك ونعود إليك في أقرب وقت.${
          viewUrl
            ? " استخدم الزر تحت عشان تشوف الحالة وترد في أي وقت — من غير حساب."
            : " تقدر تتابع التذكرة من حسابك."
        }</p>
        ${ticketLinkButton(viewUrl, "عرض تذكرتك")}
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          رسالة تلقائية — متردّش على الإيميل ده.
        </p>
      </div>
    `,
  }),

  ticketStatusChanged: (
    ticketNumber: string,
    title: string,
    oldStatus: string,
    newStatus: string,
    message?: string,
    viewUrl?: string
  ) => ({
    subject: `تحدّثت حالة التذكرة: ${ticketNumber}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">حالة التذكرة اتحدّثت</h2>
        <p>حالة تذكرة الدعم بتاعتك اتغيّرت.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>رقم التذكرة:</strong> ${escapeHtml(ticketNumber)}</p>
          <p style="margin: 5px 0;"><strong>العنوان:</strong> ${escapeHtml(title)}</p>
          <p style="margin: 5px 0;"><strong>الحالة السابقة:</strong> ${escapeHtml(oldStatus)}</p>
          <p style="margin: 5px 0;"><strong>الحالة الجديدة:</strong> <span style="color: #0070f3;">${escapeHtml(newStatus)}</span></p>
        </div>
        ${
          message
            ? `
        <div style="background-color: #f0f9ff; border-right: 4px solid #0070f3; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 5px 0; font-weight: bold; color: #0070f3;">رسالة من الدعم:</p>
          <p style="margin: 0; white-space: pre-wrap;">${escapeHtml(message)}</p>
        </div>
        `
            : ""
        }
        ${ticketLinkButton(viewUrl, "عرض تذكرتك")}
        <p>${
          viewUrl
            ? "استخدم الزر فوق عشان تشوف آخر التفاصيل وترد."
            : "سجّل دخولك عشان تشوف تفاصيل التذكرة."
        }</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          رسالة تلقائية — متردّش على الإيميل ده.
        </p>
      </div>
    `,
  }),

  newComment: (
    ticketNumber: string,
    title: string,
    commenterName: string,
    commentContent: string,
    viewUrl?: string
  ) => ({
    subject: `تعليق جديد على التذكرة: ${ticketNumber}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">تعليق جديد على تذكرتك</h2>
        <p>أضاف ${escapeHtml(commenterName)} تعليق على تذكرتك.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>رقم التذكرة:</strong> ${escapeHtml(ticketNumber)}</p>
          <p style="margin: 5px 0;"><strong>العنوان:</strong> ${escapeHtml(title)}</p>
        </div>
        <div style="background-color: #f0f9ff; border-right: 4px solid #0070f3; padding: 15px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #0070f3;">تعليق من ${escapeHtml(commenterName)}:</p>
          <p style="margin: 0; white-space: pre-wrap; color: #333;">${escapeHtml(commentContent)}</p>
        </div>
        ${ticketLinkButton(viewUrl, "عرض والرد")}
        <p>${
          viewUrl
            ? "استخدم الزر فوق عشان تشوف المحادثة وترد — من غير حساب."
            : "سجّل دخولك عشان ترد على التعليق."
        }</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          رسالة تلقائية — متردّش على الإيميل ده.
        </p>
      </div>
    `,
  }),

  ticketAssigned: (
    ticketNumber: string,
    title: string,
    assigneeName: string,
    ticketUrl?: string
  ) => ({
    subject: `اتعيّنتلك تذكرة: ${ticketNumber}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">تذكرة جديدة معيّنة ليك</h2>
        <p>اتعيّنتلك تذكرة دعم.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>رقم التذكرة:</strong> ${escapeHtml(ticketNumber)}</p>
          <p style="margin: 5px 0;"><strong>العنوان:</strong> ${escapeHtml(title)}</p>
          <p style="margin: 5px 0;"><strong>معيّنة إلى:</strong> ${escapeHtml(assigneeName)}</p>
        </div>
        ${
          ticketUrl
            ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(ticketUrl)}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">عرض التذكرة</a>
        </div>
        `
            : ""
        }
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          رسالة تلقائية — متردّش على الإيميل ده.
        </p>
      </div>
    `,
  }),

  meetingScheduled: (
    ticketNumber: string,
    title: string,
    meetingTitle: string,
    scheduledAt: string,
    duration: number,
    platform: string,
    meetingLink?: string,
    timezone?: string,
    description?: string
  ) => ({
    subject: `اجتماع مجدول للتذكرة: ${ticketNumber}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">اتجدول اجتماع لتذكرتك</h2>
        <p>اتجدول اجتماع لمناقشة تذكرتك.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>رقم التذكرة:</strong> ${escapeHtml(ticketNumber)}</p>
          <p style="margin: 5px 0;"><strong>عنوان التذكرة:</strong> ${escapeHtml(title)}</p>
        </div>
        <div style="background-color: #f0f9ff; border-right: 4px solid #9333ea; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #9333ea;">تفاصيل الاجتماع</h3>
          <p style="margin: 5px 0;"><strong>عنوان الاجتماع:</strong> ${escapeHtml(meetingTitle)}</p>
          <p style="margin: 5px 0;"><strong>التاريخ والوقت:</strong> ${escapeHtml(scheduledAt)}</p>
          <p style="margin: 5px 0;"><strong>المدة:</strong> ${escapeHtml(duration)} دقيقة</p>
          <p style="margin: 5px 0;"><strong>المنصة:</strong> ${
            platform === "zoom" ? "Zoom" : "Google Meet"
          }</p>
          ${
            timezone
              ? `<p style="margin: 5px 0;"><strong>المنطقة الزمنية:</strong> ${escapeHtml(timezone)}</p>`
              : ""
          }
          ${
            description
              ? `<p style="margin: 10px 0 5px 0;"><strong>الوصف:</strong></p><p style="margin: 5px 0; white-space: pre-wrap;">${escapeHtml(description)}</p>`
              : ""
          }
        </div>
        ${
          meetingLink
            ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(meetingLink)}" style="display: inline-block; background-color: #9333ea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">انضم إلى الاجتماع</a>
        </div>
        <p style="text-align: center; color: #666; font-size: 14px;">
          رابط الاجتماع: <a href="${escapeHtml(meetingLink)}" style="color: #9333ea;">${escapeHtml(meetingLink)}</a>
        </p>
        `
            : ""
        }
        <p>انضم للاجتماع في المعاد. تقدر تشوف التفاصيل من حسابك.</p>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          رسالة تلقائية — متردّش على الإيميل ده.
        </p>
      </div>
    `,
  }),

  meetingUpdated: (
    ticketNumber: string,
    title: string,
    meetingTitle: string,
    updatedFields: Record<string, string | number>,
    meetingLink?: string
  ) => ({
    subject: `اتحدّث الاجتماع للتذكرة: ${ticketNumber}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">تفاصيل الاجتماع اتحدّثت</h2>
        <p>الاجتماع المرتبط بتذكرتك اتغيّر.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>رقم التذكرة:</strong> ${escapeHtml(ticketNumber)}</p>
          <p style="margin: 5px 0;"><strong>عنوان التذكرة:</strong> ${escapeHtml(title)}</p>
          <p style="margin: 5px 0;"><strong>عنوان الاجتماع:</strong> ${escapeHtml(meetingTitle)}</p>
        </div>
        <div style="background-color: #f0f9ff; border-right: 4px solid #0070f3; padding: 15px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #0070f3;">الحقول المحدّثة</h3>
          ${Object.entries(updatedFields)
            .map(
              ([key, value]) =>
                `<p style="margin: 5px 0;"><strong>${escapeHtml(key)}:</strong> ${escapeHtml(
                  value
                )}</p>`
            )
            .join("")}
        </div>
        ${
          meetingLink
            ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(meetingLink)}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">فتح الاجتماع</a>
        </div>
        `
            : ""
        }
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          رسالة تلقائية — متردّش على الإيميل ده.
        </p>
      </div>
    `,
  }),

  attachmentUploaded: (
    ticketNumber: string,
    title: string,
    uploaderName: string,
    filename: string,
    ticketUrl: string
  ) => ({
    subject: `تم رفع مرفق: ${filename} على التذكرة ${ticketNumber}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">مرفق جديد على تذكرتك</h2>
        <p>رفع ${escapeHtml(uploaderName)} ملف على تذكرتك.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>رقم التذكرة:</strong> ${escapeHtml(ticketNumber)}</p>
          <p style="margin: 5px 0;"><strong>العنوان:</strong> ${escapeHtml(title)}</p>
          <p style="margin: 5px 0;"><strong>الملف:</strong> ${escapeHtml(filename)}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(ticketUrl)}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">عرض التذكرة</a>
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          رسالة تلقائية — متردّش على الإيميل ده.
        </p>
      </div>
    `,
  }),

  // Admin notification for new ticket
  adminNewTicketNotification: (
    ticketNumber: string,
    title: string,
    description: string,
    customerName: string,
    customerEmail: string,
    customerCountry: string | undefined,
    priority: string,
    category: string,
    productName: string | undefined,
    productVersion: string | undefined,
    purchaseCode: string | undefined,
    createdAt: string,
    ticketUrl: string
  ) => ({
    subject: `🎫 تذكرة دعم جديدة: ${ticketNumber} - ${title}`,
    html: `
      <div dir="rtl" lang="ar" style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎫 تذكرة دعم جديدة</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px; background-color: #f9fafb;">
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            وصلت تذكرة دعم جديدة ومحتاجة متابعة.
          </p>

          <!-- Ticket Information -->
          <div style="background-color: #ffffff; border-right: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px;">تفاصيل التذكرة</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600; width: 140px;">رقم التذكرة:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: bold;">${escapeHtml(ticketNumber)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">العنوان:</td>
                <td style="padding: 8px 0; color: #111827;">${escapeHtml(title)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">الأولوية:</td>
                <td style="padding: 8px 0;">
                  <span style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; ${
                    priority === "urgent"
                      ? "background-color: #fee2e2; color: #991b1b;"
                      : priority === "high"
                      ? "background-color: #fed7aa; color: #9a3412;"
                      : priority === "medium"
                      ? "background-color: #fef3c7; color: #92400e;"
                      : "background-color: #dbeafe; color: #1e40af;"
                  }">
                    ${escapeHtml(PRIORITY_LABELS[priority as TicketPriority] ?? priority)}
                  </span>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">الفئة:</td>
                <td style="padding: 8px 0; color: #111827;">${escapeHtml(
                  CATEGORY_LABELS[category] ??
                    category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                )}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">تاريخ الإنشاء:</td>
                <td style="padding: 8px 0; color: #111827;">${escapeHtml(createdAt)}</td>
              </tr>
            </table>
          </div>

          <!-- Customer Information -->
          <div style="background-color: #ffffff; border-right: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px;">معلومات العميل</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600; width: 140px;">الاسم:</td>
                <td style="padding: 8px 0; color: #111827;">${escapeHtml(customerName)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">الإيميل:</td>
                <td style="padding: 8px 0;"><a href="mailto:${escapeHtml(customerEmail)}" style="color: #667eea; text-decoration: none;">${escapeHtml(customerEmail)}</a></td>
              </tr>
              ${
                customerCountry
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">الدولة:</td>
                <td style="padding: 8px 0; color: #111827;">${escapeHtml(customerCountry)}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>

          ${
            productName || productVersion || purchaseCode
              ? `
          <!-- Product Information -->
          <div style="background-color: #ffffff; border-right: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px;">معلومات المنتج</h2>
            <table style="width: 100%; border-collapse: collapse;">
              ${
                productName
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600; width: 140px;">المنتج:</td>
                <td style="padding: 8px 0; color: #111827;">${escapeHtml(productName)}</td>
              </tr>
              `
                  : ""
              }
              ${
                productVersion
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">الإصدار:</td>
                <td style="padding: 8px 0; color: #111827;">${escapeHtml(productVersion)}</td>
              </tr>
              `
                  : ""
              }
              ${
                purchaseCode
                  ? `
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">رمز الشراء:</td>
                <td style="padding: 8px 0; color: #111827; font-family: monospace; font-size: 12px;">${escapeHtml(purchaseCode)}</td>
              </tr>
              `
                  : ""
              }
            </table>
          </div>
          `
              : ""
          }

          <!-- Description -->
          <div style="background-color: #ffffff; border-right: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 18px;">الوصف</h2>
            <div style="color: #374151; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">${escapeHtml(description)}</div>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${escapeHtml(ticketUrl)}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
              عرض التذكرة
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 20px;">
            اضغط الزر فوق عشان تشوف التذكرة وترد من لوحة الإدارة.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            إشعار تلقائي من ${ENS_BRAND.portalTitle}.
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
            متردّش على الإيميل ده.
          </p>
        </div>
      </div>
    `,
  }),
};
