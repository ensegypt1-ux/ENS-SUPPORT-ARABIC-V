import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAITrainingPair } from "@/actions/ai-training";
import { listSites } from "@/actions/ai-sites";
import { TrainingPairForm } from "@/components/ai-training/training-pair-form";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ pairId: string }>;
}

export default async function EditAITrainingPairPage({ params }: PageProps) {
  const { pairId } = await params;
  const [result, sitesResult] = await Promise.all([
    getAITrainingPair(pairId),
    listSites(),
  ]);

  if (!result.success || !result.data) {
    notFound();
  }

  const pair = result.data;
  const sites = sitesResult.data ?? [];

  return (
    <div className="max-w-2xl space-y-6 pb-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ms-2">
          <Link href="/admin/ai-support-agent" className="flex items-center gap-1.5">
            <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
            العودة إلى وكيل الدعم الذكي
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          تعديل زوج التدريب
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          سيؤدي تحديث السؤال إلى إعادة إنشاء التضمين.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">زوج الأسئلة والأجوبة</CardTitle>
          <CardDescription>
            الحالة:{" "}
            <span className="font-mono">{pair.embeddingStatus}</span>
            {pair.embeddingError && (
              <span className="text-destructive"> — {pair.embeddingError}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingPairForm pair={pair} sites={sites} />
        </CardContent>
      </Card>
    </div>
  );
}
