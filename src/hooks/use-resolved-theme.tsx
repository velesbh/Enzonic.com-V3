import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useState, useCallback } from "react";

export function useResolvedTheme() {
  const { theme } = useTheme();
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (theme === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return theme;
  });

  const updateResolvedTheme = useCallback(() => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setResolvedTheme(prev => prev !== systemTheme ? systemTheme : prev);
    } else {
      setResolvedTheme(prev => prev !== theme ? theme : prev);
    }
  }, [theme]);

  useEffect(() => {
    updateResolvedTheme();

    if (theme === "system") {
      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => updateResolvedTheme();

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, updateResolvedTheme]);

  return resolvedTheme;
}