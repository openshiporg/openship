"use client"

import * as React from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex w-full items-center justify-between px-2 py-1.5">
      <span className="text-sm">Theme</span>
      <fieldset className="flex h-5 items-center rounded-md border bg-muted p-0.5 gap-0.5">
        <legend className="sr-only">Select a display theme:</legend>
        {[
          { value: "system", icon: Monitor },
          { value: "light", icon: Sun },
          { value: "dark", icon: Moon },
        ].map(({ value, icon: Icon }) => (
          <label
            key={value}
            className={`relative flex h-4 w-4 cursor-pointer items-center justify-center rounded-sm text-sm transition-colors hover:bg-background ${
              theme === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={(e) => setTheme(e.target.value)}
              className="absolute inset-0 opacity-0"
              aria-label={value}
            />
            <Icon className="h-3 w-3" />
          </label>
        ))}
      </fieldset>
    </div>
  )
} 