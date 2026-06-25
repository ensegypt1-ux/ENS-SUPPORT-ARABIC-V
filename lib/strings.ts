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

/** Public guest ticket form (/support/new) */
export const PUBLIC_TICKET_UI = {
  pageTitle: "افتح تذكرة دعم",
  pageSubtitle:
    "صِف مشكلتك وسيتابعها فريق دعم ENS. لا يلزم حساب — نرسل تأكيدًا وتحديثات إلى بريدك.",
  badge: "بوابة دعم ENS",
  journey: ["بياناتك", "تفاصيل الطلب", "إرسال"] as const,
  sections: {
    contact: {
      title: "بيانات التواصل",
      description: "نستخدمها للرد على تذكرتك وإرسال التحديثات.",
    },
    ticket: {
      title: "محتوى التذكرة",
      description: "كلما كان الوصف أوضح، كان الحل أسرع.",
    },
    details: {
      title: "تفاصيل الطلب",
      description: "ساعدنا على توجيه طلبك للفريق المناسب.",
    },
    purchase: {
      title: "التحقق من الشراء",
      description: "لعملاء Envato — يُسرّع معالجة طلبات الدعم ذات الأولوية.",
    },
    submit: {
      title: "إرسال الطلب",
      description: "راجع بياناتك ثم أرسل التذكرة.",
    },
  },
  fields: {
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    title: "عنوان التذكرة",
    description: "الوصف",
    purchaseCode: "رمز الشراء",
  },
  placeholders: {
    name: "مثال: محمد أحمد",
    email: "you@email.com",
    title: "ملخص موجز للمشكلة أو الطلب",
    description:
      "اشرح المشكلة بالتفصيل: ماذا حدث؟ ماذا جرّبت؟ ما النتيجة المتوقعة؟",
    purchaseCode: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  },
  hints: {
    email: "سنرسل رقم التذكرة والتحديثات على هذا البريد.",
    priority: "ما مدى استعجال هذا الطلب؟",
    timezone: "لجدولة المكالمات والاجتماعات",
    purchaseCode: "رمز Envato للتحقق",
    descriptionSecurity:
      "تجنّب ذكر كلمات المرور أو رموز التحقق. غطِّ البيانات الحساسة في أي لقطات شاشة.",
  },
  empty: {
    categories: "لا توجد فئات متاحة",
    departments: "لا توجد أقسام متاحة",
    products: "لا توجد منتجات متاحة",
  },
  verified: "تم التحقق",
  verifyRequired: "يرجى التحقق من رمز الشراء قبل إرسال التذكرة.",
  submitting: "جاري الإرسال…",
  submitTicket: "إرسال التذكرة",
  success: {
    title: "تم استلام تذكرتك",
    description:
      "شكرًا لتواصلك مع دعم ENS. استلمنا طلبك وأرسلنا تأكيدًا إلى بريدك الإلكتروني.",
    ticketLabel: "رقم التذكرة",
    copyAria: "نسخ رقم التذكرة",
    another: "إرسال تذكرة أخرى",
    home: "العودة للرئيسية",
    trustNote:
      "رابط متابعة التذكرة في بريدك الإلكتروني — احتفظ به لنفسك ولا تشاركه مع الآخرين.",
  },
} as const;

/** Security guidance for public support flows (tickets, guest replies). */
export const PUBLIC_SECURITY_NOTICE = {
  ariaLabel: "إرشادات أمان حسابك",
  title: "تنبيه مهم لحماية حسابك",
  intro:
    "فريق ENS يحرص على أمانك. لن نطلب منك أبدًا مشاركة معلومات حساسة عبر التذكرة أو البريد.",
  body:
    "لا ترسل كلمة المرور عبر التذكرة — موظفو ENS لن يطلبوها منك أبدًا. لا تشارك رموز التحقق (OTP) أو رموز المصادقة أو الاسترداد. تجنّب إرسال بيانات الدفع أو البنوك. عند رفع لقطات شاشة، احذف أو غطِّ أي معلومات سرية قدر الإمكان. إذا احتجنا معلومات حساسة، سنوفر لك طريقة آمنة عند الحاجة.",
  compact:
    "لا تشارك كلمة المرور أو رموز التحقق أو بيانات الدفع في ردك. غطِّ المعلومات الحساسة في أي مرفقات.",
  chips: [
    { id: "password", label: "كلمة المرور", icon: "key" as const },
    { id: "otp", label: "رموز التحقق", icon: "phone" as const },
    { id: "payment", label: "بيانات الدفع", icon: "card" as const },
    { id: "screenshots", label: "لقطات الشاشة", icon: "image" as const },
  ] as const,
  footer:
    "إذا طلب منك أحد — حتى بادعاء أنه من ENS — مشاركة بيانات حساسة، تواصل معنا عبر القنوات الرسمية فقط.",
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

