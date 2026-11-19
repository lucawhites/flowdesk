import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Pulsanti in vetro (stili .btn-* in globals.css): principali pieni con riflesso, secondari in
// vetro trasparente; tutti si gonfiano con la molla quando li premi.
const buttonVariants = cva(
  "btn-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background cursor-pointer",
  {
    variants: {
      variant: {
        primary: "btn-gloss bg-primary text-primary-foreground hover:opacity-95",
        secondary: "btn-glass text-foreground",
        outline: "btn-glass text-foreground",
        ghost: "text-foreground hover:bg-foreground/5 active:bg-foreground/10",
        danger: "btn-gloss bg-danger text-white hover:opacity-95 [--btn-tint:var(--danger)]",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
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
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
