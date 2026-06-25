import {
  FilterBarSkeleton,
  PageHeaderSkeleton,
  PaginationSkeleton,
  StatsGridSkeleton,
  TableCardSkeleton,
} from "./primitives";

export function TicketsListPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton action />
      <StatsGridSkeleton />
      <FilterBarSkeleton />
      <TableCardSkeleton />
      <PaginationSkeleton />
    </div>
  );
}

export function ServiceRequestsListPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-56" action />
      <StatsGridSkeleton />
      <FilterBarSkeleton />
      <TableCardSkeleton />
      <PaginationSkeleton />
    </div>
  );
}

export function DashboardShellSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={3} />
      <TableCardSkeleton rows={5} columns={5} />
    </div>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton titleWidth="w-64" />
      <StatsGridSkeleton />
      <TableCardSkeleton rows={5} columns={5} />
    </div>
  );
}

export function RootPageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeaderSkeleton />
        <StatsGridSkeleton />
        <TableCardSkeleton rows={4} columns={1} />
      </div>
    </div>
  );
}
