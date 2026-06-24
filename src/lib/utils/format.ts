import { formatDistanceToNow, format } from "date-fns";

export function formatRelativeTime(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "unknown";
  }
}

export function formatTimestamp(iso: string): string {
  try {
    return format(new Date(iso), "MMM d, yyyy HH:mm");
  } catch {
    return iso;
  }
}

export function formatPower(kw: number): string {
  if (!kw) return "—";
  if (kw >= 1_000_000) return `${(kw / 1_000_000).toFixed(2)} GW`;
  if (kw >= 1_000) return `${(kw / 1_000).toFixed(kw >= 10_000 ? 1 : 2)} MW`;
  return `${Math.round(kw).toLocaleString()} kW`;
}

export function formatCount(value: number): string {
  return value.toLocaleString();
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}