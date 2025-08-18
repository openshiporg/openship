"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "./chat-container";
import { ScrollButton } from "./scroll-button";
import {
  ArrowUp,
  Info,
  X,
  MessageSquare,
  PanelRight,
  AlertCircle,
} from "lucide-react";

// UI Components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectValue,
} from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { getSharedKeys, checkSharedKeysAvailable } from "@/features/dashboard/actions/ai-chat";
import { ModeSplitButton } from "./mode-split-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import shared Message type and hook from DashboardLayout
import { useChatMode } from "../DashboardLayout";

// Message interface (defined in DashboardLayout)
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// AI Chat Configuration Types
interface AiChatConfig {
  enabled: boolean;
  onboarded: boolean;
  keyMode: "env" | "local";
  localKeys?: {
    apiKey: string;
    model: string;
    maxTokens: string;
  };
  chatMode?: "sidebar" | "chatbox";
}

// LocalStorage Manager
class AiChatStorage {
  static getConfig(): AiChatConfig {
    const enabled = localStorage.getItem("aiChatEnabled") === "true";
    const onboarded = localStorage.getItem("aiChatOnboarded") === "true";
    const keyMode =
      (localStorage.getItem("aiKeyMode") as "env" | "local") || "env";
    const chatMode =
      (localStorage.getItem("aiChatMode") as "sidebar" | "chatbox") || "chatbox";

    const localKeys =
      keyMode === "local"
        ? {
            apiKey: localStorage.getItem("openRouterApiKey") || "",
            model: localStorage.getItem("openRouterModel") || "openai/gpt-4o-mini",
            maxTokens: localStorage.getItem("openRouterMaxTokens") || "4000",
          }
        : undefined;

    return { enabled, onboarded, keyMode, localKeys, chatMode };
  }

  static saveConfig(config: Partial<AiChatConfig>) {
    if (config.enabled !== undefined) {
      localStorage.setItem("aiChatEnabled", config.enabled.toString());
    }
    if (config.onboarded !== undefined) {
      localStorage.setItem("aiChatOnboarded", config.onboarded.toString());
    }
    if (config.keyMode !== undefined) {
      localStorage.setItem("aiKeyMode", config.keyMode);
    }
    if (config.chatMode !== undefined) {
      localStorage.setItem("aiChatMode", config.chatMode);
    }
    if (config.localKeys) {
      localStorage.setItem("openRouterApiKey", config.localKeys.apiKey);
      localStorage.setItem("openRouterModel", config.localKeys.model);
      localStorage.setItem("openRouterMaxTokens", config.localKeys.maxTokens);
    }
  }
}

// Shared Keys Modal
const SharedKeysModal = ({
  open,
  onOpenChange,
  sharedKeysStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharedKeysStatus: {available: boolean; missing: {apiKey: boolean; model: boolean; maxTokens: boolean}} | null;
}) => {
  const setVars = [];
  const missingVars = [];

  if (sharedKeysStatus) {
    if (!sharedKeysStatus.missing.apiKey) {
      setVars.push({ name: "OPENROUTER_API_KEY", label: "Set" });
    } else {
      missingVars.push({ name: "OPENROUTER_API_KEY", label: "Missing" });
    }

    if (!sharedKeysStatus.missing.model) {
      setVars.push({ name: "OPENROUTER_MODEL", label: "Set" });
    } else {
      missingVars.push({ name: "OPENROUTER_MODEL", label: "Missing" });
    }

    if (!sharedKeysStatus.missing.maxTokens) {
      setVars.push({ name: "OPENROUTER_MAX_TOKENS", label: "Optional" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Shared API Keys</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            When using shared keys, the API keys are configured at the
            application level through environment variables.
          </p>
          
          {setVars.length > 0 && (
            <div className="bg-muted/40 rounded-lg p-3 border border-transparent ring-1 ring-foreground/10">
              <h4 className="font-medium text-sm mb-2">
                Available Keys
              </h4>
              <div className="space-y-1">
                {setVars.map((envVar) => (
                  <div key={envVar.name} className="flex items-center gap-2">
                    <code className="bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded text-xs font-mono">
                      {envVar.name}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missingVars.length > 0 && (
            <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/20">
              <h4 className="font-medium text-sm mb-2 text-destructive-foreground">
                Missing Keys
              </h4>
              <div className="space-y-1">
                {missingVars.map((envVar) => (
                  <div key={envVar.name} className="flex items-center gap-2">
                    <code className="bg-muted/40 text-muted-foreground px-1.5 py-0.5 rounded text-xs font-mono">
                      {envVar.name}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Set these environment variables when deploying your application to
            enable AI chat functionality.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} size="sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Local Keys Modal
const LocalKeysModal = ({
  open,
  onOpenChange,
  initialKeys,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialKeys?: {
    apiKey: string;
    model: string;
    maxTokens: string;
  };
  onSave: (keys: { apiKey: string; model: string; maxTokens: string }) => void;
}) => {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(initialKeys?.model || "openai/gpt-4o-mini");
  const [maxTokens, setMaxTokens] = useState(initialKeys?.maxTokens || "4000");
  const [showMaskedKey, setShowMaskedKey] = useState(false);

  // Set initial state when modal opens
  useEffect(() => {
    if (open) {
      if (initialKeys?.apiKey) {
        setApiKey(""); // Keep input empty
        setShowMaskedKey(true); // Show masked placeholder
      } else {
        setApiKey("");
        setShowMaskedKey(false);
      }
      setModel(initialKeys?.model || "openai/gpt-4o-mini");
      setMaxTokens(initialKeys?.maxTokens || "4000");
    }
  }, [open, initialKeys]);

  const handleSave = () => {
    // If no new API key was entered and we had an initial key, keep the initial key
    const finalApiKey = apiKey || initialKeys?.apiKey || "";
    onSave({ apiKey: finalApiKey, model, maxTokens });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Configure API Keys</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="apiKey">OpenRouter API Key</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You can get your OpenRouter API key at https://openrouter.ai/settings/keys</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (e.target.value) {
                  setShowMaskedKey(false); // Hide masked placeholder when user types
                }
              }}
              placeholder={showMaskedKey ? "••••••••••••••••••••••••••••••••" : "sk-or-..."}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="model">Model</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 text-muted-foreground hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>You can get different model slugs from https://openrouter.ai/models</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="model"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="openai/gpt-4o-mini"
            />
          </div>
          <div>
            <Label htmlFor="maxTokens" className="block mb-2">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              placeholder="4000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="sm"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey && !initialKeys?.apiKey} size="sm">
            Save Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Mini Onboarding Component for Floating Box
function MiniOnboarding({ onComplete }: { onComplete: () => void }) {
  const [confirmationText, setConfirmationText] = useState("");

  const handleSubmit = () => {
    if (confirmationText !== "I understand the risks") return;
    onComplete();
  };

  const canSubmit = () => {
    return confirmationText === "I understand the risks";
  };

  return (
    <div className="p-3 space-y-3 bg-muted/40 border border-muted rounded-lg m-2">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Setup AI Assistant</h3>
        <p className="text-xs text-muted-foreground">
          AI can create, update, and delete your data. Backup your database regularly.
        </p>
      </div>

      <div className="border border-destructive/50 bg-destructive/5 rounded-lg p-2">

        <p className="flex items-center gap-2 text-xs text-destructive-foreground">
                            <AlertCircle className="size-4"/>

          Use with caution - can modify everything you can
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mini-confirmation" className="text-xs">
          Type "I understand the risks"
        </Label>
        <Input
          id="mini-confirmation"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder="I understand the risks"
          className="mt-2 text-base"
        />
      </div>

      <Button
        onClick={handleSubmit}
        variant="destructive"
        className="w-full text-xs h-7"
        disabled={!canSubmit()}
      >
        Enable AI Chat
      </Button>
    </div>
  );
}

// Compact Chat Message for Floating Box
function ChatMessage({
  isUser,
  children,
}: {
  isUser?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`text-sm flex items-start gap-2 ${isUser ? "justify-end" : ""}`}>
      <div
        className={cn(
          "max-w-[80%] break-words overflow-hidden",
          isUser 
            ? "bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-tr-sm" 
            : "bg-muted px-3 py-2 rounded-2xl rounded-tl-sm"
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface FloatingChatBoxProps {
  onClose: () => void;
  isVisible: boolean;
  onModeChange: () => void;
}

export function FloatingChatBox({ onClose, isVisible, onModeChange }: FloatingChatBoxProps) {
  const router = useRouter();
  const { messages, setMessages, loading, setLoading, sending, setSending } = useChatMode();
  const [input, setInput] = useState("");
  const [aiConfig, setAiConfig] = useState<AiChatConfig | null>(null);
  const [selectedMode, setSelectedMode] = useState<"env" | "local" | "disabled">("env");
  const [showLocalKeysModal, setShowLocalKeysModal] = useState(false);
  const [showSharedKeysModal, setShowSharedKeysModal] = useState(false);
  const [sharedKeysStatus, setSharedKeysStatus] = useState<{available: boolean; missing: {apiKey: boolean; model: boolean; maxTokens: boolean}} | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingSharedKeys, setIsLoadingSharedKeys] = useState(true);

  // Load AI config on component mount
  useEffect(() => {
    const config = AiChatStorage.getConfig();
    setAiConfig(config);
    if (config.enabled) {
      setSelectedMode(config.keyMode);
    } else {
      setSelectedMode("disabled");
    }
    setIsInitializing(false);
  }, []);

  // Check shared keys status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsLoadingSharedKeys(true);
        const status = await checkSharedKeysAvailable();
        setSharedKeysStatus(status);
      } catch (error) {
        console.error('Failed to check shared keys status:', error);
      } finally {
        setIsLoadingSharedKeys(false);
      }
    };
    checkStatus();
  }, []);

  // Helper function to check if local keys are properly configured
  const isLocalKeysConfigured = () => {
    return !!(aiConfig?.localKeys?.apiKey && aiConfig?.localKeys?.model);
  };

  // Helper function to check if shared keys are properly configured
  const isSharedKeysConfigured = () => {
    return sharedKeysStatus?.available || false;
  };

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    const newConfig: AiChatConfig = {
      enabled: true,
      onboarded: true,
      keyMode: isSharedKeysConfigured() ? "env" : "local",
      localKeys: undefined,
    };

    AiChatStorage.saveConfig(newConfig);
    setAiConfig(newConfig);
    setSelectedMode(newConfig.keyMode);
  };

  // Get settings button status color
  const getSettingsButtonStatus = () => {
    if (selectedMode === "local") {
      return isLocalKeysConfigured() ? "indigo" : "red";
    } else if (selectedMode === "env") {
      if (isLoadingSharedKeys) {
        return "indigo"; // Show neutral while loading
      }
      return isSharedKeysConfigured() ? "indigo" : "red";
    }
    return "indigo";
  };

  // Handle mode change
  const handleModeChange = (mode: "env" | "local" | "disabled") => {
    setSelectedMode(mode);

    if (mode === "disabled") {
      const newConfig: AiChatConfig = {
        enabled: false,
        onboarded: false,
        keyMode: "env",
        localKeys: undefined,
      };
      AiChatStorage.saveConfig(newConfig);
      setAiConfig(newConfig);
    } else {
      const newConfig: AiChatConfig = {
        enabled: true,
        onboarded: true,
        keyMode: mode,
        localKeys: aiConfig?.localKeys,
      };
      AiChatStorage.saveConfig(newConfig);
      setAiConfig(newConfig);
    }
  };

  // Handle local keys save
  const handleLocalKeysSave = (keys: {
    apiKey: string;
    model: string;
    maxTokens: string;
  }) => {
    const newConfig: AiChatConfig = {
      enabled: true,
      onboarded: true,
      keyMode: "local",
      localKeys: keys,
    };

    AiChatStorage.saveConfig(newConfig);
    setAiConfig(newConfig);
  };

  const handleSubmit = async () => {
    if (!input.trim() || !aiConfig?.enabled) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setSending(true);

    try {
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content,
      }));

      let res: Response;

      if (aiConfig?.keyMode === "local") {
        if (!aiConfig.localKeys?.apiKey || !aiConfig.localKeys?.model) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "Error: Local API key and model are required. Please configure them in settings.",
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }

        res = await fetch("/api/completion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: currentInput,
            messages: conversationHistory,
            useLocalKeys: true,
            apiKey: aiConfig.localKeys.apiKey,
            model: aiConfig.localKeys.model,
            maxTokens: parseInt(aiConfig.localKeys.maxTokens),
          }),
          credentials: "include",
        });
      } else {
        try {
          const keysResult = await getSharedKeys();
          if (!keysResult.success) {
            const errorMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `Error: ${keysResult.error}`,
              isUser: false,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
            return;
          }

          res = await fetch("/api/completion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: currentInput,
              messages: conversationHistory,
              useLocalKeys: true,
              apiKey: keysResult.keys!.apiKey,
              model: keysResult.keys!.model,
              maxTokens: keysResult.keys!.maxTokens,
            }),
            credentials: "include",
          });
        } catch (error) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
          return;
        }
      }

      setSending(false);
      setLoading(true);

      if (!res.ok) {
        let errorMessage = "Unknown error";
        try {
          const error = await res.json();
          errorMessage = error.error || error.details || "Unknown error";
        } catch {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: `Error: ${errorMessage}`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      let fullResponse = "";
      const decoder = new TextDecoder();
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("0:")) {
            const text = line.slice(2);
            if (text.startsWith('"') && text.endsWith('"')) {
              fullResponse += JSON.parse(text);
            }
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            );
          } else if (line.startsWith("9:")) {
            try {
              const dataInfo = JSON.parse(line.slice(2));
              if (dataInfo.dataHasChanged) {
                router.refresh();
              }
            } catch (error) {
              console.error('Failed to parse data change notification:', error);
            }
          }
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (isInitializing || !isVisible) {
    return null;
  }

  const isAiChatReady = aiConfig?.enabled && aiConfig?.onboarded && selectedMode !== "disabled";

  return (
    <div className="fixed bottom-20 right-3 w-80 h-96 bg-zinc-50 dark:bg-zinc-950 border border-border rounded-lg shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <h3 className="font-medium text-sm">AI Assistant</h3>
        <div className="flex items-center gap-1">
          <Select value="chatbox" onValueChange={(value) => {
            if (value === "sidebar") {
              onModeChange();
            }
          }}>
            <SelectPrimitive.Trigger className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-accent rounded flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </SelectPrimitive.Trigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
              <SelectGroup>
                <SelectLabel className="text-[10px] text-muted-foreground uppercase font-medium pl-2">Open assistant in</SelectLabel>
                <SelectItem value="chatbox">
                  <MessageSquare className="size-3 opacity-60" />
                  <span className="truncate">Chat bubble</span>
                </SelectItem>
                <SelectItem value="sidebar">
                  <PanelRight className="size-3 opacity-60" />
                  <span className="truncate">Sidebar</span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ChatContainerRoot className="flex-1 pt-3 px-3 relative !overflow-y-hidden">
        <ChatContainerContent className="space-y-3 !overflow-y-auto !h-full">
          {messages.map((message) => (
            <ChatMessage key={message.id} isUser={message.isUser}>
              {message.isUser ? (
                <p className="whitespace-pre-wrap break-words text-sm">
                  {message.content}
                </p>
              ) : (
                <>
                  {message.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        p: ({ children }) => (
                          <div className="mb-1 last:mb-0 break-words text-sm">
                            {children}
                          </div>
                        ),
                        code: ({ children, ...props }) => {
                          if ((props as any).inline) {
                            return (
                              <code className="bg-muted px-1 rounded font-mono text-xs">
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className="bg-muted border rounded p-2 overflow-x-auto text-xs">
                              <code className="font-mono">
                                {children}
                              </code>
                            </pre>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  )}
                </>
              )}
            </ChatMessage>
          ))}
          
          <ChatContainerScrollAnchor />
        </ChatContainerContent>
        
        {/* Scroll Button */}
        {messages.length > 0 && (
          <div className="absolute bottom-2 right-2">
            <ScrollButton />
          </div>
        )}
      </ChatContainerRoot>

      {/* Input Area or Mini Onboarding */}
      {isAiChatReady ? (
        <div className="shadow bg-background border border-transparent ring-1 ring-foreground/10 m-3 space-y-3 rounded-lg p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="w-full text-sm bg-transparent border-0 resize-none focus:outline-none placeholder:text-muted-foreground min-h-[32px] break-words"
            disabled={sending || loading}
            rows={1}
          />

          <div className="flex justify-between">
            <div className="flex gap-2">
              <ModeSplitButton
                value={selectedMode}
                onValueChange={handleModeChange}
                disabled={sending || loading}
                onSettingsClick={() => {
                  if (selectedMode === "local") {
                    setShowLocalKeysModal(true);
                  } else if (selectedMode === "env") {
                    setShowSharedKeysModal(true);
                  }
                }}
                settingsButtonStatus={getSettingsButtonStatus()}
              />
            </div>

            <Button
              size="icon"
              className="size-7 rounded-2xl bg-foreground text-background hover:bg-foreground/90"
              onClick={handleSubmit}
              disabled={sending || loading || !input.trim()}
            >
              <ArrowUp className="h-4 w-4" strokeWidth={3} />
            </Button>
          </div>
        </div>
      ) : (
        <MiniOnboarding onComplete={handleOnboardingComplete} />
      )}

      <LocalKeysModal
        open={showLocalKeysModal}
        onOpenChange={setShowLocalKeysModal}
        initialKeys={aiConfig?.localKeys}
        onSave={handleLocalKeysSave}
      />

      <SharedKeysModal
        open={showSharedKeysModal}
        onOpenChange={setShowSharedKeysModal}
        sharedKeysStatus={sharedKeysStatus}
      />
    </div>
  );
}