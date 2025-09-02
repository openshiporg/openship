"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "./chat-container";
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
import { checkSharedKeysAvailable } from "@/features/dashboard/actions/ai-chat";
import { ModeSplitButton } from "./mode-split-button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import shared Message type and hook from DashboardLayout
import { useChatMode } from "../DashboardLayout";
import { useAiConfig, type AiConfig } from "../../hooks/use-ai-config";
import { useChatSubmission } from "../../hooks/use-chat-submission";
import { AIActivationDialog } from "./ai-activation-dialog";
import { AISettingsDialog } from "./ai-settings-dialog";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatUnactivatedState } from "./chat-unactivated-state";

// Message interface (defined in DashboardLayout)
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

// Shared Keys Modal
const SharedKeysModal = ({
  open,
  onOpenChange,
  sharedKeysStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharedKeysStatus: {
    available: boolean;
    missing: { apiKey: boolean; model: boolean; maxTokens: boolean };
  } | null;
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
              <h4 className="font-medium text-sm mb-2">Available Keys</h4>
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
  const [model, setModel] = useState(
    initialKeys?.model || "openai/gpt-4o-mini"
  );
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
                    <p>
                      You can get your OpenRouter API key at
                      https://openrouter.ai/settings/keys
                    </p>
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
              placeholder={
                showMaskedKey ? "••••••••••••••••••••••••••••••••" : "sk-or-..."
              }
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
                    <p>
                      You can get different model slugs from
                      https://openrouter.ai/models
                    </p>
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
            <Label htmlFor="maxTokens" className="block mb-2">
              Max Tokens
            </Label>
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
          <Button
            onClick={handleSave}
            disabled={!apiKey && !initialKeys?.apiKey}
            size="sm"
          >
            Save Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// This component is no longer used - replaced with ChatUnactivatedState

// Compact Chat Message for Floating Box
function ChatMessage({
  isUser,
  children,
}: {
  isUser?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`text-sm flex items-start gap-2 ${
        isUser ? "justify-end" : ""
      }`}
    >
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

export function FloatingChatBox({
  onClose,
  isVisible,
  onModeChange,
}: FloatingChatBoxProps) {
  const router = useRouter();
  const { messages, setMessages, loading, setLoading, sending, setSending, user } =
    useChatMode();
  const [input, setInput] = useState("");
  const { config: aiConfig, setConfig: setAiConfig } = useAiConfig();
  const { handleSubmit: submitChat } = useChatSubmission({
    messages,
    setMessages,
    setLoading,
    setSending,
  });
  const [selectedMode, setSelectedMode] = useState<
    "env" | "local" | "disabled"
  >("env");
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [sharedKeysStatus, setSharedKeysStatus] = useState<{
    available: boolean;
    missing: { apiKey: boolean; model: boolean; maxTokens: boolean };
  } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingSharedKeys, setIsLoadingSharedKeys] = useState(true);

  // Initialize selected mode based on AI config
  useEffect(() => {
    if (aiConfig.enabled) {
      setSelectedMode(aiConfig.keyMode);
    } else {
      setSelectedMode("disabled");
    }
    setIsInitializing(false);
  }, [aiConfig.enabled, aiConfig.keyMode]);

  // Check shared keys status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setIsLoadingSharedKeys(true);
        const status = await checkSharedKeysAvailable();
        setSharedKeysStatus(status);
      } catch (error) {
        console.error("Failed to check shared keys status:", error);
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

  // Handle activation completion
  const handleActivationComplete = () => {
    // Config will automatically update via the useAiConfig hook
    setSelectedMode(aiConfig.keyMode);
  };

  // Handle settings save
  const handleSettingsSave = () => {
    // Config will automatically update via the useAiConfig hook
    setSelectedMode(aiConfig.keyMode);
  };

  // Handle activation dialog open
  const handleActivationOpen = () => {
    setShowActivationDialog(true);
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
      const newConfig: Partial<AiConfig> = {
        enabled: false,
        onboarded: false,
        keyMode: "env",
        localKeys: undefined,
      };
      setAiConfig(newConfig);
    } else {
      const newConfig: Partial<AiConfig> = {
        enabled: true,
        onboarded: true,
        keyMode: mode,
        localKeys: aiConfig?.localKeys,
      };
      setAiConfig(newConfig);
    }
  };


  const handleSubmit = async () => {
    if (!input.trim()) return;
    const currentInput = input;
    setInput("");
    await submitChat(currentInput);
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

  const isAiChatReady =
    aiConfig.enabled && aiConfig.onboarded && selectedMode !== "disabled";

  return (
    <div className="fixed bottom-20 right-3 w-90 h-100 bg-sidebar border border-border rounded-lg shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium text-sm">AI Assistant</h3>
        <div className="flex items-center gap-1">
          <Select
            value="chatbox"
            onValueChange={(value) => {
              if (value === "sidebar") {
                onModeChange();
              }
            }}
          >
            <SelectPrimitive.Trigger className="h-6 w-6 p-0 border-0 bg-transparent hover:bg-accent rounded flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </SelectPrimitive.Trigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
              <SelectGroup>
                <SelectLabel className="text-[10px] text-muted-foreground uppercase font-medium pl-2">
                  Open assistant in
                </SelectLabel>
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
      {isAiChatReady ? (
        <ChatContainerRoot className="flex-1 pt-3 px-3 relative">
          <ChatContainerContent className="space-y-3">
            {messages.length === 0 ? (
              <ChatEmptyState userName={user?.name} variant="compact" />
            ) : (
              messages.map((message) => (
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
                                  <code className="font-mono">{children}</code>
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
              ))
            )}

            <ChatContainerScrollAnchor />
          </ChatContainerContent>

          {/* Scroll Button */}
          {messages.length > 0 && (
            <div className="absolute bottom-2 right-2">
              <ScrollButton />
            </div>
          )}
        </ChatContainerRoot>
      ) : null}

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
                disabled={sending || loading}
                onSettingsClick={() => {
                  setShowSettingsDialog(true);
                }}
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
        <div className="flex-1 flex items-center justify-center">
          <ChatUnactivatedState 
            userName={user?.name} 
            onActivate={handleActivationOpen}
            variant="compact"
          />
        </div>
      )}

      <AIActivationDialog
        open={showActivationDialog}
        onOpenChange={setShowActivationDialog}
        onComplete={handleActivationComplete}
      />

      <AISettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        onSave={handleSettingsSave}
      />

    </div>
  );
}
