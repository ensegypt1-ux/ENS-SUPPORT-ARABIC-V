/**
 * Maps Better Auth / API English error messages to professional Arabic.
 * Falls back to the original message if no mapping exists.
 */
const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid email or password": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "Invalid credentials": "بيانات الدخول غير صحيحة",
  "Invalid password": "كلمة المرور غير صحيحة",
  "User not found": "لا يوجد حساب بهذا البريد الإلكتروني",
  "Email already exists": "البريد الإلكتروني مستخدم بالفعل",
  "User already exists": "يوجد حساب مسجّل بهذا البريد الإلكتروني",
  "Email not verified": "يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول",
  "Invalid token": "الرابط غير صالح أو منتهي الصلاحية",
  "Token expired": "انتهت صلاحية الرابط. اطلب رابطًا جديدًا",
  "Password too short": "كلمة المرور قصيرة جدًا",
  "Password too weak": "كلمة المرور ضعيفة",
  "Too many requests": "عدد كبير من المحاولات. حاول لاحقًا",
  "Unauthorized": "غير مصرّح",
  "Forbidden": "غير مسموح",
  "Your account has been banned. Please contact support.":
    "تم حظر حسابك. تواصل مع فريق الدعم.",
  "Your account has been disabled. Please contact support.":
    "تم تعطيل حسابك. تواصل مع فريق الدعم.",
};

export function translateAuthError(message: string | undefined | null): string {
  if (!message?.trim()) return "";
  const trimmed = message.trim();
  if (AUTH_ERROR_MAP[trimmed]) return AUTH_ERROR_MAP[trimmed];
  // Case-insensitive exact match
  const lower = trimmed.toLowerCase();
  for (const [en, ar] of Object.entries(AUTH_ERROR_MAP)) {
    if (en.toLowerCase() === lower) return ar;
  }
  // Partial matches for common patterns
  if (lower.includes("invalid email or password")) {
    return AUTH_ERROR_MAP["Invalid email or password"];
  }
  if (lower.includes("email already")) {
    return AUTH_ERROR_MAP["Email already exists"];
  }
  if (lower.includes("not verified")) {
    return AUTH_ERROR_MAP["Email not verified"];
  }
  if (lower.includes("token") && lower.includes("expir")) {
    return AUTH_ERROR_MAP["Token expired"];
  }
  return trimmed;
}
