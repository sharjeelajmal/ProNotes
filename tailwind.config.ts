import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f4f6fa",
          100: "#e9edf5",
          200: "#c7d4e7",
          300: "#92add1",
          400: "#5881b5",
          500: "#385e94",
          600: "#2c4a79",
          700: "#243c63",
          800: "#1e3352",
          900: "#0f2747",
          950: "#0B1120", // Deep Ocean Blue background for dark mode
        },
        electricBlue: {
          DEFAULT: "#3B82F6",
          hover: "#2563eb",
          glow: "rgba(59, 130, 246, 0.3)",
        },
        indigoAccent: {
          DEFAULT: "#6366F1",
          hover: "#4f46e5",
        },
      },
      animation: {
        "spring-in": "springIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1) forwards",
        "fade-in": "fadeIn 0.25s ease-out forwards",
        "slide-in-left": "slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        springIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
