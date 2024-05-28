import React, { useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  DropdownLabel,
} from "../../primitives/default/ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

const ToggleButton = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-1 px-2.5 inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
      isActive
        ? "border bg-background text-foreground shadow-sm"
        : "text-zinc-600 dark:text-zinc-200"
    }`}
  >
    {children}
  </button>
);

export const ThemeToggle = () => {
  const { setTheme, theme } = useTheme();

  return (
    <div className="border shadow-inner mt-4 gap-1 w-full inline-flex justify-center rounded-sm bg-slate-50 dark:bg-muted p-1 text-muted-foreground">
      <ToggleButton
        isActive={theme === "system"}
        onClick={() => setTheme("system")}
      >
        <Monitor className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        isActive={theme === "light"}
        onClick={() => setTheme("light")}
      >
        <Sun className="h-4 w-4" />
      </ToggleButton>
      <ToggleButton
        isActive={theme === "dark"}
        onClick={() => setTheme("dark")}
      >
        <Moon className="h-4 w-4" />
      </ToggleButton>
    </div>
  );
};
