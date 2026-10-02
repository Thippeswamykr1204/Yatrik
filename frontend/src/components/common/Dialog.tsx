"use client";

import type { ComponentProps } from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;
export const DialogClose = Primitive.Close;
export function DialogContent({
  children,
  className,
  showCloseButton = true,
  ...props
}: ComponentProps<typeof Primitive.Content> & { showCloseButton?: boolean }) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
      <Primitive.Content
        {...props}
        className={cn(
          "fixed left-1/2 top-1/2 z-[61] max-h-[90svh] w-[calc(100%_-_32px)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border line surface p-6 shadow-2xl sm:p-8 data-[state=open]:animate-in data-[state=open]:fade-in-0",
          className,
        )}
      >
        {children}
        {showCloseButton && (
          <Primitive.Close
            className="icon-btn absolute right-3 top-3"
            aria-label="Close dialog"
          >
            <X size={18} />
          </Primitive.Close>
        )}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
