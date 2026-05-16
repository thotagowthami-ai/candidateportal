/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#006c49",
          container: "#10b981",
          fixed: {
            dim: "rgba(16, 185, 129, 0.2)",
          }
        },
        surface: {
          DEFAULT: "#f7f9fb",
          bright: "#ffffff",
          dim: "#eef1f3",
          container: {
            lowest: "#ffffff",
            low: "#f2f4f6",
            high: "#ebedf0",
            highest: "#e0e3e5",
          }
        },
        on: {
          surface: "#191c1e",
          surface_variant: "#3c4a42",
        },
        outline: {
          variant: "rgba(187, 202, 191, 0.15)",
        }
      },
      fontFamily: {
        space: ["'Space Grotesk'", "sans-serif"],
        inter: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        'soft': '0 12px 40px rgba(25, 28, 30, 0.06)',
      },
      borderRadius: {
        'md': '0.375rem',
      }
    },
  },
  plugins: [],
};
