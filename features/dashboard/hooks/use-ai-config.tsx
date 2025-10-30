"use client"

import * as React from "react"

type KeyMode = "env" | "local"

interface LocalKeys {
  provider: string
  apiKey: string
  model: string
  maxTokens: string
  customEndpoint?: string
}

interface AiConfig {
  enabled: boolean
  keyMode: KeyMode
  localKeys?: LocalKeys
}

interface AiConfigProviderProps {
  children: React.ReactNode
  defaultConfig?: Partial<AiConfig>
  storageKey?: string
}

interface AiConfigProviderState {
  config: AiConfig
  setConfig: (config: Partial<AiConfig> | ((prev: AiConfig) => Partial<AiConfig>)) => void
  isHydrated: boolean
}

const isServer = typeof window === "undefined"
const AiConfigContext = React.createContext<AiConfigProviderState | undefined>(
  undefined
)

const defaultAiConfig: AiConfig = {
  enabled: true,
  keyMode: "env",
  localKeys: undefined,
}

const saveToLS = (storageKey: string, config: AiConfig) => {
  try {
    // Save individual keys for backward compatibility
    localStorage.setItem("aiChatEnabled", config.enabled.toString())
    localStorage.setItem("aiKeyMode", config.keyMode)

    if (config.localKeys) {
      localStorage.setItem("openRouterProvider", config.localKeys.provider)
      localStorage.setItem("openRouterApiKey", config.localKeys.apiKey)
      localStorage.setItem("openRouterModel", config.localKeys.model)
      localStorage.setItem("openRouterMaxTokens", config.localKeys.maxTokens)
      if (config.localKeys.customEndpoint) {
        localStorage.setItem("openRouterCustomEndpoint", config.localKeys.customEndpoint)
      }
    }

    // Also save the complete config as JSON for easier future management
    localStorage.setItem(storageKey, JSON.stringify(config))
  } catch {
    // Unsupported
  }
}

const loadFromLS = (storageKey: string, defaultConfig: AiConfig): AiConfig => {
  if (isServer) return defaultConfig
  
  try {
    // Try to load from new JSON format first
    const savedConfig = localStorage.getItem(storageKey)
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig) as AiConfig
      // Ensure all required fields are present
      return {
        ...defaultConfig,
        ...parsed,
      }
    }
    
    // Fallback to legacy individual keys for backward compatibility
    const enabled = localStorage.getItem("aiChatEnabled") !== "false" // Default to true now
    const keyMode = (localStorage.getItem("aiKeyMode") as KeyMode) || defaultConfig.keyMode

    const localKeys = keyMode === "local" ? {
      provider: localStorage.getItem("openRouterProvider") || "openrouter",
      apiKey: localStorage.getItem("openRouterApiKey") || "",
      model: localStorage.getItem("openRouterModel") || "openai/gpt-4o-mini",
      maxTokens: localStorage.getItem("openRouterMaxTokens") || "4000",
      customEndpoint: localStorage.getItem("openRouterCustomEndpoint") || undefined,
    } : undefined

    const config: AiConfig = {
      enabled,
      keyMode,
      localKeys,
    }
    
    // Migrate to new format
    saveToLS(storageKey, config)
    
    return config
  } catch {
    return defaultConfig
  }
}

const useAiConfig = () => {
  const context = React.useContext(AiConfigContext)
  if (context === undefined) {
    throw new Error("useAiConfig must be used within an AiConfigProvider")
  }
  return context
}

const AiConfigRoot = ({
  storageKey = "ai-config",
  defaultConfig: providedDefaults,
  children,
}: AiConfigProviderProps) => {
  const defaultConfig = React.useMemo(() => ({
    ...defaultAiConfig,
    ...providedDefaults,
  }), [providedDefaults])

  const [config, setConfigState] = React.useState<AiConfig>(() =>
    loadFromLS(storageKey, defaultConfig)
  )

  const setConfig = React.useCallback(
    (value: Partial<AiConfig> | ((prev: AiConfig) => Partial<AiConfig>)) => {
      if (typeof value === "function") {
        setConfigState((prevConfig) => {
          const updates = value(prevConfig)
          const newConfig = { ...prevConfig, ...updates }
          saveToLS(storageKey, newConfig)
          return newConfig
        })
      } else {
        setConfigState((prevConfig) => {
          const newConfig = { ...prevConfig, ...value }
          saveToLS(storageKey, newConfig)
          return newConfig
        })
      }
    },
    [storageKey]
  )

  // localStorage event handling for cross-tab synchronization
  React.useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== storageKey && !e.key?.startsWith("ai") && !e.key?.startsWith("openRouter")) {
        return
      }

      // Reload config from localStorage when it changes in another tab
      const newConfig = loadFromLS(storageKey, defaultConfig)
      setConfigState(newConfig)
    }

    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [storageKey, defaultConfig])

  // Prevent config access during hydration
  const [isHydrated, setIsHydrated] = React.useState(false)
  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  const providerValue = React.useMemo(
    () => ({
      config: isHydrated ? config : defaultConfig,
      setConfig,
      isHydrated,
    }),
    [config, setConfig, isHydrated, defaultConfig]
  )

  return (
    <AiConfigContext.Provider value={providerValue}>
      {children}
    </AiConfigContext.Provider>
  )
}

const AiConfigProvider = (props: AiConfigProviderProps) => {
  const context = React.useContext(AiConfigContext)

  // Ignore nested context providers, just passthrough children
  if (context) return <>{props.children}</>
  return <AiConfigRoot {...props} />
}

// Convenience hooks for common use cases
const useAiEnabled = () => {
  const { config } = useAiConfig()
  return config.enabled
}

const useAiKeyMode = () => {
  const { config, setConfig } = useAiConfig()
  return {
    keyMode: config.keyMode,
    setKeyMode: (keyMode: KeyMode) => setConfig({ keyMode }),
  }
}

const useLocalKeys = () => {
  const { config, setConfig } = useAiConfig()
  return {
    localKeys: config.localKeys,
    setLocalKeys: (localKeys: LocalKeys) => setConfig({ localKeys }),
  }
}

// Legacy compatibility - matches your existing AiChatStorage interface
const AiChatStorageCompat = {
  getConfig: (): AiConfig => {
    return loadFromLS("ai-config", defaultAiConfig)
  },
  
  saveConfig: (updates: Partial<AiConfig>) => {
    const currentConfig = loadFromLS("ai-config", defaultAiConfig)
    const newConfig = { ...currentConfig, ...updates }
    saveToLS("ai-config", newConfig)
  }
}

export {
  useAiConfig,
  AiConfigProvider,
  useAiEnabled,
  useAiKeyMode,
  useLocalKeys,
  AiChatStorageCompat as AiChatStorage,
  type AiConfig,
  type KeyMode,
  type LocalKeys,
}