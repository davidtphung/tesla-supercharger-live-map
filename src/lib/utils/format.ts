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
  return `${kw} kW`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}