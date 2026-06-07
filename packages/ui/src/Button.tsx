import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export function Button({
  children,
  variant = "primary",
  style,
  ...props
}: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0.625rem 1.25rem",
    borderRadius: "0.5rem",
    fontWeight: 600,
    fontSize: "0.875rem",
    border: "none",
    cursor: props.disabled ? "not-allowed" : "pointer",
    opacity: props.disabled ? 0.6 : 1,
    ...(variant === "primary"
      ? { backgroundColor: "#171717", color: "#ffffff" }
      : { backgroundColor: "#f4f4f5", color: "#171717" }),
    ...style,
  };

  return (
    <button type="button" style={baseStyle} {...props}>
      {children}
    </button>
  );
}
