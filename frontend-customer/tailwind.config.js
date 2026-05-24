/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary:  "#1a1a2e",
        accent:   "#e94560",
        accent2:  "#f5a623",
        success:  "#16a34a",
        info:     "#0369a1",
        bg:       "#f8f7f4",
      },
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      boxShadow: {
        card: "0 2px 16px rgba(0,0,0,0.08)",
        lift: "0 8px 32px rgba(0,0,0,0.12)",
      },
    },
  },
  plugins: [],
};
