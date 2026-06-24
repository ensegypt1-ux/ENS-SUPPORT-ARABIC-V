import type { TicketPriority, TicketStatus } from "@/types";

/** Ticket status — short badges */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "مفتوحة",
  scheduled_meeting: "اجتماع محجوز",
  in_progress: "شغّالين عليها",
  waiting_on_customer: "مستنيين ردّ العميل",
  resolved: "اتحلّت",
  closed: "مقفولة",
};

/** Ticket priority — short badges */
export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "عاجل",
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

/** Priority options in create/edit forms */
export const PRIORITY_FORM_LABELS: Record<TicketPriority, string> = {
  low: "منخفضة — وقت مرن",
  medium: "متوسطة — خلال أيام",
  high: "عالية — خلال 24 ساعة",
  urgent: "عاجلة — محتاجة حل فوري",
};

/** Ticket categories */
export const CATEGORY_LABELS: Record<string, string> = {
  bug: "مشكلة",
  feature_request: "طلب ميزة",
  technical_support: "دعم فني",
  account: "حساب",
  general: "عام",
  service: "خدمة",
};

/** Shared UI labels */
export const UI = {
  save: "حفظ",
  cancel: "إلغاء",
  delete: "مسح",
  edit: "تعديل",
  create: "إضافة",
  update: "تحديث",
  search: "بحث",
  filter: "فلتر",
  loading: "بيحمّل...",
  noResults: "مفيش نتائج",
  confirm: "تأكيد",
  back: "رجوع",
  next: "اللي جاي",
  previous: "اللي فات",
  submit: "إرسال",
  close: "قفل",
  view: "عرض",
  download: "تحميل",
  upload: "رفع",
  yes: "أيوه",
  no: "لا",
  all: "الكل",
  actions: "إجراءات",
  status: "الحالة",
  priority: "الأولوية",
  category: "النوع",
  date: "التاريخ",
  name: "الاسم",
  email: "الإيميل",
  password: "كلمة المرور",
  description: "الوصف",
  title: "العنوان",
  settings: "الإعدادات",
  profile: "حسابي",
  logout: "خروج",
  login: "دخول",
  register: "إنشاء حساب",
  dashboard: "لوحة التحكم",
  tickets: "التذاكر",
  messages: "الرسائل",
  services: "الخدمات",
  notifications: "الإشعارات",
  error: "خطأ",
  success: "تم",
  warning: "تنبيه",
  info: "معلومة",
  required: "مطلوب",
  optional: "اختياري",
  selectAll: "تحديد الكل",
  clearAll: "مسح الكل",
  showMore: "عرض أكتر",
  showLess: "عرض أقل",
  tryAgain: "جرّب تاني",
  goHome: "الصفحة الرئيسية",
  somethingWentWrong: "حصل خطأ",
  unauthorized: "مش مسموح",
  notFound: "مش موجود",
  pageNotFound: "الصفحة دي مش موجودة",
} as const;

export const FALLBACKS = {
  unknownUser: "مستخدم",
  unknownCustomer: "عميل",
  unassigned: "مش متعيّن",
} as const;

/** Ticket detail & workflow */
export const TICKET_UI = {
  openedBy: "فتحها",
  lastActivity: "آخر تحديث",
  description: "الوصف",
  comments: "التعليقات",
  meetings: "الاجتماعات",
  attachments: "المرفقات",
  history: "السجل",
  logs: "السجل",
  customer: "العميل",
  assignedTo: "متعيّن لـ",
  department: "القسم",
  product: "المنتج",
  created: "تاريخ الفتح",
  resolved: "تاريخ الحل",
  tags: "الوسوم",
  purchaseCode: "كود الشراء",
  scheduleMeetingHint:
    "تقدر تحجز مكالمة Zoom أو Google Meet مع العميل من هنا.",
  backToTickets: "رجوع للتذاكر",
  version: "الإصدار",
  license: "الترخيص",
  category: "النوع",
  ticketInfo: "بيانات التذكرة",
  status: "الحالة",
  priority: "الأولوية",
  purchaseVerified: "الشراء متأكد",
  country: "البلد",
} as const;

/** Admin service request forms */
export const FORM_UI = {
  selectCustomer: "اختار العميل",
  selectCustomerHint: "مين صاحب الطلب؟",
  searchCustomers: "دور على عميل...",
  selectCustomerPlaceholder: "اختار عميل",
  noCustomersFound: "مفيش عملاء",
  ticketsCount: "تذكرة",
  installationDetails: "تفاصيل التثبيت",
  customizationDetails: "تفاصيل التخصيص",
  requestTitle: "عنوان الطلب",
  requestTitleHint: "عنوان واضح يميّز الطلب",
  requestTitlePlaceholder: "مثال: تثبيت البوابة على السيرفر",
  customizationTitlePlaceholder: "مثال: تخصيص شاشة الدخول",
  requirements: "المطلوب",
  requirementsPlaceholder: "اكتب تفاصيل التثبيت أو التخصيص...",
  securityNote:
    "متشاركش كلمات المرور هنا. استخدم قناة آمنة للبيانات الحساسة.",
  attachments: "مرفقات",
  attachmentsHint: "ارفع ملفات أو Screenshots تساعد في التنفيذ",
  productInfo: "بيانات المنتج",
  productInfoHint: "عشان نتحقق من الشراء",
  productName: "اسم المنتج",
  productNamePlaceholder: "مثال: إضافة المتجر",
  productVersion: "إصدار المنتج",
  productVersionPlaceholder: "مثال: 1.0.0",
  purchaseCode: "كود الشراء",
  purchaseCodePlaceholder: "كود Envato",
  priority: "الأولوية",
  selectPriority: "اختار الأولوية",
  timezone: "المنطقة الزمنية",
  selectTimezone: "اختار المنطقة",
  createRequest: "إنشاء الطلب",
  creating: "بيترفع...",
  createFailed: "مقدرناش نعمل الطلب",
  createInstallationTitle: "طلب تثبيت جديد",
  createCustomizationTitle: "طلب تخصيص جديد",
  adminBreadcrumb: "الإدارة",
  installationBreadcrumb: "التثبيت",
  customizationBreadcrumb: "التخصيص",
  newRequestBreadcrumb: "طلب جديد",
  priorityHint: "قد إيه الطلب مستعجل؟",
  timezoneHint: "لجدولة المكالمات والاجتماعات",
  purchaseCodeHint: "كود Envato للتحقق",
  uploadPartialFail: "الطلب اتعمل بس بعض الملفات مترفعتش",
  uploadSuccess: "الطلب اتعمل مع",
  attachmentWord: "مرفق",
  createSuccess: "الطلب اتعمل",
  unexpectedError: "حصل خطأ مش متوقع",
} as const;

export const EDIT_FORM_UI = {
  editInstallationTitle: "تعديل طلب التثبيت",
  editInstallationDesc: "عدّل تفاصيل طلب التثبيت.",
  editCustomizationTitle: "تعديل طلب التخصيص",
  editCustomizationDesc: "عدّل تفاصيل طلب التخصيص.",
  requestDetails: "تفاصيل الطلب",
  updateRequest: "تحديث الطلب",
  updating: "بيتحدّث...",
  createServiceRequest: (serviceName: string) => `طلب ${serviceName} جديد`,
} as const;

export const AR_LOCALE = "ar-EG";

export const DATE_FORMAT_LABELS: Record<string, string> = {
  "MMM dd, yyyy": "٠١ يناير ٢٠٢٤",
  "dd/MM/yyyy": "٠١/٠١/٢٠٢٤",
  "MM/dd/yyyy": "٠١/٠١/٢٠٢٤",
  "yyyy-MM-dd": "٢٠٢٤-٠١-٠١",
  "dd MMM yyyy": "٠١ يناير ٢٠٢٤",
};

export function getDateFormatLabel(format: string): string {
  return DATE_FORMAT_LABELS[format] ?? format;
}

export function formatDate(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString(AR_LOCALE, options);
}

export function formatDateTime(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString(AR_LOCALE, options);
}
