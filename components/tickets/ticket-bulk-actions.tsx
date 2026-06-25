"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Loader2, CircleDot, Flag, UserPlus } from "lucide-react";
import {
    bulkUpdateTicketStatus,
    bulkUpdateTicketPriority,
    bulkAssignTickets,
    getAssignableAgents,
} from "@/actions/admin";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FALLBACKS, PRIORITY_LABELS, STATUS_LABELS, UI } from "@/lib/strings";
import type { TicketPriority, TicketStatus } from "@/types";

type TicketStatusValue = Exclude<TicketStatus, "scheduled_meeting"> | "scheduled_meeting";
type TicketPriorityValue = TicketPriority;

const STATUS_OPTIONS: { value: TicketStatusValue; label: string }[] = [
    { value: "open", label: STATUS_LABELS.open },
    { value: "scheduled_meeting", label: STATUS_LABELS.scheduled_meeting },
    { value: "in_progress", label: STATUS_LABELS.in_progress },
    { value: "waiting_on_customer", label: STATUS_LABELS.waiting_on_customer },
    { value: "resolved", label: STATUS_LABELS.resolved },
    { value: "closed", label: STATUS_LABELS.closed },
];

const PRIORITY_OPTIONS: { value: TicketPriorityValue; label: string }[] = [
    { value: "low", label: PRIORITY_LABELS.low },
    { value: "medium", label: PRIORITY_LABELS.medium },
    { value: "high", label: PRIORITY_LABELS.high },
    { value: "urgent", label: PRIORITY_LABELS.urgent },
];

interface Agent {
    id: string;
    name: string;
    email: string;
    role: string;
}

interface TicketBulkActionsProps {
    selectedIds: string[];
    /** Called after a successful update (used to clear the selection). */
    onDone: () => void;
}

export function TicketBulkActions({
    selectedIds,
    onDone,
}: TicketBulkActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentsState, setAgentsState] = useState<
        "idle" | "loading" | "loaded"
    >("idle");

    const apply = (work: () => Promise<{ success: boolean; message?: string; error?: string }>) => {
        startTransition(async () => {
            const result = await work();
            if (result.success) {
                toast.success(result.message || "التذاكر تم تحديث");
                onDone();
                router.refresh();
            } else {
                toast.error(result.error || result.message || "تعذّر تحديث التذاكر");
            }
        });
    };

    const loadAgents = async () => {
        if (agentsState !== "idle") return;
        setAgentsState("loading");
        const result = await getAssignableAgents();
        if (result.success && result.data) {
            setAgents(result.data);
        }
        setAgentsState("loaded");
    };

    return (
        <>
            {/* Status */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8" disabled={isPending}>
                        <CircleDot className="me-1.5 h-3.5 w-3.5" />
                        {UI.status}
                        <ChevronDown className="ms-1 h-3.5 w-3.5 opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>غيّر {UI.status}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {STATUS_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            className="cursor-pointer"
                            onClick={() =>
                                apply(() =>
                                    bulkUpdateTicketStatus(selectedIds, option.value),
                                )
                            }
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Priority */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8" disabled={isPending}>
                        <Flag className="me-1.5 h-3.5 w-3.5" />
                        {UI.priority}
                        <ChevronDown className="ms-1 h-3.5 w-3.5 opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuLabel>غيّر {UI.priority}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {PRIORITY_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            className="cursor-pointer capitalize"
                            onClick={() =>
                                apply(() =>
                                    bulkUpdateTicketPriority(selectedIds, option.value),
                                )
                            }
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Assign */}
            <DropdownMenu
                onOpenChange={(open) => {
                    if (open) void loadAgents();
                }}
            >
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8" disabled={isPending}>
                        <UserPlus className="me-1.5 h-3.5 w-3.5" />
                        تعيين
                        <ChevronDown className="ms-1 h-3.5 w-3.5 opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-72 w-56 overflow-y-auto">
                    <DropdownMenuLabel>تعيين إلى</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => apply(() => bulkAssignTickets(selectedIds, null))}
                    >
                        {FALLBACKS.unassigned}
                    </DropdownMenuItem>
                    {agentsState === "loading" && (
                        <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            {UI.loading}
                        </div>
                    )}
                    {agentsState === "loaded" && agents.length === 0 && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            لا يوجد وكلاء
                        </div>
                    )}
                    {agents.map((agent) => (
                        <DropdownMenuItem
                            key={agent.id}
                            className="cursor-pointer"
                            onClick={() =>
                                apply(() => bulkAssignTickets(selectedIds, agent.id))
                            }
                        >
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm">{agent.name}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {agent.email}
                                </span>
                            </div>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            {isPending && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
        </>
    );
}
