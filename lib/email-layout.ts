import { ENS_BRAND } from "@/lib/ens-brand";

/** ENS Support transactional email palette (inline-safe). */
export const EMAIL_STYLE = {
  primary: "#1d4ed8",
  primaryHover: "#1e40af",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  surface: "#f8fafc",
  card: "#ffffff",
  accent: "#0ea5e9",
  success: "#059669",
  successBg: "#ecfdf5",
  warning: "#d97706",
  footerBg: "#f1f5f9",
  fontFamily:
    "'Segoe UI', Tahoma, Arial, 'Helvetica Neue', Helvetica, sans-serif",
} as const;

export type EmailBrandContext = {
  appUrl: string;
  logoUrl: string;
  portalTitle: string;
  companyName: string;
  supportEmail: string;
};

export function getEmailAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

export function getDefaultEmailBrand(): EmailBrandContext {
  const appUrl = getEmailAppUrl();
  const from = process.env.EMAIL_FROM || "";
  const supportEmail =
    from.match(/<([^>]+)>/)?.[1]?.trim() || from.trim() || "support@ensmenu.com";

  return {
    appUrl,
    logoUrl: `${appUrl}${ENS_BRAND.faviconUrl}`,
    portalTitle: ENS_BRAND.portalTitle,
    companyName: ENS_BRAND.companyName,
    supportEmail,
  };
}

export async function resolveEmailBrand(): Promise<EmailBrandContext> {
  const defaults = getDefaultEmailBrand();

  try {
    const { getSystemSettings, getLogoUrl } = await import(
      "@/lib/settings-utils"
    );
    const settings = await getSystemSettings();
    const logoFromSettings = await getLogoUrl();
    const logoUrl = logoFromSettings
      ? logoFromSettings.startsWith("http")
        ? logoFromSettings
        : `${defaults.appUrl}${logoFromSettings.startsWith("/") ? logoFromSettings : `/${logoFromSettings}`}`
      : defaults.logoUrl;

    return {
      appUrl: defaults.appUrl,
      logoUrl,
      portalTitle: settings.general?.siteName?.trim() || defaults.portalTitle,
      companyName: settings.general?.companyName?.trim() || defaults.companyName,
      supportEmail:
        settings.general?.supportEmail?.trim() || defaults.supportEmail,
    };
  } catch {
    return defaults;
  }
}

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[char] ?? char;
  });
}

/** Hidden inbox preview line (many clients show this after subject). */
function emailPreheader(text: string): string {
  const padded = `${text}${"&nbsp;".repeat(80)}`;
  return `
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(text)}${padded.slice(text.length)}
    </div>`;
}

export function emailLayout(options: {
  title: string;
  preheader?: string;
  bodyHtml: string;
  brand?: EmailBrandContext;
}): string {
  const brand = options.brand ?? getDefaultEmailBrand();
  const year = new Date().getFullYear();
  const portalLink = brand.appUrl;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_STYLE.surface};font-family:${EMAIL_STYLE.fontFamily};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${options.preheader ? emailPreheader(options.preheader) : ""}
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${EMAIL_STYLE.surface};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:${EMAIL_STYLE.card};border:1px solid ${EMAIL_STYLE.border};border-radius:12px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${EMAIL_STYLE.primary};padding:24px 28px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="${escapeHtml(brand.logoUrl)}" alt="${escapeHtml(brand.portalTitle)}" width="40" height="40" style="display:block;border:0;border-radius:8px;background:#ffffff;padding:4px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:18px;font-weight:700;color:#ffffff;line-height:1.4;">
                    ${escapeHtml(brand.portalTitle)}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:13px;color:rgba(255,255,255,0.88);padding-top:4px;line-height:1.5;">
                    ${escapeHtml(ENS_BRAND.tagline)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td dir="rtl" style="padding:28px 28px 8px;color:${EMAIL_STYLE.text};font-size:15px;line-height:1.7;">
              ${options.bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td dir="rtl" style="background-color:${EMAIL_STYLE.footerBg};padding:20px 28px 24px;border-top:1px solid ${EMAIL_STYLE.border};text-align:center;">
              <p style="margin:0 0 10px;font-size:13px;color:${EMAIL_STYLE.muted};line-height:1.6;">
                للمساعدة، راسلنا على
                <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:${EMAIL_STYLE.primary};text-decoration:none;font-weight:600;">${escapeHtml(brand.supportEmail)}</a>
              </p>
              <p style="margin:0 0 10px;font-size:13px;color:${EMAIL_STYLE.muted};line-height:1.6;">
                <a href="${escapeHtml(portalLink)}" style="color:${EMAIL_STYLE.primary};text-decoration:none;">${escapeHtml(portalLink)}</a>
              </p>
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                رسالة آلية من ${escapeHtml(brand.portalTitle)} — يرجى عدم الرد على هذا البريد.<br />
                ${escapeHtml(ENS_BRAND.copyright(year))}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailHeading(text: string, subtitle?: string): string {
  return `
    <h1 style="margin:0 0 ${subtitle ? "8px" : "16px"};font-size:22px;font-weight:700;color:${EMAIL_STYLE.text};line-height:1.35;">
      ${escapeHtml(text)}
    </h1>
    ${
      subtitle
        ? `<p style="margin:0 0 20px;font-size:15px;color:${EMAIL_STYLE.muted};line-height:1.65;">${escapeHtml(subtitle)}</p>`
        : ""
    }`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;color:${EMAIL_STYLE.text};line-height:1.7;">${text}</p>`;
}

export function emailButton(href: string, label: string): string {
  if (!href) return "";
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0 8px;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;background-color:${EMAIL_STYLE.primary};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:8px;line-height:1.2;mso-padding-alt:0;">
            <!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%;mso-text-raise:18pt">&nbsp;</i><![endif]-->
            <span style="mso-text-raise:9pt;">${escapeHtml(label)}</span>
            <!--[if mso]><i style="letter-spacing:24px;mso-font-width:-100%">&nbsp;</i><![endif]-->
          </a>
        </td>
      </tr>
    </table>`;
}

export function emailSecondaryLink(href: string, label: string): string {
  return `<p style="margin:8px 0 16px;font-size:13px;color:${EMAIL_STYLE.muted};text-align:center;line-height:1.6;">
    أو افتح الرابط: <a href="${escapeHtml(href)}" style="color:${EMAIL_STYLE.primary};word-break:break-all;">${escapeHtml(label)}</a>
  </p>`;
}

export function emailDetailsBox(rowsHtml: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0;background-color:${EMAIL_STYLE.surface};border:1px solid ${EMAIL_STYLE.border};border-radius:10px;overflow:hidden;">
      ${rowsHtml}
    </table>`;
}

export function emailDetailRow(
  label: string,
  value: string,
  options?: { ltr?: boolean; highlight?: string; html?: boolean }
): string {
  const valueStyle = [
    `padding:12px 16px`,
    `font-size:14px`,
    `color:${EMAIL_STYLE.text}`,
    `text-align:right`,
    `vertical-align:top`,
    `line-height:1.5`,
    options?.ltr
      ? `direction:ltr;unicode-bidi:embed;font-family:Consolas,'Courier New',monospace;font-weight:600;`
      : `font-weight:600;`,
    options?.highlight ? `color:${options.highlight};` : "",
  ].join(";");

  const valueContent = options?.html ? value : escapeHtml(value);

  return `
    <tr>
      <td style="padding:12px 16px;font-size:13px;color:${EMAIL_STYLE.muted};font-weight:600;width:38%;border-bottom:1px solid ${EMAIL_STYLE.border};vertical-align:top;text-align:right;">
        ${escapeHtml(label)}
      </td>
      <td style="${valueStyle};border-bottom:1px solid ${EMAIL_STYLE.border};">
        ${valueContent}
      </td>
    </tr>`;
}

export function emailCallout(
  title: string,
  content: string,
  accentColor: string = EMAIL_STYLE.primary
): string {
  const titleHtml = title
    ? `<p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${accentColor};">${escapeHtml(title)}</p>`
    : "";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 20px;background-color:#f0f9ff;border:1px solid #bae6fd;border-right:4px solid ${accentColor};border-radius:10px;">
      <tr>
        <td dir="rtl" style="padding:16px 18px;">
          ${titleHtml}
          <div style="margin:0;font-size:14px;color:${EMAIL_STYLE.text};line-height:1.65;white-space:pre-wrap;">${content}</div>
        </td>
      </tr>
    </table>`;
}

export function emailSteps(steps: string[]): string {
  const items = steps
    .map(
      (step, i) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:${EMAIL_STYLE.text};line-height:1.6;"><span style="display:inline-block;min-width:22px;font-weight:700;color:${EMAIL_STYLE.primary};">${i + 1}.</span> ${escapeHtml(step)}</td></tr>`
    )
    .join("");
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0 20px;">
      <tr><td style="padding-bottom:8px;font-size:14px;font-weight:700;color:${EMAIL_STYLE.text};">الخطوات التالية</td></tr>
      ${items}
    </table>`;
}

export function emailSectionTitle(text: string): string {
  return `<p style="margin:24px 0 10px;font-size:14px;font-weight:700;color:${EMAIL_STYLE.text};">${escapeHtml(text)}</p>`;
}

export function emailBadge(text: string, color: string, bg: string): string {
  return `<span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;color:${color};background-color:${bg};">${escapeHtml(text)}</span>`;
}
