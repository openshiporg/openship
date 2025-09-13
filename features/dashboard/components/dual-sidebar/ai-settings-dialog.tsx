"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAiConfig } from "../../hooks/use-ai-config";
import { checkSharedKeysAvailable } from "../../actions/ai-chat";

// Popular AI models with user-friendly names and their OpenRouter slugs
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

interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

function AISettingsDialogInner({ onSave, onOpenChange }: { onSave: () => void; onOpenChange: (open: boolean) => void }) {
  // Initialize state from current storage values
  const { config, setConfig } = useAiConfig();
  const [configType, setConfigType] = useState<"global" | "local">(config.keyMode === "env" ? "global" : "local");
  const [localKeys, setLocalKeys] = useState({
    apiKey: config.localKeys?.apiKey || "",
    model: config.localKeys?.model || "openai/gpt-4o-mini",
    maxTokens: config.localKeys?.maxTokens || "4000",
  });
  const [sharedKeysStatus, setSharedKeysStatus] = useState<{
    available: boolean;
    missing: { apiKey: boolean; model: boolean; maxTokens: boolean };
  } | null>(null);
  const [isLoadingSharedKeys, setIsLoadingSharedKeys] = useState(true);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Check shared keys availability on mount
  useEffect(() => {
    const checkKeys = async () => {
      setIsLoadingSharedKeys(true);
      try {
        const status = await checkSharedKeysAvailable();
        setSharedKeysStatus(status);
      } catch (error) {
        console.error("Failed to check shared keys:", error);
        setSharedKeysStatus({ available: false, missing: { apiKey: true, model: true, maxTokens: true } });
      } finally {
        setIsLoadingSharedKeys(false);
      }
    };
    checkKeys();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save configuration - map UI format back to storage format
    const config = {
      keyMode: configType === "global" ? "env" as const : "local" as const,
      localKeys: configType === "local" ? localKeys : undefined
    };

    setConfig(config);
    onSave();
    onOpenChange(false);
  };

  const getCurrentStepNumber = (step: string) => {
    if (configType === "global") {
      return 1; // Only configuration type step
    } else {
      switch (step) {
        case "config": return 1;
        case "model": return 2;
        case "apikey": return 3;
        case "settings": return 4;
        default: return 1;
      }
    }
  };

  return (
    <DialogContent className="overflow-visible p-0 sm:max-w-xl gap-0">
      <DialogHeader className="border-b px-6 py-4 mb-0">
        <DialogTitle>AI Assistant Settings</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <div className="grid grid-cols-[auto_1fr] gap-4">
            {/* Step 1: Configuration Type */}
            <div className="flex flex-col items-center">
              <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground mb-4">
                {getCurrentStepNumber("config")}
              </div>
              {(configType === "local" || configType === "global") && (
                <div className="w-px bg-border flex-1"></div>
              )}
            </div>
            <div className="pb-4">
              <Label
                htmlFor="config-type"
                className="text-sm font-medium text-foreground"
              >
                Configuration Type
              </Label>
              <Select value={configType} onValueChange={(value: "global" | "local") => setConfigType(value)}>
                <SelectTrigger id="config-type" className="w-full shadow-sm mt-3">
                  <SelectValue placeholder="Select configuration type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Configuration</SelectItem>
                  <SelectItem value="local">Local Configuration</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Global Configuration - Show Available Keys */}
              {configType === "global" && (
                <div className="mt-6">
                  {isLoadingSharedKeys ? (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Checking configuration...</p>
                    </div>
                  ) : sharedKeysStatus ? (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {sharedKeysStatus.available 
                          ? "Your environmental variables are set up correctly:" 
                          : "For global configuration, these values need to be set in your environmental variables and the application needs to be redeployed:"
                        }
                      </p>
                      
                      {/* API Key */}
                      <div className={`flex items-center gap-2 p-2 rounded-lg mt-3 ${
                        !sharedKeysStatus.missing.apiKey 
                          ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                      }`}>
                        {!sharedKeysStatus.missing.apiKey ? (
                          <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="size-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          !sharedKeysStatus.missing.apiKey 
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          OPENROUTER_API_KEY
                        </span>
                      </div>

                      {/* Model */}
                      <div className={`flex items-center gap-2 p-2 rounded-lg mt-2 ${
                        !sharedKeysStatus.missing.model 
                          ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                      }`}>
                        {!sharedKeysStatus.missing.model ? (
                          <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="size-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          !sharedKeysStatus.missing.model 
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          OPENROUTER_MODEL
                        </span>
                      </div>

                      {/* Max Tokens */}
                      <div className={`flex items-center gap-2 p-2 rounded-lg mt-2 ${
                        !sharedKeysStatus.missing.maxTokens 
                          ? "bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
                      }`}>
                        {!sharedKeysStatus.missing.maxTokens ? (
                          <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <XCircle className="size-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`text-sm font-medium ${
                          !sharedKeysStatus.missing.maxTokens 
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          OPENROUTER_MAX_TOKENS
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Unable to check configuration</p>
                  )}
                </div>
              )}
            </div>


          {/* Local Configuration Steps */}
          {configType === "local" && (
            <>
              {/* Step 2: Model Selection */}
              <div className="flex flex-col items-center">
                <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground mb-4">
                  {getCurrentStepNumber("model")}
                </div>
                <div className="w-px bg-border flex-1"></div>
              </div>
              <div className="pb-4">
                  <Label
                    htmlFor="model"
                    className="text-sm font-medium text-foreground"
                  >
                    AI Model
                  </Label>
                  <div className="relative mt-3">
                    <Input
                      id="model"
                      placeholder="Enter model slug (e.g. openai/gpt-4o-mini)"
                      value={localKeys.model}
                      onChange={(e) => setLocalKeys(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full pr-10 shadow-sm"
                    />
                  <Popover open={isModelDropdownOpen} onOpenChange={setIsModelDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-muted"
                        onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search models..." />
                        <CommandList>
                          <CommandEmpty>No models found.</CommandEmpty>
                          <CommandGroup heading="Popular Models">
                            {POPULAR_MODELS.map((model) => (
                              <CommandItem
                                key={model.slug}
                                value={model.name}
                                onSelect={() => {
                                  setLocalKeys(prev => ({ ...prev, model: model.slug }));
                                  setIsModelDropdownOpen(false);
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{model.name}</span>
                                  <span className="text-sm text-muted-foreground">{model.slug}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter any OpenRouter model slug or choose from popular options above.
                  </p>
                </div>

              {/* Step 3: API Key */}
              <div className="flex flex-col items-center">
                <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground mb-4">
                  {getCurrentStepNumber("apikey")}
                </div>
                <div className="w-px bg-border flex-1"></div>
              </div>
              <div className="pb-4">
                  <Label
                    htmlFor="api-key"
                    className="text-sm font-medium text-foreground"
                  >
                    OpenRouter API Key
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="sk-or-v1-..."
                    value={localKeys.apiKey}
                    onChange={(e) => setLocalKeys(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="shadow-sm mt-3"
                  />
                </div>

              {/* Step 4: Max Tokens */}
              <div className="flex flex-col items-center">
                <div className="inline-flex size-6 items-center justify-center rounded-sm bg-muted text-sm text-foreground mb-4">
                  {getCurrentStepNumber("settings")}
                </div>
              </div>
              <div className="pb-4">
                  <Label
                    htmlFor="max-tokens"
                    className="text-sm font-medium text-foreground"
                  >
                    Max Tokens
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Maximum number of tokens per response.
                  </p>
                  <Select value={localKeys.maxTokens} onValueChange={(value) => setLocalKeys(prev => ({ ...prev, maxTokens: value }))}>
                    <SelectTrigger id="max-tokens" className="w-full shadow-sm mt-3">
                    <SelectValue placeholder="Select max tokens" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2000">2,000 tokens</SelectItem>
                    <SelectItem value="4000">4,000 tokens</SelectItem>
                    <SelectItem value="8000">8,000 tokens</SelectItem>
                    <SelectItem value="16000">16,000 tokens</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          </div>
        </div>
        
        <div className="flex items-center justify-between border-t p-4">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            Save Changes
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

export function AISettingsDialog({ open, onOpenChange, onSave }: AISettingsDialogProps) {
  // Use the open state as key to remount component when dialog opens
  // This ensures fresh state from storage without useEffect
  if (!open) {
    return null;
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AISettingsDialogInner 
        key={open ? 'open' : 'closed'} 
        onSave={onSave} 
        onOpenChange={onOpenChange} 
      />
    </Dialog>
  );
}