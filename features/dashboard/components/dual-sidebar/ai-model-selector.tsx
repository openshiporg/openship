"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAiConfig } from "../../hooks/use-ai-config";

// Popular AI models
const POPULAR_MODELS = [
  { name: "GPT-5", slug: "openai/gpt-5" },
  { name: "GPT-5 Mini", slug: "openai/gpt-5-mini" },
  { name: "GPT-4o Mini", slug: "openai/gpt-4o-mini" },
  { name: "GPT OSS 120B", slug: "openai/gpt-oss-120b" },
  { name: "Claude Sonnet 4", slug: "anthropic/claude-sonnet-4" },
  { name: "Claude 3.7 Sonnet", slug: "anthropic/claude-3.7-sonnet" },
  { name: "Gemini 2.5 Flash", slug: "google/gemini-2.5-flash" },
  { name: "Gemini 2.5 Pro", slug: "google/gemini-2.5-pro" },
];

interface AIModelSelectorProps {
  disabled?: boolean;
}

export function AIModelSelector({ disabled = false }: AIModelSelectorProps) {
  const { config, setConfig } = useAiConfig();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const currentModel =
    config.keyMode === "local"
      ? config.localKeys?.model || "openai/gpt-4o-mini"
      : process.env.NEXT_PUBLIC_OPENROUTER_MODEL || "openai/gpt-4o-mini";

  const handleModelChange = (modelSlug: string) => {
    if (config.keyMode === "local") {
      setConfig({
        ...config,
        localKeys: {
          provider: config.localKeys?.provider || "openrouter",
          apiKey: config.localKeys?.apiKey || "",
          model: modelSlug,
          maxTokens: config.localKeys?.maxTokens || "4000",
          customEndpoint: config.localKeys?.customEndpoint,
        },
      });
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    handleModelChange(value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  const handleSelectModel = (modelSlug: string) => {
    handleModelChange(modelSlug);
    setInputValue("");
    setIsDropdownOpen(false);
  };

  const selectedModel = POPULAR_MODELS.find((m) => m.slug === currentModel);
  const displayText = selectedModel?.name || currentModel;

  const selector = (
    <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:border-none gap-1.5 px-3 has-[>svg]:px-4 border-border dark:bg-secondary h-8 rounded-full border bg-transparent"
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Model slug (e.g. openai/gpt-4o-mini)"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="h-9 text-sm"
          />
        </div>
        <div className="py-2 max-h-[280px] overflow-y-auto">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Popular Models
          </div>
          <div className="space-y-1">
            {POPULAR_MODELS.map((model) => (
              <button
                key={model.slug}
                onClick={() => handleSelectModel(model.slug)}
                className="w-full px-2 py-2 text-left hover:bg-accent rounded-sm transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {model.slug}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{selector}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Model is set by global configuration</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return selector;
}
