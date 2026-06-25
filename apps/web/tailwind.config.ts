import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // 1. Scan everything inside your Next.js app directory
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // 2. CRITICAL: Scan shared UI packages in your monorepo workspace if you use them
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
