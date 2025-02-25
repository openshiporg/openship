"use client";

import { ThemeProvider } from "./themeProvider";
import { TooltipProvider } from "../../primitives/default/ui/tooltip";

export const UIProvider = ({ children }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  );
};
