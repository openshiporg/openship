"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { useAiConfig } from "./use-ai-config"
import { getSharedKeys } from "../actions/ai-chat"

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
        // Shared keys mode - get keys from server action then call completion route
        try {
          const keysResult = await getSharedKeys()
          if (!keysResult.success) {
            const errorMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: `Error: ${keysResult.error}`,
              isUser: false,
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
            return
          }

          res = await fetch("/api/completion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: input,
              messages: conversationHistory,
              useLocalKeys: true,
              apiKey: keysResult.keys!.apiKey,
              model: keysResult.keys!.model,
              maxTokens: keysResult.keys!.maxTokens,
            }),
            credentials: "include",
          })
        } catch (error) {
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: `Error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            isUser: false,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, errorMessage])
          return
        }
      }

      setSending(false)
      setLoading(true)

      if (!res.ok) {
        let errorMessage = "Unknown error"
        try {
          const error = await res.json()
          errorMessage = error.error || error.details || "Unknown error"
        } catch {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`
        }

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

      const reader = res.body?.getReader()
      if (!reader) return

      let fullResponse = ""
      const decoder = new TextDecoder()
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "",
        isUser: false,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          console.log("STREAM LINE DEBUG:", line)
          if (line.startsWith("0:")) {
            const text = line.slice(2)
            if (text.startsWith('"') && text.endsWith('"')) {
              fullResponse += JSON.parse(text)
            }
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessage.id
                  ? { ...msg, content: fullResponse }
                  : msg
              )
            )
          } else if (line.startsWith("9:")) {
            // Handle data change notification
            try {
              const dataInfo = JSON.parse(line.slice(2))
              if (dataInfo.dataHasChanged) {
                console.log("Data has changed, invalidating React Query cache")
                // Invalidate ALL queries to refetch data across the entire app
                // This ensures any list or item that was modified gets updated
                queryClient.invalidateQueries()
              }
            } catch (error) {
              console.error("Failed to parse data change notification:", error)
            }
          } else if (line.startsWith("3:")) {
            // Error in stream - replace the thinking message with error
            console.log("ERROR STREAM LINE DETECTED:", line)
            try {
              const errorText = line.slice(2)
              console.log("ERROR TEXT TO PARSE:", errorText)
              const errorData = JSON.parse(errorText)
              console.log("PARSED ERROR DATA:", errorData)
              const finalErrorMsg = `Error: ${
                typeof errorData === "string"
                  ? errorData
                  : errorData.error ||
                    errorData.message ||
                    "Streaming error occurred"
              }`
              console.log("FINAL ERROR MESSAGE TO SHOW:", finalErrorMsg)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessage.id
                    ? { ...msg, content: finalErrorMsg }
                    : msg
                )
              )
              setLoading(false)
              return
            } catch (parseError) {
              // Failed to parse error JSON, but still show the raw error text
              const errorText = line.slice(2)
              console.log("PARSE ERROR OCCURRED:", parseError)
              console.log("RAW ERROR TEXT FROM STREAM:", errorText)
              const fallbackMsg = `Error: ${
                errorText ||
                "Streaming error occurred. Please check that your API key and model are correct."
              }`
              console.log("FALLBACK ERROR MESSAGE TO SHOW:", fallbackMsg)
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === aiMessage.id
                    ? { ...msg, content: fallbackMsg }
                    : msg
                )
              )
              setLoading(false)
              return
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
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setSending(false)
      setLoading(false)
    }
  }

  return { handleSubmit }
}