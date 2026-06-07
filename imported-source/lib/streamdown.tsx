import { ReactNode } from "react";

export function Streamdown({ children }: { children: ReactNode }) {
  return <div className="whitespace-pre-wrap">{children}</div>;
}
