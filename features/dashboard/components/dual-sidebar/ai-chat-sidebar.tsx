"use client";

import { useState } from "react";
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
  X,
} from "lucide-react";

// UI Components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeSplitButton } from "./mode-split-button";
import { useSidebarWithSide } from "@/components/ui/sidebar";
import { useChatMode } from "../DashboardLayout";
import { useAiConfig } from "../../hooks/use-ai-config";
import { useChatSubmission } from "../../hooks/use-chat-submission";
import { ChatEmptyState } from "./chat-empty-state";


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
  const { messages, setMessages, loading, setLoading, sending, setSending, user } = useChatMode();
  const [input, setInput] = useState("");
  const { config: aiConfig, setConfig: setAiConfig } = useAiConfig();
  const { handleSubmit: submitChat } = useChatSubmission({
    messages,
    setMessages,
    setLoading,
    setSending,
  });


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


  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
        <h3 className="font-medium text-muted-foreground">AI Assistant</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
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

      {/* Input Area */}
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
              />
            </div>

            <Button
              size="icon"
              className="size-8 rounded-2xl bg-foreground text-background hover:bg-foreground/90"
              onClick={handleSubmit}
              disabled={sending || loading || !input.trim()}
            >
              <ArrowUp strokeWidth={3} />
            </Button>
          </div>
        </div>
    </div>
  );
}
