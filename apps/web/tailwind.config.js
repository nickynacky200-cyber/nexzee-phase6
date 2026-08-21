/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexzee: "#5B2EBF",
        "nexzee-dark": "#3D1F8C",
        "nexzee-light": "#7C4DEB",
        "nexzee-soft": "#F1ECFB",
        surface: "#F7F7FB",
        card: "#FFFFFF",
        ink: "#181528",
        "ink-soft": "#6B6580",
        "ink-faint": "#A29CB8",
        success: "#16A34A",
        danger: "#DC2626",
        warning: "#D97706",
      },
    },
  },
  plugins: [],
};