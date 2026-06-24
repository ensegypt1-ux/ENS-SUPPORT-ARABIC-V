"use client";

import { useEffect } from "react";

/** Enables smooth anchor scrolling on the homepage only; respects reduced motion. */
export function SupportScrollSmooth() {
  useEffect(() => {
    document.documentElement.classList.add("support-scroll-smooth");
    return () => {
      document.documentElement.classList.remove("support-scroll-smooth");
    };
  }, []);

  return null;
}
