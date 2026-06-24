import * as fs from "fs";
import * as path from "path";
import { MongoClient, ObjectId } from "mongodb";

type SeedPair = {
  category: string;
  question: string;
  answer: string;
};

const TRAINING_PAIRS: SeedPair[] = [
  {
    category: "ens-portal",
    question: "ما هي بوابة دعم ENS؟",
    answer:
      "بوابة دعم ENS هي المركز الرسمي لعملاء ENS. منها يمكنك فتح تذاكر الدعم، متابعة حالة الطلبات، تصفح قاعدة المعرفة، والتواصل مع فريق ENS.",
  },
  {
    category: "ens-portal",
    question: "كيف أستخدم بوابة ENS؟",
    answer:
      "سجّل الدخول إلى البوابة، ثم اختر افتح تذكرة للمشكلات الجديدة، أو تصفح قاعدة المعرفة للإجابات الذاتية، أو استخدم المساعد الذكي للأسئلة السريعة.",
  },
  {
    category: "ens-tickets",
    question: "كيف أفتح تذكرة دعم؟",
    answer:
      "من لوحة التحكم اختر «افتح تذكرة»، حدّد مسار الدعم (فني، تثبيت، تخصيص، أو إبلاغ عن خلل)، اكتب وصفاً واضحاً للمشكلة، وأرفق أي لقطات شاشة أو ملفات تساعد فريق ENS.",
  },
  {
    category: "ens-tickets",
    question: "هل يمكنني متابعة تذكرتي؟",
    answer:
      "نعم. كل تذكرة تعرض الحالة والتعليقات والمرفقات وسجل النشاط. ستصلك إشعارات عند أي تحديث من فريق ENS.",
  },
  {
    category: "ens-tickets",
    question: "هل يمكنني إرفاق ملفات مع التذكرة؟",
    answer:
      "نعم. يمكنك رفع لقطات الشاشة والسجلات والمستندات مع التذكرة أو في التعليقات لتسريع التشخيص.",
  },
  {
    category: "ens-kb",
    question: "ما هي قاعدة المعرفة؟",
    answer:
      "قاعدة معرفة ENS تحتوي مقالات الإعداد والتثبيت والمشكلات المعروفة والأسئلة الشائعة. ابدأ بها قبل فتح تذكرة إذا كان سؤالك عاماً.",
  },
  {
    category: "ens-kb",
    question: "هل أستخدم قاعدة المعرفة أم أفتح تذكرة؟",
    answer:
      "ابدأ بقاعدة المعرفة للإعداد والأسئلة المتكررة. إذا لم تجد الحل أو كانت مشكلتك خاصة بحسابك، افتح تذكرة وسيتابعها فريق ENS.",
  },
  {
    category: "ens-services",
    question: "ما هي مسارات الدعم المتاحة؟",
    answer:
      "تتضمن البوابة: الدعم الفني، مساعدة التثبيت، طلبات التخصيص، والإبلاغ عن الأعطال. اختر المسار الأنسب عند إنشاء التذكرة.",
  },
  {
    category: "ens-services",
    question: "كيف أطلب مساعدة في التثبيت؟",
    answer:
      "افتح تذكرة جديدة واختر مسار «مساعدة التثبيت». صف بيئتك وخطواتك حتى الآن وأرفق أي رسائل خطأ. سيرشدك فريق ENS في الإعداد.",
  },
  {
    category: "ens-services",
    question: "كيف أطلب تخصيصاً؟",
    answer:
      "افتح تذكرة واختر مسار «طلب تخصيص». اشرح المتطلبات والموعد المتوقع. سيتابع فريق ENS المناقشة والتقدير عبر نفس التذكرة.",
  },
  {
    category: "ens-messaging",
    question: "هل يمكنني مراسلة فريق ENS مباشرة؟",
    answer:
      "نعم. تتضمن البوابة الرسائل والتعليقات على التذاكر. استخدم الرسائل للأسئلة السريعة أو تابع المحادثة داخل التذكرة للمشكلات المفتوحة.",
  },
  {
    category: "ens-ai",
    question: "ما هو مساعد دعم ENS؟",
    answer:
      "مساعد دعم ENS هو مساعد ذكي يجيب من قاعدة معرفة ENS. إذا لم يجد إجابة كافية، يمكنه تحويلك لفريق الدعم مع حفظ سياق المحادثة.",
  },
  {
    category: "ens-ai",
    question: "ماذا يمكن أن يساعدني فيه المساعد الذكي؟",
    answer:
      "يمكنه الإجابة عن أسئلة الإعداد والاستخدام الشائعة، وتوجيهك للمقالات المناسبة، ومساعدتك على فهم خطوات فتح تذكرة أو متابعتها.",
  },
  {
    category: "ens-account",
    question: "نسيت كلمة المرور، ماذا أفعل؟",
    answer:
      "استخدم رابط «نسيت كلمة المرور» في صفحة تسجيل الدخول. إذا استمرت المشكلة، افتح تذكرة دعم فني مع البريد المرتبط بحسابك.",
  },
  {
    category: "ens-account",
    question: "كيف أسجّل الدخول إلى البوابة؟",
    answer:
      "انتقل إلى صفحة تسجيل الدخول في بوابة ENS وأدخل بريدك وكلمة المرور. إذا لم يكن لديك حساب، تواصل مع فريق ENS لطلب الوصول.",
  },
  {
    category: "general-scope",
    question: "بماذا يمكنك مساعدتي؟",
    answer:
      "يمكنني مساعدتك في خدمات ENS، فتح ومتابعة التذاكر، قاعدة المعرفة، التثبيت والتخصيص، والأسئلة الشائعة عن البوابة.",
  },
  {
    category: "general-scope",
    question: "مرحباً",
    answer:
      "مرحباً! أنا مساعد دعم ENS. اسأل عن خدماتنا أو قاعدة المعرفة أو كيفية فتح تذكرة — وسأساعدك فوراً.",
  },
  {
    category: "general-scope",
    question: "السلام عليكم",
    answer:
      "وعليكم السلام! أنا مساعد دعم ENS. كيف يمكنني مساعدتك اليوم؟",
  },
];

function loadEnvFile(fileName: string) {
  const envPath = path.join(__dirname, "..", fileName);
  if (!fs.existsSync(envPath)) return;

  const envContent = fs.readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function seedAITrainingPairs() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DATABASE_NAME || "support-app";

  if (!uri) {
    console.error("Error: MONGODB_URI environment variable is not set.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("ai_training_pairs");
    const now = new Date();
    const actor = "seed:ai-training-pairs";

    let created = 0;
    let updated = 0;

    for (const pair of TRAINING_PAIRS) {
      const existing = await collection.findOne({
        question: {
          $regex: `^${escapeRegex(pair.question)}$`,
          $options: "i",
        },
      });

      if (existing) {
        await collection.updateOne(
          { _id: existing._id },
          {
            $set: {
              question: pair.question.trim(),
              answer: pair.answer.trim(),
              category: pair.category,
              isActive: true,
              updatedAt: now,
              updatedBy: actor,
            },
          }
        );
        updated++;
        continue;
      }

      await collection.insertOne({
        _id: new ObjectId(),
        question: pair.question.trim(),
        answer: pair.answer.trim(),
        category: pair.category,
        isActive: true,
        matchCount: 0,
        lastMatchedAt: null,
        embeddingStatus: "pending",
        embeddingError: null,
        createdAt: now,
        updatedAt: now,
        createdBy: actor,
        updatedBy: actor,
      });
      created++;
    }

    console.log(`Seeded AI training pairs into "${dbName}".`);
    console.log(`Created: ${created}`);
    console.log(`Updated: ${updated}`);
    console.log(
      "Next steps: regenerate embeddings and reindex the knowledge base from the AI Support Agent admin page."
    );
  } catch (error) {
    console.error("Failed to seed AI training pairs:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

void seedAITrainingPairs();
