import { ClerkProvider } from "@clerk/clerk-react";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { getClerkAppearance } from "@/lib/clerk-appearance";
import { env } from "@/lib/env";
import { useEffect, useState } from "react";

interface ThemedClerkProviderProps {
  children: React.ReactNode;
}

export function ThemedClerkProvider({ children }: ThemedClerkProviderProps) {
  const resolvedTheme = useResolvedTheme();
  const [appearance, setAppearance] = useState(() => getClerkAppearance(resolvedTheme === "dark"));

  // Update appearance when theme changes
  useEffect(() => {
    setAppearance(getClerkAppearance(resolvedTheme === "dark"));
  }, [resolvedTheme]);

  return (
    <ClerkProvider
      publishableKey={env.CLERK_PUBLISHABLE_KEY}
      appearance={appearance}
    >
      {children}
    </ClerkProvider>
  );
}