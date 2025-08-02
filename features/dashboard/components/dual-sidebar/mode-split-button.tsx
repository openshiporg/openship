"use client";

import {
  ChevronDownIcon,
  Dot,
  Globe,
  KeyRound,
  LocateFixed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const options = [
  {
    label: "Shared Keys",
    value: "env",
    description:
      "Use API keys configured at the application level through environment variables.",
  },
  {
    label: "Local Keys",
    value: "local",
    description: "Use your own API keys stored locally in your browser.",
  },
  {
    label: "Disable Chat",
    value: "disabled",
    description:
      "Turn off AI chat functionality completely. This will delete your local keys.",
  },
];

interface ModeSplitButtonProps {
  value: "env" | "local" | "disabled";
  onValueChange: (value: "env" | "local" | "disabled") => void;
  disabled?: boolean;
  onSettingsClick?: () => void;
  settingsButtonStatus?: "red" | "indigo";
}

export function ModeSplitButton({
  value,
  onValueChange,
  disabled = false,
  onSettingsClick,
  settingsButtonStatus = "indigo",
}: ModeSplitButtonProps) {
  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  const getIconColorClass = () => {
    if (value === "disabled") return "text-muted-foreground";
    return settingsButtonStatus === "red"
      ? "text-rose-700 dark:text-rose-400"
      : "text-indigo-700 dark:text-indigo-400";
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-full"
            // className="rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10 h-7 text-xs text-muted-foreground"
            disabled={disabled}
          >
            {selectedOption.label === "Shared Keys" ? (
              <>
                <Globe className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Shared Keys</span>
              </>
            ) : selectedOption.label === "Local Keys" ? (
              <>
                <LocateFixed className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Local Keys</span>
              </>
            ) : (
              <>
                <Dot className="size-3.5 text-muted-foreground" aria-hidden="true"/>
                <span className="sr-only">Disable Chat</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="max-w-64 md:max-w-xs"
          side="bottom"
          sideOffset={4}
          align="start"
        >
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(val) =>
              onValueChange(val as "env" | "local" | "disabled")
            }
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="items-start [&>span]:pt-1.5"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-muted-foreground text-xs">
                    {option.description}
                  </span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {value !== "disabled" && (
        <Button
          onClick={handleSettingsClick}
          // className="rounded-none shadow-none first:rounded-s-full last:rounded-e-full focus-visible:z-10 h-7 w-7 text-muted-foreground"
          size="icon"
          aria-label="Settings"
          variant={settingsButtonStatus == "red" ? "destructive" : "outline"}
          disabled={disabled}
          className="size-7 rounded-full"
        >
          <KeyRound className={`size-3`} aria-hidden="true" />
        </Button>
      )}
    </>
  );
}
