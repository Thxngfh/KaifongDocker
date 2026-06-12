import * as React from "react";
import { SquarePlus } from "lucide-react";

// concat classnames
function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// กำหนดขนาด
const fabSizes = {
  sm: "h-10 w-10",
  default: "h-14 w-14",
  lg: "h-16 w-16",
};

export interface FabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: keyof typeof fabSizes;
  icon?: React.ReactNode;
}

const FabButton = React.forwardRef<HTMLButtonElement, FabButtonProps>(
  ({ size = "default", className, icon, children, ...props }, ref) => {
    const sizeClass = fabSizes[size];

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 active:scale-95",
          sizeClass,
          "bg-primary text-primary-foreground hover:bg-primary/90",
          className
        )}
        ref={ref}
        {...props}
      >
        {icon || children || <SquarePlus size={24} strokeWidth={2} />}
      </button>
    );
  }
);

FabButton.displayName = "FabButton";

export { FabButton };