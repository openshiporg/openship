"use client";

import { Settings2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ModeSplitButtonProps {
  disabled?: boolean;
  onSettingsClick?: () => void;
}

export function ModeSplitButton({
  disabled = false,
  onSettingsClick,
}: ModeSplitButtonProps) {
  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  return (
    <Button
      onClick={handleSettingsClick}
      size="icon"
      aria-label="Settings"
      variant="ghost"
      disabled={disabled}
      className="size-7 rounded-full"
    >
      <Settings2 className="size-5 text-muted-foreground/70" aria-hidden="true" />
    </Button>
  );
}
