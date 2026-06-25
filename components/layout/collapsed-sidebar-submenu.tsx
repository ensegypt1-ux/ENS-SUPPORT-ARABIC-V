"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CollapsedSidebarSubmenuItem {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
}

interface CollapsedSidebarSubmenuProps {
  label: string;
  icon: React.ElementType;
  active: boolean;
  items: CollapsedSidebarSubmenuItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FLYOUT_WIDTH = 192;
const FLYOUT_GAP = 8;

export function CollapsedSidebarSubmenu({
  label,
  icon: Icon,
  active,
  items,
  open,
  onOpenChange,
}: CollapsedSidebarSubmenuProps) {
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  const openedAtRef = useRef(0);
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

  onOpenChangeRef.current = onOpenChange;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const asideRect = triggerRef.current.closest("aside")?.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";

    if (isRtl) {
      const anchorLeft = asideRect?.left ?? rect.left;
      setPosition({
        top: Math.min(Math.max(8, rect.top), window.innerHeight - 120),
        left: Math.max(8, anchorLeft - FLYOUT_WIDTH - FLYOUT_GAP),
      });
      return;
    }

    const anchorRight = asideRect?.right ?? rect.right;
    setPosition({
      top: Math.min(Math.max(8, rect.top), window.innerHeight - 120),
      left: Math.min(
        window.innerWidth - FLYOUT_WIDTH - 8,
        anchorRight + FLYOUT_GAP
      ),
    });
  }, []);

  const openMenu = useCallback(() => {
    updatePosition();
    openedAtRef.current = Date.now();
    onOpenChangeRef.current(true);
  }, [updatePosition]);

  const closeMenu = useCallback(() => {
    onOpenChangeRef.current(false);
  }, []);

  const toggleMenu = useCallback(() => {
    if (open) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [open, closeMenu, openMenu]);

  // Close when navigating — pathname only (not on every parent re-render).
  useEffect(() => {
    onOpenChangeRef.current(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updatePosition();
    window.addEventListener("resize", handleReposition);
    return () => window.removeEventListener("resize", handleReposition);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (Date.now() - openedAtRef.current < 120) return;

      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };

    const attachTimer = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      window.clearTimeout(attachTimer);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeMenu]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-collapsed-sidebar-submenu-trigger="true"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleMenu();
        }}
        className={cn(
          "group relative flex min-h-[3.35rem] w-full flex-col items-center justify-center gap-0.5 rounded-[0.9rem] px-1.5 py-1.75 text-center transition-all duration-200",
          open || active
            ? "bg-primary/15 text-primary ring-1 ring-primary/40 dark:bg-primary/30 dark:text-primary-foreground dark:ring-primary/60"
            : "text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
        )}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Icon
          className={cn(
            "h-[1.05rem] w-[1.05rem] shrink-0 transition-colors",
            open || active
              ? "text-primary dark:text-primary-foreground"
              : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-200"
          )}
        />
        <span
          className={cn(
            "max-w-full text-[9px] leading-3 font-medium whitespace-normal",
            open || active
              ? "text-primary dark:text-primary-foreground"
              : "text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-100"
          )}
        >
          {label}
        </span>
        <ChevronRight
          className={cn(
            "pointer-events-none absolute end-1.5 top-1/2 h-3 w-3 shrink-0 -translate-y-1/2 rtl:-scale-x-100 transition-colors",
            open || active
              ? "text-primary dark:text-primary-foreground"
              : "text-slate-400 dark:text-slate-500"
          )}
        />
      </button>
      {open &&
        createPortal(
          <div
            ref={contentRef}
            data-collapsed-sidebar-submenu-content="true"
            role="menu"
            style={{ top: position.top, left: position.left }}
            className="fixed z-[60] w-48 rounded-[1.125rem] border border-border bg-popover p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={closeMenu}
                  className={cn(
                    "group flex min-h-8 items-center rounded-xl px-2.5 py-1.5 text-sm font-medium transition-colors",
                    item.active
                      ? "bg-primary/15 text-primary dark:bg-primary/30 dark:text-primary-foreground"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
                  )}
                >
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
