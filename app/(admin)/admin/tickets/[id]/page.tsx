import Link from "next/link";
import { ObjectId } from "mongodb";
import { getCollection } from "@/lib/db";
import { notFound } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { requireAuth } from "@/lib/auth-utils";
import type {
  TicketDepartmentDefinition,
  TicketProductDefinition,
  User as UserType,
} from "@/types";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/settings-utils";
import { getTicketById } from "@/actions/tickets";
import { getTicketHistory } from "@/actions/admin";
import { isFileUploadsEnabled } from "@/lib/storage";
import { getTicketComments } from "@/actions/comments";
import { getTicketMeetings } from "@/actions/meetings";
import { getTicketAttachments } from "@/actions/attachments";
import { CommentSection } from "@/components/tickets/comment-section";
import { TicketAssignment } from "@/components/admin/ticket-assignment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketStatusControl } from "@/components/admin/ticket-status-control";
import { TicketPriorityControl } from "@/components/admin/ticket-priority-control";
import { RequestHistory } from "@/components/admin/request-history";
import { MeetingScheduler } from "@/components/meetings/meeting-scheduler";
import { MeetingList } from "@/components/meetings/meeting-list";
import { TicketDescription } from "@/components/tickets/ticket-description";
import { NameWithRole } from "@/components/shared/name-with-role";
import {
  DetailFieldLabel,
  MetaSeparator,
  PageMetaLine,
  PageSectionLabel,
} from "@/components/ui/arabic-ux";
import { PanelSwitchRow } from "@/components/ui/panel-form";
import { FALLBACKS, TICKET_UI } from "@/lib/strings";
import { ArrowLeft } from "lucide-react";

interface AdminTicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTicketDetailPage({
  params,
}: AdminTicketDetailPageProps) {
  const session = await requireAuth();
  const { id } = await params;

  const ticketResult = await getTicketById(id);
  if (!ticketResult.success || !ticketResult.data) {
    notFound();
  }
  const ticket = ticketResult.data;

  const commentsResult = await getTicketComments(id);
  const comments = commentsResult.success ? commentsResult.data || [] : [];

  const fileUploadsEnabled = isFileUploadsEnabled();
  const attachmentsResult = fileUploadsEnabled
    ? await getTicketAttachments(id)
    : { success: true, data: [] };
  const attachments = attachmentsResult.success
    ? attachmentsResult.data || []
    : [];

  const historyResult = await getTicketHistory(id);
  const history = historyResult.success ? historyResult.data || [] : [];

  const meetingsResult = await getTicketMeetings(id);
  const meetings = meetingsResult.success ? meetingsResult.data || [] : [];

  const usersCollection = await getCollection<UserType>("user");
  const assignedToId =
    typeof ticket.assignedToId === "string" ? ticket.assignedToId : null;
  const userIds = [
    ticket.customerId,
    ...comments.map((c) => c.userId),
    ...attachments.map((a) => a.userId),
    ...(assignedToId ? [assignedToId] : []),
  ];
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

  const objectIds = uniqueUserIds
    .filter((uid) => typeof uid === "string" && ObjectId.isValid(uid))
    .map((uid) => new ObjectId(uid));

  const usersData = await usersCollection
    .find({
      $or: [
        { id: { $in: uniqueUserIds } },
        objectIds.length > 0 ? { _id: { $in: objectIds } } : {},
      ].filter((q) => Object.keys(q).length > 0),
    })
    .toArray();

  const users: Record<
    string,
    { name: string; email: string; role: string; image?: string }
  > = {};
  usersData.forEach((user) => {
    const key = user.id || user._id?.toString();
    if (key) {
      users[key] = {
        name: user.name || FALLBACKS.unknownUser,
        email: user.email || "",
        role: user.role || "customer",
        image: user.image,
      };
    }

    const objectKey = user._id?.toString();
    if (objectKey && !users[objectKey]) {
      users[objectKey] = {
        name: user.name || FALLBACKS.unknownUser,
        email: user.email || "",
        role: user.role || "customer",
        image: user.image,
      };
    }
  });

  if (!users[ticket.customerId]) {
    try {
      let customerUser = null;
      if (ObjectId.isValid(ticket.customerId)) {
        customerUser = await usersCollection.findOne({
          _id: new ObjectId(ticket.customerId),
        });
      }

      if (customerUser) {
        users[ticket.customerId] = {
          name: customerUser.name || FALLBACKS.unknownUser,
          email: customerUser.email || "",
          role: customerUser.role || "customer",
          image: customerUser.image,
        };
      }
    } catch (error) {
      console.error("Error fetching customer user:", error);
    }
  }

  const supportStaff = await usersCollection
    .find({ role: { $in: ["support", "admin"] } })
    .toArray();

  let departmentName: string | null = null;
  if (ticket.departmentSlug) {
    const departmentsCollection =
      await getCollection<TicketDepartmentDefinition>("ticket_departments");
    const dept = await departmentsCollection.findOne({
      slug: ticket.departmentSlug,
    });
    departmentName = dept?.name || ticket.departmentSlug;
  }

  let productLabel: string | null = null;
  if (ticket.productSlug) {
    const productsCollection = await getCollection<TicketProductDefinition>(
      "ticket_products"
    );
    const product = await productsCollection.findOne({
      slug: ticket.productSlug,
    });
    productLabel = product?.name || ticket.productSlug;
  }

  const customer = users[ticket.customerId] || {
    name: ticket.guestName || FALLBACKS.unknownCustomer,
    email: ticket.guestEmail || "",
    role: "customer",
  };
  const assignedTo = assignedToId ? users[assignedToId] : null;

  const createdLabel = ticket.createdAt
    ? await formatDate(new Date(ticket.createdAt))
    : null;
  const lastActivityLabel = ticket.lastActivityAt
    ? await formatDate(new Date(ticket.lastActivityAt))
    : null;
  const resolvedLabel = ticket.resolvedAt
    ? await formatDate(new Date(ticket.resolvedAt))
    : null;

  return (
    <div className="space-y-6 text-start">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-row items-center gap-2">
          <span className="font-mono text-xs tracking-wide text-muted-foreground">
            {ticket.ticketNumber}
          </span>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="-me-2 h-8 w-8"
          >
            <Link href="/admin/tickets" aria-label={TICKET_UI.backToTickets}>
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TicketStatusControl ticketId={id} currentStatus={ticket.status} />
          <TicketPriorityControl
            ticketId={id}
            currentPriority={ticket.priority}
          />
          <TicketAssignment
            ticketId={id}
            currentAssignedToId={assignedToId}
            supportStaff={supportStaff.map((user) => ({
              id: user.id || user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            }))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <h1 className="text-balance text-2xl font-semibold leading-snug">
          {ticket.title}
        </h1>
        <PageMetaLine>
          <span>{TICKET_UI.openedBy}</span>
          <NameWithRole
            name={customer?.name}
            role={(customer as { role?: string })?.role}
            className="text-sm font-medium text-foreground"
            badgeClassName="h-4 px-2 text-[10px]"
          />
          {createdLabel && (
            <>
              <MetaSeparator />
              <span>{createdLabel}</span>
            </>
          )}
          {lastActivityLabel && (
            <>
              <MetaSeparator />
              <span>
                {TICKET_UI.lastActivity} {lastActivityLabel}
              </span>
            </>
          )}
        </PageMetaLine>
      </div>

      <div className="grid gap-8 lg:grid-cols-4 lg:gap-10">
        <div className="space-y-8 lg:col-span-3">
          <section className="space-y-2 border-b pb-6">
            <PageSectionLabel>{TICKET_UI.description}</PageSectionLabel>
            <TicketDescription description={ticket.description} />
          </section>

          <Tabs defaultValue="comments" className="space-y-6">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="comments"
                className="-mb-px flex-none rounded-none border-0 bg-transparent px-4 pb-3 font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {TICKET_UI.comments}
                <span className="ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                  {comments?.length ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="meetings"
                className="-mb-px flex-none rounded-none border-0 bg-transparent px-4 pb-3 font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {TICKET_UI.meetings}
                <span className="ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                  {meetings?.length ?? 0}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="-mb-px flex-none rounded-none border-0 bg-transparent px-4 pb-3 font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {TICKET_UI.logs}
                <span className="ms-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                  {history?.length ?? 0}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="mt-0">
              <CommentSection
                ticketId={id}
                comments={comments}
                users={users}
                currentUserRole={
                  (session.user as SessionUser).role || "customer"
                }
                currentUserId={session.user.id}
                attachments={attachments}
                fileUploadsEnabled={fileUploadsEnabled}
              />
            </TabsContent>

            <TabsContent value="meetings" className="mt-0">
              <div className="space-y-4">
                <PanelSwitchRow className="rounded-lg bg-card p-3">
                  <p className="text-sm text-muted-foreground">
                    {TICKET_UI.scheduleMeetingHint}
                  </p>
                  <MeetingScheduler ticketId={id} />
                </PanelSwitchRow>
                <MeetingList
                  meetings={meetings}
                  users={users}
                  currentUserRole={
                    (session.user as SessionUser).role || "customer"
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <RequestHistory history={history} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="divide-y divide-border/60 self-start text-sm lg:sticky lg:top-6 [&>div]:py-4 [&>div:first-child]:pt-0 [&>div:last-child]:pb-0">
          <div>
            <DetailFieldLabel>{TICKET_UI.customer}</DetailFieldLabel>
            <NameWithRole
              name={customer?.name}
              role={(customer as { role?: string })?.role}
              className="text-sm font-medium"
              badgeClassName="h-4 px-2 text-[10px]"
            />
            {customer?.email && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {customer.email}
              </p>
            )}
          </div>

          <div>
            <DetailFieldLabel>{TICKET_UI.assignedTo}</DetailFieldLabel>
            {assignedTo ? (
              <>
                <NameWithRole
                  name={assignedTo.name}
                  role={(assignedTo as { role?: string }).role}
                  className="text-sm font-medium"
                  badgeClassName="h-4 px-2 text-[10px]"
                />
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {assignedTo.email}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {FALLBACKS.unassigned}
              </p>
            )}
          </div>

          {departmentName && (
            <div>
              <DetailFieldLabel>{TICKET_UI.department}</DetailFieldLabel>
              <p className="text-sm">{departmentName}</p>
            </div>
          )}

          {productLabel && (
            <div>
              <DetailFieldLabel>{TICKET_UI.product}</DetailFieldLabel>
              <p className="text-sm">{productLabel}</p>
            </div>
          )}

          {createdLabel && (
            <div>
              <DetailFieldLabel>{TICKET_UI.created}</DetailFieldLabel>
              <p className="text-sm">{createdLabel}</p>
            </div>
          )}

          {resolvedLabel && (
            <div>
              <DetailFieldLabel>{TICKET_UI.resolved}</DetailFieldLabel>
              <p className="text-sm">{resolvedLabel}</p>
            </div>
          )}

          {ticket.tags && ticket.tags.length > 0 && (
            <div>
              <DetailFieldLabel>{TICKET_UI.tags}</DetailFieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ticket.purchaseCode && (
            <div>
              <DetailFieldLabel>{TICKET_UI.purchaseCode}</DetailFieldLabel>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {ticket.purchaseCode}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
