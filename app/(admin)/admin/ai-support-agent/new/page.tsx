import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrainingPairForm } from "@/components/ai-training/training-pair-form";
import { listSites } from "@/actions/ai-sites";

export const dynamic = "force-dynamic";

export default async function NewAITrainingPairPage() {
  const sitesResult = await listSites();
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
          زوج تدريب جديد
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          أضف سؤالاً والإجابة المعتمدة. سيتم الإنشاء التضمين تلقائياً.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">زوج الأسئلة والأجوبة</CardTitle>
          <CardDescription>
            اكتب الأسئلة بالصيغة التي يسأل بها العميل فعلاً.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrainingPairForm sites={sites} />
        </CardContent>
      </Card>
    </div>
  );
}
