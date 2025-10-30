"use client";

import { ConfigToggleButton } from "./config-toggle-button";
import { SimpleSettingsPopover } from "./simple-settings-popover";
import { AIModelSelector } from "./ai-model-selector";
import { useAiConfig } from "../../hooks/use-ai-config";

interface ModeSplitButtonProps {
  disabled?: boolean;
}

export function ModeSplitButton({
  disabled = false,
}: ModeSplitButtonProps) {
  const { config: aiConfig } = useAiConfig();
  const isGlobalMode = aiConfig.keyMode === "env";

  return (
    <div className="flex items-center gap-2">
      <ConfigToggleButton disabled={disabled} />
      <SimpleSettingsPopover disabled={disabled || isGlobalMode} />
      <AIModelSelector disabled={disabled || isGlobalMode} />
    </div>
  );
}
