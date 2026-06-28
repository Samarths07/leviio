import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#fafafa",
        card: {
          DEFAULT: "#111113",
          foreground: "#fafafa",
        },
        popover: {
          DEFAULT: "#131316",
          foreground: "#fafafa",
        },
        border: "#1f1f23",
        input: "#1f1f23",
        ring: "#7c3aed",
        primary: {
          DEFAULT: "#7c3aed",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#1c1c20",
          foreground: "#fafafa",
        },
        muted: {
          DEFAULT: "#18181b",
          foreground: "#71717a",
        },
        accent: {
          DEFAULT: "#27272a",
          foreground: "#fafafa",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
        xl: "0.875rem",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #9333ea 100%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,58,237,0.2), 0 12px 40px -12px rgba(124,58,237,0.3)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.96)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(22px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "scale(0.92) translateY(16px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(-26px) translateX(14px)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.05)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.2s ease-out both",
        "slide-in-right": "slide-in-right 0.3s ease-out both",
        "slide-in-left": "slide-in-left 0.3s ease-out both",
        "toast-in": "toast-in 0.3s ease-out both",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
        "pop-in": "pop-in 0.5s cubic-bezier(0.16,1,0.3,1) both",
        float: "float 9s ease-in-out infinite",
        "gradient-pan": "gradient-pan 12s ease infinite",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
