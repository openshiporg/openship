"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "./themeProvider";
import "./dashboard.css";
import { TooltipProvider } from "../../primitives/default/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const UIProvider = ({ children }) => {
  return (
    <body className={`bg-white lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950 ${inter.className}`}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </body>
  );
};
