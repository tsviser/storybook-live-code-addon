import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  color?: "primary" | "success" | "danger";
  size?: "small" | "medium" | "large";
  variant?: "contained" | "outlined" | "text";
};

export function Button({
  children,
  color = "primary",
  size = "medium",
  variant = "contained",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "mockButton",
        `mockButton--${color}`,
        `mockButton--${size}`,
        `mockButton--${variant}`
      ].join(" ")}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
