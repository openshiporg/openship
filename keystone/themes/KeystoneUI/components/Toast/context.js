import { createContext, useContext } from "react"

function notInContext() {
  throw new Error(
    "This component must be used inside a <ToastProvider> component."
  )
}

export const ToastContext = createContext({
  addToast: notInContext,
  removeToast: notInContext
})

export const useToasts = () => useContext(ToastContext)
