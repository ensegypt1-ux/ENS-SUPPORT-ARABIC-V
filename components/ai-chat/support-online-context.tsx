"use client";

import { createContext, useContext, type ReactNode } from "react";

import { useSupportOnlineStatus } from "@/hooks/useSupportOnlineStatus";

const SupportOnlineContext = createContext<boolean | null>(null);

export function SupportOnlineProvider({
  enabled = true,
  children,
}: {
  enabled?: boolean;
  children: ReactNode;
}) {
  const online = useSupportOnlineStatus(enabled);
  return (
    <SupportOnlineContext.Provider value={enabled ? online : null}>
      {children}
    </SupportOnlineContext.Provider>
  );
}

export function useSupportOnline() {
  return useContext(SupportOnlineContext);
}
