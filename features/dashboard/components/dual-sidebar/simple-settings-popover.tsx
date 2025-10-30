"use client";

import { Settings2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface SimpleSettingsPopoverProps {
  disabled?: boolean;
}

const PROVIDERS = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "custom", label: "Custom" },
];

export function SimpleSettingsPopover({ disabled = false }: SimpleSettingsPopoverProps) {
  const [open, setOpen] = useState(false);
  const { config, setConfig } = useAiConfig();
  const [provider, setProvider] = useState<"openrouter" | "custom">("openrouter");
  const [customEndpoint, setCustomEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [maxTokens, setMaxTokens] = useState("4000");

  // Sync with current config when popover opens
  useEffect(() => {
    if (open) {
      const currentProvider = config.localKeys?.provider as "openrouter" | "custom" | undefined;
      setProvider(currentProvider || "openrouter");
      setCustomEndpoint(config.localKeys?.customEndpoint || "");
      setApiKey(config.localKeys?.apiKey || "");
      setMaxTokens(config.localKeys?.maxTokens || "4000");
    }
  }, [open, config]);

  const handleSave = () => {
    const finalApiKey = apiKey || config.localKeys?.apiKey || "";
    setConfig({
      ...config,
      localKeys: {
        provider,
        customEndpoint,
        apiKey: finalApiKey,
        model: config.localKeys?.model || "openai/gpt-4o-mini",
        maxTokens,
      },
    });
    setOpen(false);
  };

  const button = (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-[color,box-shadow] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive text-secondary-foreground shadow-xs hover:bg-secondary/80 dark:border-none gap-1.5 px-3 has-[>svg]:px-2.5 border-border dark:bg-secondary size-8 rounded-full border bg-transparent"
    >
      <Settings2 className="size-3.5" />
    </button>
  );

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-block">
              {button}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Switch to local configuration to bring your own key</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {button}
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] p-0"
        align="start"
        side="top"
        sideOffset={8}
      >
        <div className="p-4">
          {/* Provider Selection */}
          <div className="mb-4">
            <Label htmlFor="provider" className="text-xs font-medium">
              Provider
            </Label>
            <Select value={provider} onValueChange={(value: "openrouter" | "custom") => setProvider(value)}>
              <SelectTrigger id="provider" className="h-9 text-sm mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {provider === "custom" && (
              <div className="mt-1.5">
                <Input
                  placeholder="https://api.example.com/v1"
                  value={customEndpoint}
                  onChange={(e) => setCustomEndpoint(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            )}
          </div>

          {/* API Key */}
          <div>
            <Label htmlFor="api-key" className="text-xs font-medium">
              API Key
            </Label>
            <Input
              id="api-key"
              type="text"
              placeholder={
                provider === 'custom'
                  ? "Enter your API key..."
                  : "sk-or-v1-..."
              }
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-9 text-sm font-mono mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-3">
              Your key is only saved locally in your browser
            </p>
          </div>

          <div className="mt-3">
            <Label htmlFor="max-tokens" className="text-xs font-medium">
              Max Tokens
            </Label>
            <Select value={maxTokens} onValueChange={setMaxTokens}>
              <SelectTrigger id="max-tokens" className="h-9 text-sm mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2000">2,000 tokens</SelectItem>
                <SelectItem value="4000">4,000 tokens</SelectItem>
                <SelectItem value="8000">8,000 tokens</SelectItem>
                <SelectItem value="16000">16,000 tokens</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!apiKey && !config.localKeys?.apiKey}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
