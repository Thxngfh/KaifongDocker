import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      keyframes: {
        pop: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "65%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        pop: "pop .28s ease forwards",
      },
    },
  },
};

export default config;
