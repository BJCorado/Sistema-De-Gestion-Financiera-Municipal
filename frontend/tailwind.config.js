/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#1B2A6B",
          dark: "#131F52",
        },
        gold: {
          DEFAULT: "#F2C438",
          dark: "#D9A91F",
        },
        semaforo: {
          rojo: "#D8394A",
          ambar: "#E68A1C",
          verde: "#1E9E5B",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
