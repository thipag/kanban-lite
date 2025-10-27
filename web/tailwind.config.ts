import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f5ff",
          100: "#e8e8ff",
          200: "#d0d0ff",
          300: "#b3b3ff",
          400: "#7d7dff",
          500: "#4a4aff",
          600: "#3737db",
          700: "#2b2bb0",
          800: "#23238a",
          900: "#1f1f6e"
        }
      },
      boxShadow: {
        card: "0 6px 20px -12px rgba(15, 23, 42, 0.4)"
      }
    }
  },
  plugins: []
};

export default config;
