import { Loader2, Radio } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import type { DataConfidence } from "@/lib/schema/station";

export function RefreshIndicator({
  loading,
  fetchedAt,
  source,
  confidence,
  onRefresh,
}: {
  loading: boolean;
  fetchedAt?: string;
  source?: string;
  confidence?: DataConfidence;
  onRefresh: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      className="panel flex items-center gap-2 px-3 py-2 text-xs text-slate-300 transition hover:border-sky-500/40"
      title="Refresh station data"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />
      ) : (
        <Radio className="h-3.5 w-3.5 text-emerald-400" />
      )}
      <span>
        {fetchedAt ? `Updated ${formatRelativeTime(fetchedAt)}` : "Loading…"}
      </span>
      {source && (
        <span className="text-slate-500">
          · {source}
          {confidence ? ` (${confidence})` : ""}
        </span>
      )}
    </button>
  );
}