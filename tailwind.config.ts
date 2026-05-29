import type { Config } from "tailwindcss";

// Tokens via CSS variables (definidas em globals.css). Dark mode por classe.
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Paleta oficial SHU
        primary: "var(--primary)", // turquesa #55BDBE
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)", // azul #574E9C
        accent: "var(--accent)", // laranja #E7632F
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-jakarta)", "var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
      },
    },
  },
  plugins: [],
};

export default config;
