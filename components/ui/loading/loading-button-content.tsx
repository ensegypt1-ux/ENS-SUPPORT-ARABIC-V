"use client";

import type { ReactNode } from "react";

import { UI } from "@/lib/strings";

import { Spinner } from "./spinner";

/** Standard button loading swap — icon + label while pending. */
export function LoadingButtonContent({
  loading,
  loadingLabel = UI.loading,
  children,
}: {
  loading: boolean;
  loadingLabel?: string;
  children: ReactNode;
}) {
  if (!loading) return children;

  return (
    <>
      <Spinner size="sm" className="text-current" />
      <span>{loadingLabel}</span>
    </>
  );
}
