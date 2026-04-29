import React, { createContext, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn, renderWithOptionalSlot } from "@/lib/utils";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("Dialog components must be used within Dialog");
  }
  return context;
}

interface DialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const currentOpen = open ?? internalOpen;

  const contextValue = useMemo(
    () => ({
      open: currentOpen,
      setOpen: (nextOpen: boolean) => {
        if (open === undefined) {
          setInternalOpen(nextOpen);
        }
        onOpenChange?.(nextOpen);
      },
    }),
    [currentOpen, onOpenChange, open],
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = useDialogContext();

  if (asChild) {
    return renderWithOptionalSlot(children, {
      onClick: () => setOpen(true),
    });
  }

  return <button onClick={() => setOpen(true)}>{children}</button>;
}

export function DialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = useDialogContext();

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-2xl",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-4 space-y-1", className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}
