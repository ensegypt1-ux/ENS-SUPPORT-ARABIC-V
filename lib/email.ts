import nodemailer from "nodemailer";
import type { SystemSettings } from "@/types/settings";
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from "@/lib/strings";
import type { TicketPriority } from "@/types";
import {
  emailBadge,
  emailButton,
  emailCallout,
  emailDetailRow,
  emailDetailsBox,
  emailHeading,
  emailLayout,
  emailParagraph,
  emailSecondaryLink,
  emailSectionTitle,
  emailSteps,
  escapeHtml,
  resolveEmailBrand,
  type EmailBrandContext,
} from "@/lib/email-layout";

export { escapeHtml };

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

function priorityBadge(priority: string): string {
  const styles: Record<string, [string, string]> = {
    urgent: ["#991b1b", "#fee2e2"],
    high: ["#9a3412", "#fed7aa"],
    medium: ["#92400e", "#fef3c7"],
    low: ["#1e40af", "#dbeafe"],
  };
  const [color, bg] = styles[priority] ?? ["#1e40af", "#dbeafe"];
  const label = PRIORITY_LABELS[priority as TicketPriority] ?? priority;
  return emailBadge(label, color, bg);
}

function categoryLabel(category: string): string {
  return (
    CATEGORY_LABELS[category] ??
    category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

export function isEmailServiceEnabled(settings: SystemSettings): boolean {
  const envFlag = process.env.EMAIL_NOTIFICATIONS_ENABLED;
  if (envFlag === "true") return true;
  if (envFlag === "false") return false;
  return Boolean(settings.email?.enabled);
}

export function isEmailEnvKillSwitchActive(): boolean {
  return process.env.EMAIL_NOTIFICATIONS_ENABLED === "false";
}

export function isEmailSmtpConfigured(): boolean {
  return Boolean(
    process.env.EMAIL_SERVER_HOST &&
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD &&
      process.env.EMAIL_FROM
  );
}

export function getEmailDisabledReason(
  settings: SystemSettings
): string | null {
  if (isEmailEnvKillSwitchActive()) {
    return "البريد معطّل على مستوى الخادم (EMAIL_NOTIFICATIONS_ENABLED=false). عيّن القيمة true في .env.local أو احذف السطر للاعتماد على إعدادات لوحة التحكم.";
  }

  if (!settings.email?.enabled) {
    return "إشعارات البريد معطّلة في إعدادات لوحة التحكم.";
  }

  if (!isEmailSmtpConfigured()) {
    return "إعدادات خادم البريد غير مكتملة. راجع EMAIL_SERVER_* و EMAIL_FROM في .env.local.";
  }

  return null;
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

const createTransporter = () => {
  if (!process.env.EMAIL_SERVER_HOST) {
    throw new Error("إعدادات خادم البريد غير مكتملة");
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    secure: process.env.EMAIL_SERVER_PORT === "465",
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });
};

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const { getSystemSettings } = await import("@/lib/settings-utils");
  const settings = await getSystemSettings();
  const disabledReason = getEmailDisabledReason(settings);

  if (disabledReason) {
    return { success: false, message: disabledReason };
  }

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    return { success: true, messageId: info.messageId };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Error sending email to ${to}:`, err.message);
    return { success: false, error: err };
  }
}

export const emailTemplates = {
  ticketCreated: async (
    ticketNumber: string,
    title: string,
    viewUrl?: string
  ) => {
    const brand = await resolveEmailBrand();
    const openBadge = emailBadge(
      STATUS_LABELS.open,
      "#059669",
      "#ecfdf5"
    );

    const bodyHtml = `
      ${emailHeading("تم استلام تذكرتك", "شكرًا لتواصلك مع فريق دعم ENS. راجعنا طلبك وسنرد عليك في أقرب وقت ممكن.")}
      ${emailDetailsBox(`
        ${emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true })}
        ${emailDetailRow("العنوان", title)}
        ${emailDetailRow("الحالة", openBadge, { html: true })}
      `)}
      ${emailSteps([
        "راجع تفاصيل التذكرة عبر الرابط أدناه.",
        "أضف أي معلومات إضافية إذا لزم الأمر.",
        "تابع البريد الإلكتروني لتحديثات الحالة والردود.",
      ])}
      ${viewUrl ? emailButton(viewUrl, "عرض التذكرة") : ""}
      ${viewUrl ? emailParagraph("يمكنك متابعة التذكرة والرد في أي وقت — دون الحاجة إلى حساب.") : emailParagraph("يمكنك متابعة التذكرة من حسابك في بوابة الدعم.")}`;

    return {
      subject: `تذكرة جديدة: ${ticketNumber} — ${title}`,
      html: emailLayout({
        title: "تم استلام تذكرتك",
        preheader: `تم إنشاء تذكرة ${ticketNumber} بنجاح. فريق الدعم سيراجعها قريبًا.`,
        bodyHtml,
        brand,
      }),
    };
  },

  ticketStatusChanged: async (
    ticketNumber: string,
    title: string,
    oldStatus: string,
    newStatus: string,
    message?: string,
    viewUrl?: string
  ) => {
    const brand = await resolveEmailBrand();

    const bodyHtml = `
      ${emailHeading("تحدّثت حالة التذكرة", "تم تغيير حالة تذكرة الدعم الخاصة بك.")}
      ${emailDetailsBox(`
        ${emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true })}
        ${emailDetailRow("العنوان", title)}
        ${emailDetailRow("الحالة السابقة", oldStatus)}
        ${emailDetailRow("الحالة الجديدة", newStatus, { highlight: "#1d4ed8" })}
      `)}
      ${
        message
          ? emailCallout("رسالة من فريق الدعم", escapeHtml(message))
          : ""
      }
      ${viewUrl ? emailButton(viewUrl, "عرض التذكرة") : ""}
      ${emailParagraph(
        viewUrl
          ? "استخدم الزر أعلاه لمشاهدة آخر التفاصيل والرد على الفريق."
          : "سجّل دخولك إلى بوابة الدعم لمشاهدة تفاصيل التذكرة."
      )}`;

    return {
      subject: `تحدّثت حالة التذكرة: ${ticketNumber}`,
      html: emailLayout({
        title: "تحدّثت حالة التذكرة",
        preheader: `حالة التذكرة ${ticketNumber} أصبحت: ${newStatus}`,
        bodyHtml,
        brand,
      }),
    };
  },

  newComment: async (
    ticketNumber: string,
    title: string,
    commenterName: string,
    commentContent: string,
    viewUrl?: string
  ) => {
    const brand = await resolveEmailBrand();

    const bodyHtml = `
      ${emailHeading("تعليق جديد على تذكرتك", `أضاف ${commenterName} ردًا جديدًا على تذكرتك.`)}
      ${emailDetailsBox(`
        ${emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true })}
        ${emailDetailRow("العنوان", title)}
      `)}
      ${emailCallout(`تعليق من ${commenterName}`, escapeHtml(commentContent))}
      ${viewUrl ? emailButton(viewUrl, "عرض التذكرة والرد") : ""}
      ${emailParagraph(
        viewUrl
          ? "يمكنك مشاهدة المحادثة والرد مباشرة عبر الرابط — دون حساب."
          : "سجّل دخولك إلى بوابة الدعم للرد على التعليق."
      )}`;

    return {
      subject: `تعليق جديد على التذكرة: ${ticketNumber}`,
      html: emailLayout({
        title: "تعليق جديد على تذكرتك",
        preheader: `${commenterName} أضاف تعليقًا على التذكرة ${ticketNumber}`,
        bodyHtml,
        brand,
      }),
    };
  },

  ticketAssigned: async (
    ticketNumber: string,
    title: string,
    assigneeName: string,
    ticketUrl?: string
  ) => {
    const brand = await resolveEmailBrand();

    const bodyHtml = `
      ${emailHeading("تذكرة جديدة مُعيَّنة لك", "تم تعيين تذكرة دعم لك للمتابعة.")}
      ${emailDetailsBox(`
        ${emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true })}
        ${emailDetailRow("العنوان", title)}
        ${emailDetailRow("مُعيَّنة إلى", assigneeName)}
      `)}
      ${ticketUrl ? emailButton(ticketUrl, "فتح التذكرة") : ""}`;

    return {
      subject: `تذكرة مُعيَّنة: ${ticketNumber}`,
      html: emailLayout({
        title: "تذكرة جديدة مُعيَّنة لك",
        preheader: `تم تعيين التذكرة ${ticketNumber} إلى ${assigneeName}`,
        bodyHtml,
        brand,
      }),
    };
  },

  meetingScheduled: async (
    ticketNumber: string,
    title: string,
    meetingTitle: string,
    scheduledAt: string,
    duration: number,
    platform: string,
    meetingLink?: string,
    timezone?: string,
    description?: string
  ) => {
    const brand = await resolveEmailBrand();
    const platformLabel = platform === "zoom" ? "Zoom" : "Google Meet";

    const meetingDetails = [
      emailDetailRow("عنوان الاجتماع", meetingTitle),
      emailDetailRow("التاريخ والوقت", scheduledAt),
      emailDetailRow("المدة", `${duration} دقيقة`),
      emailDetailRow("المنصة", platformLabel),
      ...(timezone ? [emailDetailRow("المنطقة الزمنية", timezone)] : []),
    ].join("");

    const bodyHtml = `
      ${emailHeading("تم جدولة اجتماع", "تم تحديد موعد اجتماع لمناقشة تذكرتك.")}
      ${emailDetailsBox(`
        ${emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true })}
        ${emailDetailRow("عنوان التذكرة", title)}
      `)}
      ${emailSectionTitle("تفاصيل الاجتماع")}
      ${emailDetailsBox(meetingDetails)}
      ${
        description
          ? emailCallout("وصف الاجتماع", escapeHtml(description), "#0ea5e9")
          : ""
      }
      ${meetingLink ? emailButton(meetingLink, "انضم إلى الاجتماع") : ""}
      ${meetingLink ? emailSecondaryLink(meetingLink, meetingLink) : ""}
      ${emailParagraph("يرجى الانضمام في الموعد المحدّد. يمكنك أيضًا مراجعة التفاصيل من بوابة الدعم.")}`;

    return {
      subject: `اجتماع مجدول للتذكرة: ${ticketNumber}`,
      html: emailLayout({
        title: "تم جدولة اجتماع",
        preheader: `اجتماع «${meetingTitle}» بتاريخ ${scheduledAt}`,
        bodyHtml,
        brand,
      }),
    };
  },

  meetingUpdated: async (
    ticketNumber: string,
    title: string,
    meetingTitle: string,
    updatedFields: Record<string, string | number>,
    meetingLink?: string
  ) => {
    const brand = await resolveEmailBrand();

    const updatesHtml = Object.entries(updatedFields)
      .map(([key, value]) => emailDetailRow(key, String(value)))
      .join("");

    const bodyHtml = `
      ${emailHeading("تحدّثت تفاصيل الاجتماع", "تم تعديل موعد أو تفاصيل الاجتماع المرتبط بتذكرتك.")}
      ${emailDetailsBox(`
        ${emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true })}
        ${emailDetailRow("عنوان التذكرة", title)}
        ${emailDetailRow("عنوان الاجتماع", meetingTitle)}
      `)}
      ${emailSectionTitle("الحقول المُحدَّثة")}
      ${emailDetailsBox(updatesHtml)}
      ${meetingLink ? emailButton(meetingLink, "فتح الاجتماع") : ""}`;

    return {
      subject: `تحدّث الاجتماع للتذكرة: ${ticketNumber}`,
      html: emailLayout({
        title: "تحدّثت تفاصيل الاجتماع",
        preheader: `تم تحديث اجتماع «${meetingTitle}» للتذكرة ${ticketNumber}`,
        bodyHtml,
        brand,
      }),
    };
  },

  attachmentUploaded: async (
    ticketNumber: string,
    title: string,
    uploaderName: string,
    filename: string,
    ticketUrl: string
  ) => {
    const brand = await resolveEmailBrand();

    const bodyHtml = `
      ${emailHeading("مرفق جديد على تذكرتك", `رفع ${uploaderName} ملفًا جديدًا على تذكرتك.`)}
      ${emailDetailsBox(`
        ${emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true })}
        ${emailDetailRow("العنوان", title)}
        ${emailDetailRow("اسم الملف", filename, { ltr: true })}
      `)}
      ${emailButton(ticketUrl, "عرض التذكرة")}`;

    return {
      subject: `مرفق جديد: ${filename} — التذكرة ${ticketNumber}`,
      html: emailLayout({
        title: "مرفق جديد على تذكرتك",
        preheader: `${uploaderName} رفع ملف «${filename}» على التذكرة ${ticketNumber}`,
        bodyHtml,
        brand,
      }),
    };
  },

  adminNewTicketNotification: async (
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
  ) => {
    const brand = await resolveEmailBrand();

    const ticketRows = [
      emailDetailRow("رقم التذكرة", ticketNumber, { ltr: true }),
      emailDetailRow("العنوان", title),
      emailDetailRow("الأولوية", priorityBadge(priority), { html: true }),
      emailDetailRow("الفئة", categoryLabel(category)),
      emailDetailRow("تاريخ الإنشاء", createdAt),
    ].join("");

    const customerRows = [
      emailDetailRow("الاسم", customerName),
      emailDetailRow("البريد الإلكتروني", customerEmail, { ltr: true }),
      ...(customerCountry ? [emailDetailRow("الدولة", customerCountry)] : []),
    ].join("");

    const productRows =
      productName || productVersion || purchaseCode
        ? [
            ...(productName ? [emailDetailRow("المنتج", productName)] : []),
            ...(productVersion
              ? [emailDetailRow("الإصدار", productVersion, { ltr: true })]
              : []),
            ...(purchaseCode
              ? [emailDetailRow("رمز الشراء", purchaseCode, { ltr: true })]
              : []),
          ].join("")
        : "";

    const bodyHtml = `
      ${emailHeading("تذكرة دعم جديدة", "وصلت تذكرة جديدة وتحتاج إلى مراجعة من فريق الدعم.")}
      ${emailSectionTitle("تفاصيل التذكرة")}
      ${emailDetailsBox(ticketRows)}
      ${emailSectionTitle("معلومات العميل")}
      ${emailDetailsBox(customerRows)}
      ${
        productRows
          ? `${emailSectionTitle("معلومات المنتج")}${emailDetailsBox(productRows)}`
          : ""
      }
      ${emailSectionTitle("الوصف")}
      ${emailCallout("", escapeHtml(description), "#6366f1")}
      ${emailButton(ticketUrl, "فتح التذكرة في لوحة الإدارة")}
      ${emailParagraph("راجع التذكرة وعيِّنها أو رُد عليها من لوحة الإدارة.")}`;

    return {
      subject: `تذكرة دعم جديدة: ${ticketNumber} — ${title}`,
      html: emailLayout({
        title: "تذكرة دعم جديدة",
        preheader: `تذكرة جديدة ${ticketNumber} من ${customerName} — ${PRIORITY_LABELS[priority as TicketPriority] ?? priority}`,
        bodyHtml,
        brand,
      }),
    };
  },
};

export const authEmailTemplates = {
  passwordReset: async (resetUrl: string, brand?: EmailBrandContext) => {
    const resolvedBrand = brand ?? (await resolveEmailBrand());

    const bodyHtml = `
      ${emailHeading("إعادة تعيين كلمة المرور", "تلقّينا طلبًا لإعادة تعيين كلمة مرور حسابك.")}
      ${emailParagraph("اضغط الزر أدناه لتعيين كلمة مرور جديدة. الرابط صالح لفترة محدودة.")}
      ${emailButton(resetUrl, "تعيين كلمة مرور جديدة")}
      ${emailSecondaryLink(resetUrl, resetUrl)}
      ${emailParagraph("إذا لم تطلب إعادة التعيين، يمكنك تجاهل هذا البريد بأمان.")}`;

    return {
      subject: "إعادة تعيين كلمة المرور — دعم ENS",
      html: emailLayout({
        title: "إعادة تعيين كلمة المرور",
        preheader: "رابط إعادة تعيين كلمة المرور لحسابك في بوابة دعم ENS",
        bodyHtml,
        brand: resolvedBrand,
      }),
    };
  },

  emailVerification: async (verifyUrl: string, brand?: EmailBrandContext) => {
    const resolvedBrand = brand ?? (await resolveEmailBrand());

    const bodyHtml = `
      ${emailHeading("تأكيد البريد الإلكتروني", "مرحبًا بك في بوابة دعم ENS. خطوة واحدة فقط لتفعيل حسابك.")}
      ${emailParagraph("يرجى تأكيد بريدك الإلكتروني بالضغط على الزر أدناه.")}
      ${emailButton(verifyUrl, "تأكيد البريد الإلكتروني")}
      ${emailSecondaryLink(verifyUrl, verifyUrl)}
      ${emailParagraph("إذا لم تنشئ حسابًا، يمكنك تجاهل هذا البريد.")}`;

    return {
      subject: "تأكيد البريد الإلكتروني — دعم ENS",
      html: emailLayout({
        title: "تأكيد البريد الإلكتروني",
        preheader: "أكّد بريدك الإلكتروني لتفعيل حسابك في بوابة دعم ENS",
        bodyHtml,
        brand: resolvedBrand,
      }),
    };
  },

  testEmail: async (sentAt: string, brand?: EmailBrandContext) => {
    const resolvedBrand = brand ?? (await resolveEmailBrand());

    const bodyHtml = `
      ${emailHeading("اختبار إعدادات البريد", "تم إرسال هذا البريد للتحقق من أن إعدادات SMTP تعمل بشكل صحيح.")}
      ${emailDetailsBox(`
        ${emailDetailRow("الحالة", "تم الإرسال بنجاح")}
        ${emailDetailRow("وقت الإرسال", sentAt)}
        ${emailDetailRow("الخادم", process.env.EMAIL_SERVER_HOST || "—", { ltr: true })}
      `)}
      ${emailParagraph("إذا وصلك هذا البريد، فإعدادات البريد في لوحة التحكم صحيحة وجاهزة للاستخدام.")}`;

    return {
      subject: "اختبار البريد — دعم ENS",
      html: emailLayout({
        title: "اختبار إعدادات البريد",
        preheader: "رسالة اختبار من بوابة دعم ENS — الإعدادات تعمل بنجاح",
        bodyHtml,
        brand: resolvedBrand,
      }),
    };
  },
};
