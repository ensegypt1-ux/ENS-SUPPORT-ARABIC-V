/**
 * International phone normalization, validation, and WhatsApp helpers.
 * Uses libphonenumber-js for E.164 parsing and validation.
 */

import {
  isValidPhoneNumber,
  parsePhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

export type PhoneValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

export const DEFAULT_PHONE_COUNTRY: CountryCode = "EG";

export function validateInternationalPhone(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): PhoneValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { ok: false, error: "رقم الهاتف مطلوب" };
  }

  try {
    if (!isValidPhoneNumber(trimmed, defaultCountry)) {
      return {
        ok: false,
        error: "أدخل رقم هاتف صالح للدولة المحددة",
      };
    }

    const parsed = parsePhoneNumber(trimmed, defaultCountry);
    return { ok: true, normalized: parsed.format("E.164") };
  } catch {
    return {
      ok: false,
      error: "أدخل رقم هاتف صالح للدولة المحددة",
    };
  }
}

/** Normalize any supported input to E.164, or null if invalid. */
export function normalizeToE164(
  input: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const parsed = parsePhoneNumber(trimmed, defaultCountry);
    if (!parsed.isValid()) return null;
    return parsed.format("E.164");
  } catch {
    return null;
  }
}

/** Human-readable international format for display. */
export function formatPhoneDisplay(
  e164: string,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): string {
  try {
    const parsed = parsePhoneNumber(e164, defaultCountry);
    if (parsed.isValid()) {
      return parsed.formatInternational();
    }
  } catch {
    /* fall through */
  }
  return e164;
}

/**
 * Digits-only string for wa.me links (no +, spaces, or other separators).
 * Prefers libphonenumber E.164 when the input is valid internationally.
 */
export function toWhatsAppDigits(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  const normalized = normalizeToE164(trimmed);
  const source = normalized ?? trimmed;
  return source.replace(/\D/g, "");
}

export function buildWhatsAppUrl(
  phone: string,
  message?: string
): string | null {
  const digits = toWhatsAppDigits(phone);
  if (!digits || digits.length < 8) return null;

  const base = `https://wa.me/${digits}`;
  if (!message?.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}
