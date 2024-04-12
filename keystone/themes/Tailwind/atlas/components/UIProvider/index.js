"use client";

import { Inter } from "next/font/google";
import { ThemeProvider } from "./themeProvider";
import "./dashboard.css";
import { TooltipProvider } from "@keystone/primitives/default/ui/tooltip";

const inter = Inter({ subsets: ["latin"] });

export const UIProvider = ({ children }) => {
  return (
    <body className={`${inter.className}`}>
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
