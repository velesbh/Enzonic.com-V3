import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slide-right": {
          "0%": {
            transform: "translateX(0)",
          },
          "100%": {
            transform: "translateX(100%)",
          },
        },
        "slide-down": {
          "0%": {
            transform: "translateY(-100%)",
          },
          "100%": {
            transform: "translateY(100%)",
          },
        },
        "float": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-10px)",
          },
        },
        "spin-slow": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        "spin-reverse": {
          "0%": {
            transform: "rotate(360deg)",
          },
          "100%": {
            transform: "rotate(0deg)",
          },
        },
        "bounce-wave": {
          "0%, 100%": {
            transform: "translateY(0)",
            opacity: "1",
          },
          "50%": {
            transform: "translateY(-10px)",
            opacity: "0.7",
          },
        },
        "fade-in-out": {
          "0%, 100%": {
            opacity: "0.5",
          },
          "50%": {
            opacity: "1",
          },
        },
        "gradient": {
          "0%, 100%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
        },
        "draw-path": {
          "0%": {
            strokeDashoffset: "1000",
          },
          "100%": {
            strokeDashoffset: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-right": "slide-right 3s linear infinite",
        "slide-down": "slide-down 4s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "spin-slow": "spin-slow 2s linear infinite",
        "spin-reverse": "spin-reverse 3s linear infinite",
        "bounce-wave": "bounce-wave 1s ease-in-out infinite",
        "fade-in-out": "fade-in-out 2s ease-in-out infinite",
        "gradient": "gradient 3s ease infinite",
        "draw-path-1": "draw-path 2s ease-out infinite",
        "draw-path-2": "draw-path 2.5s ease-out 0.3s infinite",
        "draw-path-3": "draw-path 3s ease-out 0.6s infinite",
        "draw-path-4": "draw-path 2.8s ease-out 0.9s infinite",
        "draw-path-5": "draw-path 2.6s ease-out 1.2s infinite",
        "draw-path-6": "draw-path 1.8s ease-out 0.4s infinite",
        "draw-path-7": "draw-path 2.2s ease-out 0.8s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
