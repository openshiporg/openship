import { cn } from "@keystone/utils/cn"
import { useEffect, useRef } from "react"

export function Collapse({ children, className, isOpen, horizontal = false }) {
  const containerRef = useRef(null)
  const innerRef = useRef(null)
  const animationRef = useRef(0)
  const initialOpen = useRef(isOpen)
  const initialRender = useRef(true)

  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    const animation = animationRef.current
    if (animation) {
      clearTimeout(animation)
    }
    if (initialRender.current || !container || !inner) return

    container.classList.toggle("duration-500", !isOpen)
    container.classList.toggle("duration-300", isOpen)

    if (horizontal) {
      // save initial width to avoid word wrapping when container width will be changed
      inner.style.width = `${inner.clientWidth}px`
      container.style.width = `${inner.clientWidth}px`
    } else {
      container.style.height = `${inner.clientHeight}px`
    }

    if (isOpen) {
      animationRef.current = window.setTimeout(() => {
        // should be style property in kebab-case, not css class name
        container.style.removeProperty("height")
      }, 300)
    } else {
      setTimeout(() => {
        if (horizontal) {
          container.style.width = "0px"
        } else {
          container.style.height = "0px"
        }
      }, 0)
    }
  }, [horizontal, isOpen])

  useEffect(() => {
    initialRender.current = false
  }, [])

  return (
    <div
      ref={containerRef}
      className="transform-gpu overflow-hidden transition-all ease-in-out motion-reduce:transition-none"
      style={initialOpen.current || horizontal ? undefined : { height: 0 }}
    >
      <div
        ref={innerRef}
        className={cn(
          "transition-opacity duration-500 ease-in-out motion-reduce:transition-none",
          isOpen ? "opacity-100" : "opacity-0",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
