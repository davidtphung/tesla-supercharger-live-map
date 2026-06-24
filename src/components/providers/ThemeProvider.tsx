"use client";

import { useEffect } from "react";
import { initThemeListeners } from "@/store/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initThemeListeners();
  }, []);

  return children;
}