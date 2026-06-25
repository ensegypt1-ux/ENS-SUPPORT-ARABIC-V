"use server";

import { ObjectId, type UpdateFilter } from "mongodb";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCollection } from "@/lib/db";
import { getSession } from "@/lib/auth-utils";
import type { AIFile, AIFilePublic, ApiResponse, UserRole } from "@/types";
import { classifyFile, parseFile, fileExtension } from "@/lib/ai/file-parse";
import { chunkText } from "@/lib/ai/chunk";
import {
  indexFileChunks,
  removeFileEmbeddings,
  updateFileEmbeddingsSiteScope,
} from "@/lib/ai/knowledge-index";
import { testEmbeddingConnection } from "@/lib/ai/embeddings";
import { normalizeSiteId } from "@/lib/ai/sites";

const COLLECTION = "ai_files";

/** Below the 20MB server-action body limit; large enough for real documents. */
const MAX_FILE_BYTES = 15 * 1024 * 1024;
/** Bounds embedding time for a single huge document. */
const MAX_CHUNKS = 800;
const scopeSchema = z.object({
  siteId: z.string().max(100).optional(),
});

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user) throw new Error("غير مصرّح");
  const role = ((session.user as any)?.role ?? "customer") as UserRole;
  if (role !== "admin") throw new Error("ممنوع: يتطلب صلاحية المسؤول");
  return session;
}

function revalidateAI() {
  revalidatePath("/admin/ai-support-agent");
}

function toPublic(doc: AIFile): AIFilePublic {
  return {
    _id: doc._id.toString(),
    name: doc.name,
    filename: doc.filename,
    fileType: doc.fileType,
    sizeBytes: doc.sizeBytes,
    status: doc.status,
    chunksIndexed: doc.chunksIndexed,
    siteId: doc.siteId,
    error: doc.error ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listFiles(): Promise<ApiResponse<AIFilePublic[]>> {
  try {
    await requireAdmin();
    const col = await getCollection<AIFile>(COLLECTION);
    const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
    return { success: true, data: docs.map(toPublic) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Parse an uploaded file, chunk + embed it, and store the chunks in the
 * knowledge index. Runs synchronously: parsing is fast (CPU-only) and
 * embeddings are batched, so even a large document finishes in a few calls. The
 * original bytes are not kept — re-embedding works from the stored chunks.
 */
export async function uploadAndIndexFile(
  formData: FormData
): Promise<ApiResponse<AIFilePublic>> {
  let docId: ObjectId | null = null;
  let col: Awaited<ReturnType<typeof getCollection<AIFile>>> | null = null;
  try {
    const session = await requireAdmin();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { success: false, error: "لا يوجد ملف مرفوع" };
    }
    const rawName = (formData.get("name") as string | null)?.trim();
    const filename = file.name;
    // Optional owning site (absent ⇒ Global). Validated against ai_sites.
    const siteId = await normalizeSiteId(
      (formData.get("siteId") as string | null)?.trim() || undefined
    );

    if (classifyFile(filename) === "unsupported") {
      return {
        success: false,
        error: `نوع غير مدعوم ".${fileExtension(filename)}". استخدم PDF أو Excel/CSV أو Word (.docx) أو نص/markdown.`,
      };
    }
    if (file.size === 0) {
      return { success: false, error: "الملف فارغ" };
    }
    if (file.size > MAX_FILE_BYTES) {
      return {
        success: false,
        error: `الملف كبير جداً (الحد الأقصى ${Math.round(MAX_FILE_BYTES / 1024 / 1024)} ميغابايت)`,
      };
    }

    // Fail fast if embeddings are misconfigured, before parsing.
    const probe = await testEmbeddingConnection();
    if (!probe.success) {
      return {
        success: false,
        error:
          probe.error ??
          "Embedding provider unavailable. Open AI Training → Settings.",
      };
    }

    const name = rawName || filename;
    const now = new Date();
    col = await getCollection<AIFile>(COLLECTION);
    const doc: AIFile = {
      _id: new ObjectId(),
      name,
      filename,
      fileType: "pending",
      sizeBytes: file.size,
      status: "processing",
      chunksIndexed: 0,
      ...(siteId ? { siteId } : {}),
      error: null,
      createdAt: now,
      updatedAt: now,
      createdBy: (session.user as any).id,
    };
    docId = doc._id;
    await col.insertOne(doc);

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseFile(buffer, filename);

    let chunks = chunkText(parsed.text);
    if (chunks.length > MAX_CHUNKS) chunks = chunks.slice(0, MAX_CHUNKS);

    const stored = await indexFileChunks({
      fileId: doc._id.toString(),
      title: name,
      chunks,
      siteId,
    });

    if (stored === 0) {
      await col.updateOne(
        { _id: doc._id },
        {
          $set: {
            status: "failed",
            fileType: parsed.kind,
            error: "تعذّر تضمين أي محتوى من هذا الملف.",
            updatedAt: new Date(),
          },
        }
      );
      return { success: false, error: "تعذّر تضمين أي محتوى." };
    }

    await col.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: "ready",
          fileType: parsed.kind,
          chunksIndexed: stored,
          error: null,
          updatedAt: new Date(),
        },
      }
    );

    revalidateAI();
    const updated = await col.findOne({ _id: doc._id });
    return { success: true, data: toPublic(updated as AIFile) };
  } catch (error: any) {
    // Roll back any chunks already inserted before the failure (indexFileChunks
    // inserts batch-by-batch, so a mid-way error can leave partial chunks), then
    // leave a visible failed record so the admin sees what happened. Without the
    // cleanup a failed file's earlier chunks stay searchable.
    if (docId && col) {
      await removeFileEmbeddings(docId.toString()).catch(() => {});
      await col.updateOne(
        { _id: docId },
        {
          $set: {
            status: "failed",
            error: error.message ?? "تعذّر فهرسة الملف",
            updatedAt: new Date(),
          },
        }
      );
      revalidateAI();
    }
    return { success: false, error: error.message };
  }
}

export async function deleteFile(id: string): Promise<ApiResponse<void>> {
  try {
    await requireAdmin();
    if (!ObjectId.isValid(id)) {
      return { success: false, error: "معرّف الملف غير صالح" };
    }
    const col = await getCollection<AIFile>(COLLECTION);
    await col.deleteOne({ _id: new ObjectId(id) });
    await removeFileEmbeddings(id);
    revalidateAI();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateFileSite(
  id: string,
  input: z.infer<typeof scopeSchema>
): Promise<ApiResponse<AIFilePublic>> {
  try {
    await requireAdmin();
    if (!ObjectId.isValid(id)) {
      return { success: false, error: "معرّف الملف غير صالح" };
    }
    const parsed = scopeSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message };
    }

    const col = await getCollection<AIFile>(COLLECTION);
    const existing = await col.findOne({ _id: new ObjectId(id) });
    if (!existing) return { success: false, error: "لا يوجد الملف" };
    if (existing.status === "processing") {
      return {
        success: false,
        error: "انتظر حتى تنتهي المعالجة قبل تغيير النطاق",
      };
    }

    const siteId = await normalizeSiteId(parsed.data.siteId);
    const update: UpdateFilter<AIFile> = {
      $set: { updatedAt: new Date(), ...(siteId ? { siteId } : {}) },
    };
    if (!siteId) update.$unset = { siteId: "" };

    const doc = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: "after" }
    );
    if (!doc) return { success: false, error: "لا يوجد الملف" };

    await updateFileEmbeddingsSiteScope(id, siteId);
    revalidateAI();
    return { success: true, data: toPublic(doc) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
