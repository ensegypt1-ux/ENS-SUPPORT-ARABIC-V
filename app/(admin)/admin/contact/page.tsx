"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getContactSubmissions,
  updateContactStatus,
  deleteContactSubmission,
  ContactSubmission,
} from "@/actions/contact";
import { useFormatDate } from "@/components/providers/settings-provider";
import { toast } from "sonner";
import { AdminPageHeader } from "@/components/layout/admin-page-header";
import { adminTableHeadClass, DetailField, RtlIconText } from "@/components/ui/arabic-ux";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageTabsHeader } from "@/components/shared/page-tabs-header";
import { EmptySearchResults } from "@/components/shared/empty-search-results";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useDataTablePagination } from "@/hooks/use-data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Mail,
  Calendar,
  Eye,
  Trash2,
  User,
  FileText,
  MessageSquare,
  Loader2,
} from "lucide-react";

type ContactStatus = ContactSubmission["status"];

const CONTACT_STATUSES: Array<{ value: ContactStatus; label: string }> = [
  { value: "new", label: "جديد" },
  { value: "read", label: "مقروء" },
  { value: "replied", label: "تم الرد" },
  { value: "archived", label: "مؤرشف" },
];

const CONTACT_TAB_VALUES = ["all", "new", "read", "replied", "archived"] as const;

const CONTACT_STATUS_STYLES: Record<ContactStatus, string> = {
  new: "bg-blue-500 text-white",
  read: "bg-yellow-500 text-black",
  replied: "bg-green-500 text-white",
  archived: "bg-gray-500 text-white",
};

function ContactSubmissionsTable({
  submissions,
  onStatusChange,
  onOpenDetail,
  onDelete,
  formatDate,
}: {
  submissions: ContactSubmission[];
  onStatusChange: (id: string, status: ContactStatus) => void;
  onOpenDetail: (submission: ContactSubmission) => void;
  onDelete: (id: string) => void;
  formatDate: (date: string | Date | null | undefined) => string;
}) {
  const {
    page,
    pageSize,
    pageSizeOptions,
    paginatedItems,
    startItem,
    endItem,
    totalItems,
    goToPage,
    updatePageSize,
  } = useDataTablePagination(submissions);

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        مفيش طلبات تواصل
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card/50 backdrop-blur-sm"
      dir="ltr"
    >
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/20 hover:bg-muted/20">
            <TableHead className={adminTableHeadClass} dir="rtl">
              إجراءات
            </TableHead>
            <TableHead className={adminTableHeadClass} dir="rtl">
              التاريخ
            </TableHead>
            <TableHead className={adminTableHeadClass} dir="rtl">
              الحالة
            </TableHead>
            <TableHead className={adminTableHeadClass} dir="rtl">
              الموضوع
            </TableHead>
            <TableHead className={adminTableHeadClass} dir="rtl">
              الإيميل
            </TableHead>
            <TableHead className={adminTableHeadClass} dir="rtl">
              الاسم
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-background/50">
          {paginatedItems.map((submission) => (
            <TableRow
              key={submission._id}
              className="group border-b border-border/30 transition-all duration-200 hover:bg-muted/30"
            >
              <TableCell className="px-4 py-3.5" dir="rtl">
                <div className="flex items-center justify-start gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onOpenDetail(submission)}
                    className="h-8 w-8 transition-colors hover:bg-muted/60"
                  >
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(submission._id!)}
                    className="h-8 w-8 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
              <TableCell className="px-4 py-3.5" dir="rtl">
                <RtlIconText icon={<Calendar className="h-4 w-4" />}>
                  <span className="text-sm text-muted-foreground/80">
                    {formatDate(submission.createdAt)}
                  </span>
                </RtlIconText>
              </TableCell>
              <TableCell className="px-4 py-3.5" dir="rtl">
                <Select
                  value={submission.status}
                  onValueChange={(value) =>
                    onStatusChange(submission._id!, value as ContactStatus)
                  }
                >
                  <SelectTrigger className="h-9 w-[130px] border-border/70 bg-background/80">
                    <SelectValue>
                      <Badge className={CONTACT_STATUS_STYLES[submission.status]}>
                        {CONTACT_STATUSES.find((s) => s.value === submission.status)?.label}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <Badge className={CONTACT_STATUS_STYLES[status.value]}>
                          {status.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="max-w-[300px] px-4 py-3.5" dir="rtl">
                <RtlIconText icon={<FileText className="h-4 w-4" />}>
                  <span className="text-foreground/90">{submission.subject}</span>
                </RtlIconText>
              </TableCell>
              <TableCell className="px-4 py-3.5" dir="rtl">
                <RtlIconText icon={<Mail className="h-4 w-4" />}>
                  <a
                    href={`mailto:${submission.email}`}
                    className="truncate text-foreground/90 hover:underline"
                    dir="ltr"
                  >
                    {submission.email}
                  </a>
                </RtlIconText>
              </TableCell>
              <TableCell className="px-4 py-3.5 font-medium" dir="rtl">
                <RtlIconText icon={<User className="h-4 w-4" />}>
                  {submission.name}
                </RtlIconText>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        totalItems={totalItems}
        startItem={startItem}
        endItem={endItem}
        onPageChange={goToPage}
        onPageSizeChange={updatePageSize}
        resultsLabel="رسائل"
      />
    </div>
  );
}

export default function ContactPage() {
  const formatDate = useFormatDate();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] =
    useState<ContactSubmission | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const requestedTab = searchParams.get("status");
  const activeTab =
    requestedTab && CONTACT_TAB_VALUES.includes(requestedTab as (typeof CONTACT_TAB_VALUES)[number])
      ? requestedTab
      : "all";
  const searchValue = searchParams.get("search") || "";

  useEffect(() => {
    loadSubmissions();
  }, []);

  const updateQueryParam = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await getContactSubmissions();
      setSubmissions(data);
    } catch {
      toast.error("مقدرناش نحمّل الطلبات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: ContactStatus) => {
    const result = await updateContactStatus(id, status);
    if (result.success) {
      toast.success(result.message);
      loadSubmissions();
    } else {
      toast.error(result.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("متأكد إنك عايز تمسح الطلب ده؟")) return;

    const result = await deleteContactSubmission(id);
    if (result.success) {
      toast.success(result.message);
      loadSubmissions();
    } else {
      toast.error(result.message);
    }
  };

  const openDetail = (submission: ContactSubmission) => {
    setSelectedSubmission(submission);
    setIsDetailOpen(true);
    if (submission.status === "new") {
      handleStatusChange(submission._id!, "read");
    }
  };

  const getStatusBadge = (status: ContactStatus) => {
    return (
      <Badge className={CONTACT_STATUS_STYLES[status]}>
        {CONTACT_STATUSES.find((item) => item.value === status)?.label ?? status}
      </Badge>
    );
  };

  const searchedSubmissions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return submissions;

    return submissions.filter((submission) => {
      return (
        submission.name.toLowerCase().includes(query) ||
        submission.email.toLowerCase().includes(query) ||
        submission.subject.toLowerCase().includes(query) ||
        submission.message.toLowerCase().includes(query)
      );
    });
  }, [submissions, searchValue]);

  const newSubmissions = searchedSubmissions.filter((s) => s.status === "new");
  const readSubmissions = searchedSubmissions.filter((s) => s.status === "read");
  const repliedSubmissions = searchedSubmissions.filter(
    (s) => s.status === "replied"
  );
  const archivedSubmissions = searchedSubmissions.filter(
    (s) => s.status === "archived"
  );

  const tabItems = [
    { value: "all", label: "الكل", count: searchedSubmissions.length },
    { value: "new", label: "جديد", count: newSubmissions.length },
    { value: "read", label: "مقروء", count: readSubmissions.length },
    { value: "replied", label: "تم الرد", count: repliedSubmissions.length },
    { value: "archived", label: "مؤرشف", count: archivedSubmissions.length },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <AdminPageHeader
        title="طلبات التواصل"
        description="مراجعة وإدارة رسائل نموذج التواصل الواردة"
      />

      <Card className="border-border p-4 shadow-none">
        <Tabs value={activeTab} onValueChange={(value) => updateQueryParam("status", value)}>
          <PageTabsHeader
            tabs={tabItems}
            showSearch
            searchPlaceholder="بحث في الرسائل..."
            searchDefaultValue={searchValue}
          />

          <TabsContent value="all">
            {searchedSubmissions.length === 0 ? (
              <EmptySearchResults
                searchQuery={searchValue}
                entityName="طلبات التواصل"
              />
            ) : (
              <ContactSubmissionsTable
                submissions={searchedSubmissions}
                onStatusChange={handleStatusChange}
                onOpenDetail={openDetail}
                onDelete={handleDelete}
                formatDate={formatDate}
              />
            )}
          </TabsContent>

          <TabsContent value="new">
            <ContactSubmissionsTable
              submissions={newSubmissions}
              onStatusChange={handleStatusChange}
              onOpenDetail={openDetail}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="read">
            <ContactSubmissionsTable
              submissions={readSubmissions}
              onStatusChange={handleStatusChange}
              onOpenDetail={openDetail}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="replied">
            <ContactSubmissionsTable
              submissions={repliedSubmissions}
              onStatusChange={handleStatusChange}
              onOpenDetail={openDetail}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="archived">
            <ContactSubmissionsTable
              submissions={archivedSubmissions}
              onStatusChange={handleStatusChange}
              onOpenDetail={openDetail}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl text-right" dir="rtl">
          <DialogHeader className="text-right">
            <DialogTitle className="inline-flex w-full items-center justify-end gap-2" dir="ltr">
              <span>تفاصيل رسالة التواصل</span>
              <MessageSquare className="h-5 w-5 text-primary" />
            </DialogTitle>
            <DialogDescription dir="rtl">
              تم الإرسال في {selectedSubmission && formatDate(selectedSubmission.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <DetailField label="من">
                  <RtlIconText icon={<User className="h-4 w-4" />}>
                    <span className="font-medium">{selectedSubmission.name}</span>
                  </RtlIconText>
                </DetailField>
                <DetailField label="الإيميل">
                  <RtlIconText icon={<Mail className="h-4 w-4" />}>
                    <a
                      href={`mailto:${selectedSubmission.email}`}
                      className="hover:underline"
                      dir="ltr"
                    >
                      {selectedSubmission.email}
                    </a>
                  </RtlIconText>
                </DetailField>
              </div>
              <DetailField label="الموضوع">
                <RtlIconText icon={<FileText className="h-4 w-4" />}>
                  <span className="font-medium">{selectedSubmission.subject}</span>
                </RtlIconText>
              </DetailField>
              <DetailField label="الرسالة">
                <div className="rounded-lg bg-muted/30 p-4 text-right">
                  <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
                </div>
              </DetailField>
              <div className="flex items-center justify-end gap-2">
                <p className="text-sm text-muted-foreground">الحالة:</p>
                {getStatusBadge(selectedSubmission.status)}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <a
                  href={`mailto:${selectedSubmission.email}?subject=Re: ${selectedSubmission.subject}`}
                >
                  <Button className="gap-2">
                    <span>الرد عبر البريد</span>
                    <Mail className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
