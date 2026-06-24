"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(sheetRef, open);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-root" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="Close panel"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={className ?? "sheet-panel"}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <h2 id={titleId} className="sheet-title">
            {title}
          </h2>
          <button
            type="button"
            className="sheet-close"
            onClick={onClose}
            aria-label={`Close ${title}`}
          >
            Done
          </button>
        </header>
        <div className="sheet-body scroll-thin">{children}</div>
      </div>
    </div>
  );
}