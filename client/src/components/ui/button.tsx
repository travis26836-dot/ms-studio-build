import React from "react";
import { cn, renderWithOptionalSlot } from "@/lib/utils";

const variantClasses = {
  default: "bg-primary text-primary-foreground hover:opacity-85",
  ghost: "bg-transparent text-foreground hover:bg-accent",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-accent hover:border-ring/40",
  secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
};

const sizeClasses = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3 text-sm",
  lg: "h-11 px-6 text-base",
  icon: "h-10 w-10",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      asChild = false,
      className,
      variant = "default",
      size = "default",
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      "inline-flex items-center justify-center rounded-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    if (asChild) {
      return renderWithOptionalSlot(children, {
        className: classes,
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
