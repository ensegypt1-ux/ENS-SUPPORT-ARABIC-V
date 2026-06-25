import type { TicketPriority, TicketStatus } from "@/types";

/** Ticket status — short badges */
export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "مفتوحة",
  scheduled_meeting: "اجتماع محجوز",
  in_progress: "قيد المعالجة",
  waiting_on_customer: "بانتظار رد العميل",
  resolved: "تم الحل",
  closed: "مغلقة",
};

/** Ticket priority — short badges */
export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  urgent: "عاجلة",
  high: "عالية",
  medium: "متوسطة",
  low: "منخفضة",
};

/** Priority options in create/edit forms */
export const PRIORITY_FORM_LABELS: Record<TicketPriority, string> = {
  low: "منخفضة — وقت مرن",
  medium: "متوسطة — خلال أيام",
  high: "عالية — خلال 24 ساعة",
  urgent: "عاجلة — تتطلب حلًا فوريًا",
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
  delete: "حذف",
  edit: "تعديل",
  create: "إنشاء",
  update: "تحديث",
  search: "بحث",
  filter: "تصفية",
  loading: "جاري التحميل…",
  saving: "جاري الحفظ…",
  noResults: "لا توجد نتائج",
  confirm: "تأكيد",
  back: "رجوع",
  next: "التالي",
  previous: "السابق",
  submit: "إرسال",
  close: "إغلاق",
  view: "عرض",
  download: "تنزيل",
  upload: "رفع",
  yes: "نعم",
  no: "لا",
  all: "الكل",
  actions: "إجراءات",
  status: "الحالة",
  priority: "الأولوية",
  category: "النوع",
  date: "التاريخ",
  name: "الاسم",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  description: "الوصف",
  title: "العنوان",
  settings: "الإعدادات",
  profile: "الملف الشخصي",
  logout: "تسجيل الخروج",
  login: "تسجيل الدخول",
  register: "إنشاء حساب",
  dashboard: "لوحة التحكم",
  tickets: "التذاكر",
  messages: "الرسائل",
  services: "الخدمات",
  notifications: "الإشعارات",
  error: "خطأ",
  success: "نجاح",
  warning: "تنبيه",
  info: "معلومة",
  required: "مطلوب",
  optional: "اختياري",
  selectAll: "تحديد الكل",
  clearAll: "مسح الكل",
  showMore: "عرض المزيد",
  showLess: "عرض أقل",
  tryAgain: "أعد المحاولة",
  goHome: "الصفحة الرئيسية",
  somethingWentWrong: "حدث خطأ",
  unauthorized: "غير مصرّح",
  notFound: "غير موجود",
  pageNotFound: "الصفحة غير موجودة",
} as const;

export const FALLBACKS = {
  unknownUser: "مستخدم",
  unknownCustomer: "عميل",
  unassigned: "غير معيّن",
} as const;

/** Ticket detail & workflow */
export const TICKET_UI = {
  openedBy: "أُنشئت بواسطة",
  lastActivity: "آخر تحديث",
  description: "الوصف",
  comments: "التعليقات",
  meetings: "الاجتماعات",
  attachments: "المرفقات",
  history: "السجل",
  logs: "السجل",
  customer: "العميل",
  assignedTo: "مُعيَّن إلى",
  department: "القسم",
  product: "المنتج",
  created: "تاريخ الإنشاء",
  resolved: "تاريخ الحل",
  tags: "الوسوم",
  purchaseCode: "رمز الشراء",
  scheduleMeetingHint:
    "يمكنك جدولة مكالمة عبر Zoom أو Google Meet مع العميل من هنا.",
  backToTickets: "العودة إلى التذاكر",
  version: "الإصدار",
  license: "الترخيص",
  category: "النوع",
  ticketInfo: "بيانات التذكرة",
  status: "الحالة",
  priority: "الأولوية",
  purchaseVerified: "تم التحقق من الشراء",
  country: "البلد",
} as const;

/** Admin service request forms */
export const FORM_UI = {
  selectCustomer: "اختر العميل",
  selectCustomerHint: "من صاحب هذا الطلب؟",
  searchCustomers: "ابحث عن عميل…",
  selectCustomerPlaceholder: "اختر عميلًا",
  noCustomersFound: "لا يوجد عملاء",
  ticketsCount: "تذكرة",
  installationDetails: "تفاصيل التثبيت",
  customizationDetails: "تفاصيل التخصيص",
  requestTitle: "عنوان الطلب",
  requestTitleHint: "عنوان واضح يميّز الطلب",
  requestTitlePlaceholder: "مثال: تثبيت البوابة على الخادم",
  customizationTitlePlaceholder: "مثال: تخصيص شاشة تسجيل الدخول",
  requirements: "المتطلبات",
  requirementsPlaceholder: "اكتب تفاصيل التثبيت أو التخصيص…",
  securityNote:
    "لا تشارك كلمات المرور هنا. استخدم قناة آمنة للبيانات الحساسة.",
  attachments: "المرفقات",
  attachmentsHint: "ارفع ملفات أو لقطات شاشة تساعد في التنفيذ",
  productInfo: "بيانات المنتج",
  productInfoHint: "للتحقق من الشراء",
  productName: "اسم المنتج",
  productNamePlaceholder: "مثال: إضافة المتجر",
  productVersion: "إصدار المنتج",
  productVersionPlaceholder: "مثال: 1.0.0",
  purchaseCode: "رمز الشراء",
  purchaseCodePlaceholder: "رمز Envato",
  priority: "الأولوية",
  selectPriority: "اختر الأولوية",
  timezone: "المنطقة الزمنية",
  selectTimezone: "اختر المنطقة الزمنية",
  createRequest: "إنشاء الطلب",
  creating: "جاري الإنشاء…",
  createFailed: "تعذّر إنشاء الطلب",
  createInstallationTitle: "طلب تثبيت جديد",
  createCustomizationTitle: "طلب تخصيص جديد",
  adminBreadcrumb: "الإدارة",
  installationBreadcrumb: "التثبيت",
  customizationBreadcrumb: "التخصيص",
  newRequestBreadcrumb: "طلب جديد",
  priorityHint: "ما مدى استعجال هذا الطلب؟",
  timezoneHint: "لجدولة المكالمات والاجتماعات",
  purchaseCodeHint: "رمز Envato للتحقق",
  uploadPartialFail: "تم إنشاء الطلب، لكن بعض الملفات لم تُرفع",
  uploadSuccess: "تم إنشاء الطلب مع",
  attachmentWord: "مرفق",
  createSuccess: "تم إنشاء الطلب",
  unexpectedError: "حدث خطأ غير متوقع",
} as const;

export const EDIT_FORM_UI = {
  editInstallationTitle: "تعديل طلب التثبيت",
  editInstallationDesc: "عدّل تفاصيل طلب التثبيت.",
  editCustomizationTitle: "تعديل طلب التخصيص",
  editCustomizationDesc: "عدّل تفاصيل طلب التخصيص.",
  requestDetails: "تفاصيل الطلب",
  updateRequest: "تحديث الطلب",
  updating: "جاري التحديث…",
  createServiceRequest: (serviceName: string) => `طلب ${serviceName} جديد`,
} as const;

export const AR_LOCALE = "ar-SA";

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

