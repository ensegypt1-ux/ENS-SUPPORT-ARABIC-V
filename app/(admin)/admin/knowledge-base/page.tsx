import {
  Plus,
  FileText,
  Eye,
  EyeOff,
  Settings2,
  FolderOpen,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/shared/stats-grid";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { getAllKBCategoriesAdmin } from "@/actions/knowledge-base";
import { DeleteCategoryButton } from "@/components/knowledge-base/delete-category-button";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
  const result = await getAllKBCategoriesAdmin();
  const categories = result.data ?? [];

  const totalArticles = categories.reduce((sum, c) => sum + c.articleCount, 0);
  const publishedCategories = categories.filter((c) => c.isPublished).length;

  const statsData = [
    {
      title: "إجمالي الفئات",
      value: categories.length,
      icon: FolderOpen,
      description: "أقسام قاعدة المعرفة",
    },
    {
      title: "منشور",
      value: publishedCategories,
      icon: CheckCircle2,
      description: "مرئي للعملاء",
    },
    {
      title: "إجمالي المقالات",
      value: totalArticles,
      icon: FileText,
      description: "في جميع الفئات",
    },
  ];

  return (
    <div className="space-y-6 pb-8 text-right" dir="rtl">
      <AdminPageHeader
        title="قاعدة المعرفة"
        description="نظّم التوثيق — فئات ومقالات وإعدادات الظهور."
        actions={
          <Button asChild>
            <Link href="/admin/knowledge-base/new" className="gap-2">
              <span>فئة جديدة</span>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        }
      />

      <StatsGrid stats={statsData} />

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <BookOpen className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold">لا يوجد فئات لا تزال</h3>
          <p className="mb-5 mt-1 max-w-xs text-sm text-muted-foreground">
            أنشئ أول فئة لبدء بناء قاعدة المعرفة.
          </p>
          <Button asChild>
            <Link href="/admin/knowledge-base/new" className="gap-2">
              <span>فئة جديدة</span>
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category._id.toString()}
              className="group flex flex-col rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-border hover:shadow-sm"
            >
              <div
                className="mb-4 flex items-start justify-between"
                style={{ direction: "ltr" }}
              >
                <Badge
                  variant={category.isPublished ? "default" : "secondary"}
                  className="shrink-0 gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
                >
                  {category.isPublished ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <EyeOff className="h-3 w-3" />
                  )}
                  <span dir="rtl">
                    {category.isPublished ? "منشور" : "مسودة"}
                  </span>
                </Badge>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border/40 bg-muted/30 text-lg shadow-sm">
                  {category.icon || "📄"}
                </div>
              </div>

              <div className="mb-6 flex-1">
                <h3 className="line-clamp-1 font-semibold leading-none tracking-tight text-foreground">
                  {category.title}
                </h3>
                {category.description ? (
                  <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">
                    {category.description}
                  </p>
                ) : (
                  <p className="mt-2.5 text-sm italic text-muted-foreground/60">
                    لا يوجد وصف
                  </p>
                )}
              </div>

              <div className="mt-auto flex flex-col gap-4">
                <div
                  className="flex items-center justify-between text-xs font-medium text-muted-foreground/80"
                  dir="rtl"
                >
                  <span>الترتيب #{category.sortOrder}</span>
                  <div className="flex items-center gap-1.5">
                    <span>
                      {category.articleCount}{" "}
                      {category.articleCount === 1 ? "مقال" : "مقالات"}
                    </span>
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </div>
                </div>

                <div
                  className="flex items-center gap-2"
                  style={{ direction: "ltr" }}
                >
                  <DeleteCategoryButton
                    id={category._id.toString()}
                    title={category.title}
                  />
                  <Button asChild variant="outline" size="sm" className="h-9 flex-1 shadow-sm">
                    <Link
                      href={`/admin/knowledge-base/${category._id.toString()}`}
                      className="gap-1.5"
                    >
                      <span dir="rtl">إدارة</span>
                      <Settings2 className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
