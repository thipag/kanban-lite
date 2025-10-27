import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import * as React from "react";

import { cn } from "../../lib/utils";

const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuContent = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Content>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>>(
  ({ className, sideOffset = 8, ...props }, ref) => (
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[180px] rounded-2xl border border-slate-800 bg-slate-900 p-2 text-sm text-slate-200 shadow-xl",
        className
      )}
      {...props}
    />
  )
);
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<React.ElementRef<typeof DropdownMenuPrimitive.Item>, React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item>>(
  ({ className, ...props }, ref) => (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors focus:bg-slate-800",
        className
      )}
      {...props}
    />
  )
);
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
