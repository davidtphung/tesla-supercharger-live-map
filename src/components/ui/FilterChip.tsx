import clsx from "clsx";

export function FilterChip({
  label,
  pressed,
  onPress,
  tone = "sky",
}: {
  label: string;
  pressed: boolean;
  onPress: () => void;
  tone?: "sky" | "amber" | "violet";
}) {
  const tones = {
    sky: pressed
      ? "border-sky-500/70 bg-sky-500/20 text-sky-200"
      : "border-slate-600 text-slate-300",
    amber: pressed
      ? "border-amber-500/70 bg-amber-500/20 text-amber-100"
      : "border-slate-600 text-slate-300",
    violet: pressed
      ? "border-violet-500/70 bg-violet-500/20 text-violet-100"
      : "border-slate-600 text-slate-300",
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={pressed}
      aria-label={label}
      onClick={onPress}
      className={clsx(
        "filter-chip capitalize",
        tones[tone]
      )}
    >
      {label}
    </button>
  );
}