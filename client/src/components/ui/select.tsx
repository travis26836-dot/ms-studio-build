import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onValueChange?: (value: string) => void;
}

const SelectContext = createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within Select");
  }
  return context;
}

export function Select({
  children,
  value,
  onValueChange,
}: {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const contextValue = useMemo(
    () => ({
      value,
      open,
      setOpen,
      onValueChange,
    }),
    [onValueChange, open, value]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
        className
      )}
      onClick={() => setOpen(!open)}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelectContext();
  return <span>{value ?? placeholder}</span>;
}

export function SelectContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = useSelectContext();
  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        "absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  const { onValueChange, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      className="flex w-full rounded-md px-3 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
      onClick={() => {
        onValueChange?.(value);
        setOpen(false);
      }}
    >
      {children}
    </button>
  );
}
