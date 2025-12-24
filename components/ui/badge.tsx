import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-slate-700 text-slate-50 hover:bg-slate-800",
    secondary: "border-transparent bg-slate-200 text-slate-900 hover:bg-slate-300",
    destructive: "border-transparent bg-slate-400 text-slate-900 hover:bg-slate-500",
    outline: "text-slate-900 border-slate-300",
    success: "border-transparent bg-slate-600 text-slate-50 hover:bg-slate-700",
    warning: "border-transparent bg-slate-300 text-slate-900 hover:bg-slate-400",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
