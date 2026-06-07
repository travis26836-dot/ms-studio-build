import { ReactNode, useEffect } from "react";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: "light" | "dark";
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
}: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", defaultTheme === "dark");
  }, [defaultTheme]);

  return <>{children}</>;
}
