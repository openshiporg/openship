import { useCallback, useRef } from 'react'

export function useControlledPopover({ isOpen, onClose }) {
  const triggerRef = useRef(null)

  const getTriggerProps = useCallback(
    (props = {}) => ({
      ref: triggerRef,
      'aria-expanded': isOpen,
      'aria-haspopup': true,
      ...props
    }),
    [isOpen]
  )

  const getContentProps = useCallback(
    (props = {}) => ({
      onOpenAutoFocus: (e) => {
        e.preventDefault()
        triggerRef.current?.focus()
      },
      onEscapeKeyDown: onClose,
      onPointerDownOutside: onClose,
      onFocusOutside: onClose,
      ...props
    }),
    [onClose]
  )

  return {
    trigger: {
      ref: triggerRef,
      props: {
        'aria-expanded': isOpen,
        'aria-haspopup': true
      }
    },
    content: {
      props: getContentProps()
    },
    getTriggerProps,
    getContentProps
  }
} 