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

  const currentModel = config.keyMode === "local"
    ? config.localKeys?.model || "openai/gpt-4o-mini"
    : null;

  const selectedModel = currentModel
    ? POPULAR_MODELS.find((m) => m.slug === currentModel)
    : null;

  const displayText = config.keyMode === "env"
    ? "Custom"
    : selectedModel?.name || "Custom";

  const handleModelChange = (modelSlug: string) => {
    if (config.keyMode !== "local") return;

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
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsDropdownOpen(false);
    }
  };

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 gap-1.5 px-3 h-8 rounded-full border bg-transparent"
            >
              <span className="truncate">{displayText}</span>
              <ChevronDown className="h-3 w-3 opacity-50" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Model is set by global configuration</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow] gap-1.5 px-3 h-8 rounded-full border bg-transparent"
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
            onChange={(e) => {
              const value = e.target.value;
              setInputValue(value);
              handleModelChange(value);
            }}
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
                onClick={() => {
                  handleModelChange(model.slug);
                  setInputValue("");
                  setIsDropdownOpen(false);
                }}
                className="w-full px-2 py-2 text-left hover:bg-accent rounded-sm transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{model.name}</span>
                  <span className="text-xs text-muted-foreground">{model.slug}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
