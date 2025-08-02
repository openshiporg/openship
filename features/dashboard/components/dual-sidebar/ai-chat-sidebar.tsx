"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { ChatContainerRoot, ChatContainerContent, ChatContainerScrollAnchor } from "./chat-container";
import { ScrollButton } from "./scroll-button";
import {
  RefreshCcwIcon,
  ArrowUp,
  Info,
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
import { getSharedKeys, checkSharedKeysAvailable } from "@/features/dashboard/actions/ai-chat";
import { ModeSplitButton } from "./mode-split-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Types
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
}

// LocalStorage Manager
class AiChatStorage {
  static getConfig(): AiChatConfig {
    const enabled = localStorage.getItem("aiChatEnabled") === "true";
    const onboarded = localStorage.getItem("aiChatOnboarded") === "true";
    const keyMode =
      (localStorage.getItem("aiKeyMode") as "env" | "local") || "env";

    const localKeys =
      keyMode === "local"
        ? {
            apiKey: localStorage.getItem("openRouterApiKey") || "",
            model: localStorage.getItem("openRouterModel") || "openai/gpt-4o-mini",
            maxTokens: localStorage.getItem("openRouterMaxTokens") || "4000",
          }
        : undefined;

    return { enabled, onboarded, keyMode, localKeys };
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

// Compact Chat Message for Sidebar
function ChatMessage({
  isUser,
  children,
}: {
  isUser?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`text-sm flex items-center gap-2 ${isUser ? "justify-end" : ""}`}>
      {/* {isUser ? (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-indigo-600 shadow-sm order-1 flex-shrink-0" />
      ) : (
        <img
          className="rounded-full border border-black/[0.08] shadow-sm flex-shrink-0"
          src="https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp2/user-01_i5l7tp.png"
          alt="AI"
          width={24}
          height={24}
        />
      )} */}
      <div
        className={cn(
          "max-w-[calc(100%-2rem)] break-words overflow-hidden",
          isUser ? "bg-black dark:bg-white text-white dark:text-black px-3 py-1 rounded-md" : "space-y-1"
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Onboarding Component for Sidebar
function SidebarOnboarding({ onComplete }: { onComplete: () => void }) {
  const [confirmationText, setConfirmationText] = useState("");

  const handleSubmit = () => {
    if (confirmationText !== "I understand the risks") return;
    onComplete();
  };

  const canSubmit = () => {
    return confirmationText === "I understand the risks";
  };

  return (
    <div className="shadow bg-background border border-transparent ring-1 ring-foreground/10 m-3 space-y-3 rounded-lg p-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Configure your AI assistant</h3>
        </div>
        <p className="text-muted-foreground text-xs">
          Welcome to your AI assistant. You can use this assistant to interact
          with your data, create new items, delete items, update items.
        </p>
      </div>

      {/* Warning Card */}
      <div className="border border-destructive/50 bg-destructive/5 rounded-lg p-2 shadow">
        <div className="space-y-1">
          <h4 className="font-medium text-sm text-destructive-foreground">
            Be very careful when using this AI assistant
          </h4>
          <p className="text-xs text-destructive-foreground/90">
            It can do everything you can do since it uses the same session. We
            highly recommend you back up your database daily if you're using the
            AI assistant.
          </p>
        </div>
      </div>

      {/* Confirmation Input */}
      <div className="space-y-2">
        <Label
          htmlFor="confirmation"
          className="text-sm font-medium text-muted-foreground"
        >
          Type "I understand the risks" to continue:
        </Label>
        <Input
          id="confirmation"
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          placeholder="I understand the risks"
          className="text-sm mt-1"
        />
      </div>

      <Button
        onClick={handleSubmit}
        variant="destructive"
        className="w-full text-sm h-8"
        disabled={!canSubmit()}
      >
        Enable AI Chat
      </Button>
    </div>
  );
}

// Main Sidebar Chat Component
export function AiChatSidebar() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [aiConfig, setAiConfig] = useState<AiChatConfig | null>(null);
  const [selectedMode, setSelectedMode] = useState<
    "env" | "local" | "disabled"
  >("env");
  const [showLocalKeysModal, setShowLocalKeysModal] = useState(false);
  const [showSharedKeysModal, setShowSharedKeysModal] = useState(false);
  const [sharedKeysStatus, setSharedKeysStatus] = useState<{available: boolean; missing: {apiKey: boolean; model: boolean; maxTokens: boolean}} | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Remove the old useStickToBottom hook - now handled by PromptKit components

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
        const status = await checkSharedKeysAvailable();
        setSharedKeysStatus(status);
      } catch (error) {
        console.error('Failed to check shared keys status:', error);
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

  // Get settings button status color
  const getSettingsButtonStatus = () => {
    if (selectedMode === "local") {
      return isLocalKeysConfigured() ? "indigo" : "red";
    } else if (selectedMode === "env") {
      return isSharedKeysConfigured() ? "indigo" : "red";
    }
    return "indigo";
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

  // Re-check shared keys status when needed
  const recheckSharedKeysStatus = async () => {
    try {
      const status = await checkSharedKeysAvailable();
      setSharedKeysStatus(status);
    } catch (error) {
      console.error('Failed to recheck shared keys status:', error);
    }
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
        // Local keys mode - validate keys are provided
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

        // Call completion route directly with local keys
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
        // Shared keys mode - get keys from server action then call completion route
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
          console.log('STREAM LINE DEBUG:', line);
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
            // Handle data change notification
            try {
              const dataInfo = JSON.parse(line.slice(2));
              if (dataInfo.dataHasChanged) {
                console.log('Data has changed, refreshing page');
                router.refresh();
              }
            } catch (error) {
              console.error('Failed to parse data change notification:', error);
            }
          } else if (line.startsWith("3:")) {
            // Error in stream - replace the thinking message with error
            console.log('ERROR STREAM LINE DETECTED:', line);
            try {
              const errorText = line.slice(2);
              console.log('ERROR TEXT TO PARSE:', errorText);
              const errorData = JSON.parse(errorText);
              console.log('PARSED ERROR DATA:', errorData);
              const finalErrorMsg = `Error: ${
                typeof errorData === 'string' 
                  ? errorData 
                  : errorData.error || errorData.message || "Streaming error occurred"
              }`;
              console.log('FINAL ERROR MESSAGE TO SHOW:', finalErrorMsg);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessage.id
                    ? { ...msg, content: finalErrorMsg }
                    : msg
                )
              );
              setLoading(false);
              return;
            } catch (parseError) {
              // Failed to parse error JSON, but still show the raw error text
              const errorText = line.slice(2);
              console.log('PARSE ERROR OCCURRED:', parseError);
              console.log('RAW ERROR TEXT FROM STREAM:', errorText);
              const fallbackMsg = `Error: ${errorText || "Streaming error occurred. Please check that your API key and model are correct."}`;
              console.log('FALLBACK ERROR MESSAGE TO SHOW:', fallbackMsg);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessage.id
                    ? { ...msg, content: fallbackMsg }
                    : msg
                )
              );
              setLoading(false);
              return;
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

  const isAiChatReady =
    aiConfig?.enabled && aiConfig?.onboarded && selectedMode !== "disabled";

  // Don't render anything while initializing to prevent flash
  if (isInitializing) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <h3 className="font-medium text-muted-foreground">AI Assistant</h3>
      </div>

      {/* Messages */}
      <ChatContainerRoot className="flex-1 pt-3 px-3 relative">
        <ChatContainerContent className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 border flex items-center justify-center mx-auto mb-2">
              <RefreshCcwIcon className="w-4 h-4" />
            </div>
            <p className="text-muted-foreground">Start a conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} isUser={message.isUser}>
              {message.isUser ? (
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              ) : (
                <>
                  {message.content ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        p: ({ children }) => (
                          <div className="mb-1 last:mb-0 break-words">
                            {children}
                          </div>
                        ),
                        ul: ({ children }) => (
                          <ul className="mb-1 last:mb-0 pl-2">{children}</ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="mb-1 last:mb-0 pl-2">{children}</ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-0.5">{children}</li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold">{children}</strong>
                        ),
                        code: ({ children, ...props }) => {
                          if ((props as any).inline) {
                            return (
                              <code className="bg-muted px-1 rounded font-mono break-all">
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className="bg-muted border rounded p-2 overflow-x-auto">
                              <code className="font-mono break-all">
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        pre: ({ children }) => (
                          <div className="mb-1 last:mb-0">{children}</div>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  )}
                </>
              )}
            </ChatMessage>
          ))
        )}
        
        <ChatContainerScrollAnchor />
        </ChatContainerContent>
        
        {/* PromptKit Scroll Button */}
        {messages.length > 0 && (
          <div className="absolute bottom-4 right-4">
            <ScrollButton />
          </div>
        )}
      </ChatContainerRoot>

      {/* Input Area or Onboarding */}
      {isAiChatReady ? (
        <div className="shadow bg-background border border-transparent ring-1 ring-foreground/10 mx-3 mb-3 space-y-3 rounded-lg p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI Assistant"
            className="w-full text-sm bg-transparent border-0 resize-none focus:outline-none placeholder:text-muted-foreground min-h-[40px] break-words"
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
              <ArrowUp strokeWidth={3} />
            </Button>
          </div>
        </div>
      ) : (
          <SidebarOnboarding onComplete={handleOnboardingComplete} />
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
