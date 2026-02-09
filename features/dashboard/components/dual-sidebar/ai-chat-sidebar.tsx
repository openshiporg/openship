"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChat, type UIMessage } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import {
  ChatContainerRoot,
  ChatContainerContent,
  ChatContainerScrollAnchor,
} from "./chat-container";
import { ScrollButton } from "./scroll-button";
import { ArrowUp, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ModeSplitButton } from "./mode-split-button";
import { useSidebarWithSide } from "@/components/ui/sidebar";
import { useChatMode } from "../DashboardLayout";
import { useAiConfig } from "../../hooks/use-ai-config";
import { ChatEmptyState } from "./chat-empty-state";
import { getSharedKeys } from "../../actions/ai-chat";

function ChatMessage({
  isUser,
  children,
}: {
  isUser?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`text-base flex items-center gap-2 ${isUser ? "justify-end" : ""}`}>
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

const CRUD_TOOLS = new Set(["createData", "updateData", "deleteData"]);

function getMessageText(message: UIMessage) {
  return message.parts
    ?.filter((part: any) => part.type === "text")
    .map((part: any) => part.text)
    .join("")
    .trim();
}

function responseHasCrudTool(messages: UIMessage[]) {
  return messages.some((message: any) =>
    message.role === "assistant" &&
    message.parts?.some((part: any) => {
      if (part.type === "dynamic-tool") {
        return CRUD_TOOLS.has(part.toolName);
      }
      if (typeof part.type === "string" && part.type.startsWith("tool-")) {
        return CRUD_TOOLS.has(part.type.slice(5));
      }
      if (part.type === "tool-invocation" && part.toolInvocation?.toolName) {
        return CRUD_TOOLS.has(part.toolInvocation.toolName);
      }
      return false;
    })
  );
}

export function AiChatSidebar() {
  const { toggleSidebar } = useSidebarWithSide("right");
  const { user } = useChatMode();
  const { config: aiConfig } = useAiConfig();
  const queryClient = useQueryClient();

  const [input, setInput] = useState("");

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/completion",
      credentials: "include",
    }),
    onFinish: ({ messages }) => {
      if (responseHasCrudTool(messages as UIMessage[])) {
        queryClient.invalidateQueries();
      }
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    try {
      if (aiConfig.keyMode === "local") {
        if (!aiConfig.localKeys?.apiKey || !aiConfig.localKeys?.model) {
          throw new Error("Local API key and model are required. Please configure them in settings.");
        }

        await sendMessage(
          { text },
          {
            body: {
              useLocalKeys: true,
              apiKey: aiConfig.localKeys.apiKey,
              model: aiConfig.localKeys.model,
              maxTokens: parseInt(aiConfig.localKeys.maxTokens || "4000", 10),
            },
          }
        );

        return;
      }

      const keysResult = await getSharedKeys();
      if (!keysResult.success || !keysResult.keys) {
        throw new Error(keysResult.error || "Shared API keys are not configured.");
      }

      await sendMessage(
        { text },
        {
          body: {
            useLocalKeys: true,
            apiKey: keysResult.keys.apiKey,
            model: keysResult.keys.model,
            maxTokens: keysResult.keys.maxTokens,
          },
        }
      );
    } catch (submitError) {
      setInput(text);
      console.error("Chat submit error:", submitError);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
        <h3 className="font-medium text-muted-foreground">AI Assistant</h3>
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ChatContainerRoot className="flex-1 pt-3 px-3 relative">
        <ChatContainerContent className="space-y-3">
          {messages.length === 0 ? (
            <ChatEmptyState userName={user?.name} />
          ) : (
            messages.map((message) => {
              const text = getMessageText(message as UIMessage);
              const isUser = message.role === "user";

              return (
                <ChatMessage key={message.id} isUser={isUser}>
                  {isUser ? (
                    <p className="whitespace-pre-wrap break-words">{text}</p>
                  ) : text ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks]}
                      components={{
                        p: ({ children }) => <div className="mb-1 last:mb-0 break-words">{children}</div>,
                        ul: ({ children }) => <ul className="mb-1 last:mb-0 pl-2">{children}</ul>,
                        ol: ({ children }) => <ol className="mb-1 last:mb-0 pl-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-0.5">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        code: ({ children, ...props }) =>
                          (props as any).inline ? (
                            <code className="bg-muted px-1 rounded font-mono break-all">{children}</code>
                          ) : (
                            <pre className="bg-muted border rounded p-2 overflow-x-auto">
                              <code className="font-mono break-all">{children}</code>
                            </pre>
                          ),
                        pre: ({ children }) => <div className="mb-1 last:mb-0">{children}</div>,
                      }}
                    >
                      {text}
                    </ReactMarkdown>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  )}
                </ChatMessage>
              );
            })
          )}

          {error && (
            <div className="text-sm text-destructive px-1">Error: {error.message}</div>
          )}

          <ChatContainerScrollAnchor />
        </ChatContainerContent>

        {messages.length > 0 && (
          <div className="absolute bottom-4 right-4">
            <ScrollButton />
          </div>
        )}
      </ChatContainerRoot>

      <div className="shadow bg-background border border-transparent ring-1 ring-foreground/10 mx-3 mb-3 space-y-3 rounded-lg p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          className="w-full text-base bg-transparent border-0 resize-none focus:outline-none placeholder:text-muted-foreground min-h-[40px] break-words"
          disabled={isLoading}
          rows={1}
        />

        <div className="flex justify-between">
          <div className="flex gap-2">
            <ModeSplitButton disabled={isLoading} />
          </div>

          <Button
            size="icon"
            className="size-8 rounded-2xl bg-foreground text-background hover:bg-foreground/90"
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
          >
            <ArrowUp strokeWidth={3} />
          </Button>
        </div>
      </div>
    </div>
  );
}
