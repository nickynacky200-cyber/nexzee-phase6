/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nexzee: {
          DEFAULT: "#5B2EBF", // primary purple/indigo
          dark: "#3D1F8C",
          light: "#7C4DEB",
          soft: "#F1ECFB", // tint for badges/highlights on white
        },
        surface: "#F7F7FB", // app background
        card: "#FFFFFF",
        ink: {
          DEFAULT: "#181528", // primary text
          soft: "#6B6580", // secondary text
          faint: "#A29CB8", // placeholder / disabled
        },
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#D97706",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        card: "1.25rem",
        pill: "999px",
      },
      boxShadow: {
        card: "0 2px 16px rgba(24, 21, 40, 0.06)",
        floating: "0 8px 24px rgba(91, 46, 191, 0.18)",
      },
    },
  },
  plugins: [],
};
