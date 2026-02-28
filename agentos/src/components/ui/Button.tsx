import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background-base disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-text-primary hover:bg-accent-hover shadow-sm",
        secondary:
          "bg-background-elevated text-text-primary border border-border hover:bg-surface-hover hover:border-border-strong",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
        destructive:
          "bg-danger text-text-primary hover:bg-danger/90",
        outline:
          "border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover hover:border-border-strong",
      },
      size: {
        sm: "h-7 rounded-sm px-2.5 text-xs",
        md: "h-8 rounded px-3 text-sm",
        lg: "h-9 rounded-md px-4 text-base",
        icon: "h-8 w-8 rounded",
        "icon-sm": "h-7 w-7 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
