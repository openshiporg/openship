"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useAiConfig } from "./use-ai-config"
import { PUBLIC_REQUEST_ERROR } from "../lib/security"
import { readCompletionEvents } from "../lib/completionStream"

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

interface UseChatSubmissionProps {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setLoading: (loading: boolean) => void
  setSending: (sending: boolean) => void
}

export function useChatSubmission({
  messages,
  setMessages,
  setLoading,
  setSending,
}: UseChatSubmissionProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { config: aiConfig } = useAiConfig()

  const handleSubmit = async (input: string) => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setSending(true)

    try {
      const conversationHistory = [...messages, userMessage].map((msg) => ({
        role: msg.isUser ? "user" : "assistant",
        content: msg.content,
      }))

      let res: Response

      if (aiConfig.keyMode === "local") {
        // Local keys mode - validate keys are provided
        if (!aiConfig.localKeys?.apiKey || !aiConfig.localKeys?.model) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content:
              "Error: Local API key and model are required. Please configure them in settings.",
            isUser: false,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errorMessage])
          return
        }

        // Call completion route directly with local keys
        res = await fetch("/api/completion", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: input,
            messages: conversationHistory,
            useLocalKeys: true,
            apiKey: aiConfig.localKeys.apiKey,
            model: aiConfig.localKeys.model,
            maxTokens: parseInt(aiConfig.localKeys.maxTokens),
          }),
          credentials: "include",
        })
      } else {
        // Shared credentials are resolved only on the authenticated server route.
        res = await fetch("/api/completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: input, messages: conversationHistory, useLocalKeys: false }),
          credentials: "include",
        })
      }

      setSending(false)
      setLoading(true)

      if (!res.ok) {
        const errorMessage = PUBLIC_REQUEST_ERROR

        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          content: `Error: ${errorMessage}`,
          isUser: false,
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, errorMsg])
        setLoading(false)
        return
      }

      if (!res.body) return

      let fullResponse = ""
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      for await (const event of readCompletionEvents(res.body)) {
        if (event.type === "text") {
          fullResponse += event.text
          setMessages((prev) => prev.map((msg) =>
            msg.id === aiMessage.id ? { ...msg, content: fullResponse } : msg
          ))
        } else if (event.type === "changed") {
          queryClient.invalidateQueries()
        } else {
          setMessages((prev) => prev.map((msg) =>
            msg.id === aiMessage.id ? { ...msg, content: PUBLIC_REQUEST_ERROR } : msg
          ))
          return
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: PUBLIC_REQUEST_ERROR,
        isUser: false,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
      setLoading(false)
    }
  }

  return { handleSubmit }
}