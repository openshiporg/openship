"use client";

import { useState, useEffect } from "react";
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
  RefreshCcwIcon,
  ArrowUp,
  Info,
  X,
  MessageSquare,
  PanelRight,
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
import { useSidebarWithSide } from "@/components/ui/sidebar";
import { useChatMode } from "../DashboardLayout";
import { useAiConfig } from "../../hooks/use-ai-config";
import { useChatSubmission } from "../../hooks/use-chat-submission";
import { AIActivationDialog } from "./ai-activation-dialog";
import { AISettingsDialog } from "./ai-settings-dialog";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatUnactivatedState } from "./chat-unactivated-state";
import { RiRobot2Fill, RiRobot2Line } from "@remixicon/react";


// Chat mode types
type ChatMode = "sidebar" | "chatbox";

// Types
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}



// Compact Chat Message for Sidebar
function ChatMessage({
  isUser,
  children,
}: {
  isUser?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`text-base flex items-center gap-2 ${
        isUser ? "justify-end" : ""
      }`}
    >
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
          isUser
            ? "bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md"
            : "space-y-1"
        )}
      >
        {children}
      </div>
    </div>
  );
}

// This component is no longer used - replaced with ChatUnactivatedState

// Main Sidebar Chat Component
export function AiChatSidebar() {
  const { toggleSidebar } = useSidebarWithSide("right");
  const { setChatMode, messages, setMessages, loading, setLoading, sending, setSending, user } = useChatMode();
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

  // Remove the old useStickToBottom hook - now handled by PromptKit components

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

  // Handle mode change
  const handleModeChange = (mode: "env" | "local" | "disabled") => {
    setSelectedMode(mode);

    if (mode === "disabled") {
      setAiConfig({
        enabled: false,
        onboarded: false,
        keyMode: "env",
        localKeys: undefined,
      });
    } else {
      setAiConfig({
        enabled: true,
        onboarded: true,
        keyMode: mode,
        localKeys: aiConfig.localKeys,
      });
    }
  };


  // Re-check shared keys status when needed
  const recheckSharedKeysStatus = async () => {
    try {
      setIsLoadingSharedKeys(true);
      const status = await checkSharedKeysAvailable();
      setSharedKeysStatus(status);
    } catch (error) {
      console.error("Failed to recheck shared keys status:", error);
    } finally {
      setIsLoadingSharedKeys(false);
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

  const isAiChatReady =
    aiConfig.enabled && aiConfig.onboarded && selectedMode !== "disabled";

  // Don't render anything while initializing to prevent flash
  if (isInitializing) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
        <h3 className="font-medium text-muted-foreground">AI Assistant</h3>
        <div className="flex items-center gap-1">
          <Select value="sidebar" onValueChange={(value) => {
            if (value === "chatbox") {
              setChatMode("chatbox");
            }
          }}>
            <SelectPrimitive.Trigger className="h-8 w-8 p-0 border-0 bg-transparent hover:bg-accent rounded flex items-center justify-center">
              <PanelRight className="h-4 w-4" />
            </SelectPrimitive.Trigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2">
              <SelectGroup>
                <SelectLabel className="text-[10px] text-muted-foreground uppercase font-medium pl-2">Open assistant in</SelectLabel>
                <SelectItem value="chatbox">
                  <MessageSquare className="size-4 opacity-60" />
                  <span className="truncate">Chat bubble</span>
                </SelectItem>
                <SelectItem value="sidebar">
                  <PanelRight className="size-4 opacity-60" />
                  <span className="truncate">Sidebar</span>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
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
              <ChatEmptyState userName={user?.name} />
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
      ) : null}

      {/* Input Area or Onboarding */}
      {isAiChatReady ? (
        <div className="shadow bg-background border border-transparent ring-1 ring-foreground/10 mx-3 mb-3 space-y-3 rounded-lg p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="w-full text-base bg-transparent border-0 resize-none focus:outline-none placeholder:text-muted-foreground min-h-[40px] break-words"
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
              <ArrowUp strokeWidth={3} />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <ChatUnactivatedState 
            userName={user?.name} 
            onActivate={handleActivationOpen} 
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
