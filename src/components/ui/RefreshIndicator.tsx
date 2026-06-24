import { Loader2, Radio } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import type { DataConfidence } from "@/lib/schema/station";
import { IconButton } from "@/components/ui/IconButton";

export function RefreshIndicator({
  loading,
  fetchedAt,
  source,
  confidence,
  onRefresh,
  compact = false,
}: {
  loading: boolean;
  fetchedAt?: string;
  source?: string;
  confidence?: DataConfidence;
  onRefresh: () => void;
  compact?: boolean;
}) {
  const label = loading
    ? "Refreshing station data"
    : fetchedAt
      ? `Data updated ${formatRelativeTime(fetchedAt)}. Tap to refresh.`
      : "Loading station data";

  if (compact) {
    return (
      <IconButton
        label={label}
        onClick={onRefresh}
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent)" }} aria-hidden="true" />
        ) : (
          <Radio className="h-5 w-5" style={{ color: "var(--success)" }} aria-hidden="true" />
        )}
      </IconButton>
    );
  }

  return (
    <button
      type="button"
      onClick={onRefresh}
      aria-busy={loading}
      aria-label={label}
      className="glass flex min-h-[44px] max-w-[min(360px,42vw)] items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px]"
      style={{ color: "var(--text-secondary)" }}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: "var(--accent)" }} aria-hidden="true" />
      ) : (
        <Radio className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} aria-hidden="true" />
      )}
      <span className="truncate font-mono">
        <span aria-live="polite">
          {fetchedAt ? `Updated ${formatRelativeTime(fetchedAt)}` : "Loading…"}
        </span>
        {source && (
          <span className="hidden sm:inline" style={{ color: "var(--text-faint)" }}>
            {" "}
            · {source}
            {confidence ? ` (${confidence})` : ""}
          </span>
        )}
      </span>
    </button>
  );
}