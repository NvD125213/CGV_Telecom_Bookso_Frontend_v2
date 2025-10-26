import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  // Badge nhỏ gọn, căn giữa nội dung
  "inline-flex justify-center items-center rounded-full border text-center px-2 py-[3px] text-[10px] font-medium leading-none select-none transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        gradient:
          "text-white shadow-sm bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 hover:from-yellow-500 hover:via-amber-600 hover:to-orange-600",
      },
      shiny: {
        true: "relative overflow-hidden",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      shiny: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  shiny?: boolean;
  shinySpeed?: number;
}

function Badge({
  className,
  variant,
  shiny = false,
  shinySpeed = 5,
  children,
  ...props
}: BadgeProps) {
  const animationDuration = `${shinySpeed}s`;

  return (
    <span
      className={cn(badgeVariants({ variant, shiny }), className)}
      {...props}>
      <span className={shiny ? "relative z-10" : ""}>{children}</span>

      {shiny && (
        <>
          <span
            className="absolute inset-0 pointer-events-none animate-shine dark:hidden"
            style={{
              background:
                "linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animationDuration,
              mixBlendMode: "screen",
            }}
          />
          <span
            className="absolute inset-0 pointer-events-none animate-shine hidden dark:block"
            style={{
              background:
                "linear-gradient(120deg, transparent 40%, rgba(0,0,150,0.25) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animationDuration,
              mixBlendMode: "multiply",
            }}
          />
        </>
      )}
    </span>
  );
}

export { Badge, badgeVariants };
