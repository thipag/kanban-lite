import * as React from "react";

import { cn } from "../../lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-[128px] w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
