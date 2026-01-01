/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6200ee",
          light: "#7c4dff",
          dark: "#4a00b0",
        },
        secondary: {
          DEFAULT: "#03dac6",
          light: "#66fff9",
          dark: "#00a896",
        },
        background: {
          DEFAULT: "#f5f5f5",
          card: "#f7f2fa",
        },
        text: {
          primary: "#22223b",
          secondary: "#6c6c80",
          disabled: "#999999",
        },
        success: "#4caf50",
        error: "#e53935",
        warning: "#ff9800",
      },
      spacing: {
        card: "20px",
      },

      borderRadius: {
        card: "16px",
        button: "12px",
      },

      fontSize: {
        "habit-title": ["20px", { lineHeight: "28px", fontWeight: "700" }],
        "habit-desc": ["15px", { lineHeight: "20px" }],
      },
    },
  },

  plugins: [],
};
