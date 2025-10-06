import type { Appearance } from "@clerk/types";

export const getClerkAppearance = (isDark: boolean): Appearance => ({
  layout: {
    socialButtonsVariant: "iconButton",
    socialButtonsPlacement: "bottom",
  },
  variables: {
    // Main colors - dynamic based on theme
    colorPrimary: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    colorBackground: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
    colorInputBackground: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(0 0% 100%)",
    colorInputText: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    colorText: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    colorTextSecondary: isDark ? "hsl(215 20.2% 65.1%)" : "hsl(215.4 16.3% 46.9%)",
    
    // Border and surface colors
    colorNeutral: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)",
    borderRadius: "0.5rem",
    
    // Success and danger states
    colorSuccess: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
    colorDanger: isDark ? "hsl(0 62.8% 30.6%)" : "hsl(0 84.2% 60.2%)",
    colorWarning: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
  },
  elements: {
    // Main container
    rootBox: {
      backgroundColor: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
    },
    
    // Modal and card styling
    modalContent: {
      backgroundColor: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
      border: `1px solid ${isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)"}`,
      borderRadius: "0.75rem",
      boxShadow: isDark 
        ? "0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)"
        : "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    },
    
    // Card styling
    card: {
      backgroundColor: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(0 0% 100%)",
      border: `1px solid ${isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)"}`,
      borderRadius: "0.75rem",
      boxShadow: isDark
        ? "0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)"
        : "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    },
    
    // Header styling
    headerTitle: {
      color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
      fontSize: "1.5rem",
      fontWeight: "600",
    },
    headerSubtitle: {
      color: isDark ? "hsl(215 20.2% 65.1%)" : "hsl(215.4 16.3% 46.9%)",
    },
    
    // Form elements
    formButtonPrimary: {
      backgroundColor: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
      color: isDark ? "hsl(222.2 84% 4.9%)" : "hsl(210 40% 98%)",
      borderRadius: "0.5rem",
      fontSize: "0.875rem",
      fontWeight: "500",
      "&:hover": {
        backgroundColor: isDark ? "hsl(210 40% 90%)" : "hsl(222.2 84% 10%)",
      },
    },
    
    formFieldInput: {
      backgroundColor: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(0 0% 100%)",
      border: `1px solid ${isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)"}`,
      borderRadius: "0.5rem",
      color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
      "&:focus": {
        borderColor: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
        boxShadow: `0 0 0 2px ${isDark ? "hsl(210 40% 98% / 0.2)" : "hsl(222.2 84% 4.9% / 0.2)"}`,
      },
    },
    
    formFieldLabel: {
      color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
      fontSize: "0.875rem",
      fontWeight: "500",
    },
    
    // Social buttons
    socialButtonsBlockButton: {
      backgroundColor: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(0 0% 100%)",
      border: `1px solid ${isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)"}`,
      borderRadius: "0.5rem",
      color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
      "&:hover": {
        backgroundColor: isDark ? "hsl(217.2 32.6% 20%)" : "hsl(210 40% 98%)",
      },
    },
    
    // Links and text elements
    footerActionText: {
      color: isDark ? "hsl(215 20.2% 65.1%)" : "hsl(215.4 16.3% 46.9%)",
    },
    
    footerActionLink: {
      color: isDark ? "hsl(210 40% 98%)" : "hsl(222.2 84% 4.9%)",
      "&:hover": {
        color: isDark ? "hsl(210 40% 90%)" : "hsl(222.2 84% 10%)",
      },
    },
    
    // Divider
    dividerLine: {
      backgroundColor: isDark ? "hsl(217.2 32.6% 17.5%)" : "hsl(214.3 31.8% 91.4%)",
    },
    dividerText: {
      color: isDark ? "hsl(215 20.2% 65.1%)" : "hsl(215.4 16.3% 46.9%)",
    },
  },
});