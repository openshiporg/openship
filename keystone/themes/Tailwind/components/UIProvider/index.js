"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "./themeProvider";
import "./dashboard.css";

const inter = Inter({ subsets: ["latin"] });

export const UIProvider = ({ children }) => {
  return (
    <body className={`${inter.className} dark:bg-slate-900 `}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </body>
  );
};
