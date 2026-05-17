/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./context/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── TrustMart Brand Palette ─────────────────────
        void:    "#04040f",        // deepest background
        abyss:   "#080816",        // main background
        surface: "#0e0e1f",        // card background
        border:  "#1a1a38",        // default border
        rim:     "#2a2a50",        // hover border

        // Primary: electric indigo
        primary: {
          DEFAULT: "#6d28d9",
          50:  "#f5f3ff",
          100: "#ede9fe",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },

        // Accent: neon cyan
        accent: {
          DEFAULT: "#06b6d4",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },

        // Status
        success: "#10b981",
        warning: "#f59e0b",
        danger:  "#ef4444",
        info:    "#3b82f6",

        // Text
        ink: {
          primary:   "#f1f5f9",
          secondary: "#94a3b8",
          muted:     "#475569",
          faint:     "#1e293b",
        },
      },

      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },

      backgroundImage: {
        "gradient-brand":  "linear-gradient(135deg, #6d28d9 0%, #06b6d4 100%)",
        "gradient-card":   "linear-gradient(135deg, rgba(109,40,217,0.08) 0%, rgba(6,182,212,0.04) 100%)",
        "gradient-hero":   "radial-gradient(ellipse at top, #1a0533 0%, #04040f 60%)",
        "gradient-glow":   "radial-gradient(circle, rgba(109,40,217,0.3) 0%, transparent 70%)",
        "mesh-pattern":    "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236d28d9' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },

      boxShadow: {
        "glow-sm":  "0 0 15px rgba(109,40,217,0.3)",
        "glow-md":  "0 0 30px rgba(109,40,217,0.4)",
        "glow-lg":  "0 0 60px rgba(109,40,217,0.3)",
        "glow-cyan":"0 0 20px rgba(6,182,212,0.4)",
        "card":     "0 4px 24px rgba(0,0,0,0.5)",
        "card-hover":"0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(109,40,217,0.2)",
      },

      animation: {
        "fade-in":     "fadeIn 0.5s ease forwards",
        "slide-up":    "slideUp 0.4s ease forwards",
        "pulse-slow":  "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":   "spin 8s linear infinite",
        "float":       "float 6s ease-in-out infinite",
        "shimmer":     "shimmer 2s linear infinite",
        "glow-pulse":  "glowPulse 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%":   { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%":   { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 15px rgba(109,40,217,0.3)" },
          "50%":      { boxShadow: "0 0 40px rgba(109,40,217,0.6), 0 0 15px rgba(6,182,212,0.3)" },
        },
      },

      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
