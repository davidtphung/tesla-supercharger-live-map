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
  const toneClass =
    tone === "amber" ? "tone-gold" : tone === "violet" ? "tone-violet" : "";

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={pressed}
      aria-label={label}
      onClick={onPress}
      className={clsx("filter-chip capitalize", toneClass)}
    >
      {label}
    </button>
  );
}