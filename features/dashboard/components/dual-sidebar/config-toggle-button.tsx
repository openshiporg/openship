"use client";

import { Globe } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAiConfig } from "../../hooks/use-ai-config";

interface ConfigToggleButtonProps {
  disabled?: boolean;
}

export function ConfigToggleButton({
  disabled = false,
}: ConfigToggleButtonProps) {
  const { config, setConfig } = useAiConfig();
  const isGlobal = config.keyMode === "env";

  const handleToggle = () => {
    const newMode = isGlobal ? "local" : "env";
    setConfig({
      ...config,
      keyMode: newMode,
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={`border inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] shadow-xs gap-1.5 px-3 has-[>svg]:px-2.5 size-8 rounded-full
              ${isGlobal ? "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800/50" : "bg-emerald-400/15 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"}`
            }
          >
            <Globe
              className="size-3.5"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs max-w-[240px]">
            {isGlobal ? (
              <>
                <p className="font-medium mb-1">Global Configuration</p>
                <p className="text-muted-foreground mb-2">
                  Using environment variables set by the application deployer
                </p>
                <div className="space-y-1">
                  <code className="block bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                    OPENROUTER_API_KEY
                  </code>
                  <code className="block bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                    OPENROUTER_MODEL
                  </code>
                  <code className="block bg-muted px-1.5 py-0.5 rounded text-[10px] font-mono">
                    OPENROUTER_MAX_TOKENS
                  </code>
                </div>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">Local Configuration</p>
                <p className="text-muted-foreground">
                  Using your own API key and settings. Keys are saved locally to your machine.
                </p>
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
