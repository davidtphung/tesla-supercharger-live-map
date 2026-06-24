"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore, type ThemeMode } from "@/store/theme";

const MODES: Array<{ id: ThemeMode; label: string; icon: typeof Sun }> = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useThemeStore();

  if (compact) {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    const Icon = mode === "light" ? Sun : Moon;
    return (
      <button
        type="button"
        className="icon-btn"
        onClick={() => setMode(next)}
        aria-label={`Theme: ${mode}. Tap to switch.`}
        title={`Theme: ${mode}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      className="segmented"
      role="group"
      aria-label="Color theme"
    >
      {MODES.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className="segmented-btn"
          aria-pressed={mode === id}
          onClick={() => setMode(id)}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}