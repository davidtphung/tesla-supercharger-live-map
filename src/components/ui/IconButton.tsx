import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  size?: "md" | "lg";
  variant?: "default" | "ghost" | "accent";
};

export function IconButton({
  label,
  children,
  size = "md",
  variant = "default",
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        "icon-btn",
        size === "lg" && "icon-btn-lg",
        variant === "ghost" && "icon-btn-ghost",
        variant === "accent" && "icon-btn-accent",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}