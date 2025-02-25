import { useCallback, useRef, useEffect } from 'react'
import { usePopper } from 'react-popper'

export function useControlledPopover({ isOpen, onClose }, popperOptions = {}) {
  const triggerRef = useRef(null)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return;

    const handler = (event) => {
      if (
        !dialogRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  const { styles, attributes } = usePopper(triggerRef.current, dialogRef.current, {
    placement: 'bottom-start',
    ...popperOptions
  })

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
      align: "start",
      className: "p-1",
      ...props
    }),
    []
  )

  return {
    trigger: {
      ref: triggerRef,
      props: {
        'aria-expanded': isOpen,
        'aria-haspopup': true
      }
    },
    dialog: {
      ref: dialogRef,
      props: {
        style: styles.popper,
        ...attributes.popper
      }
    },
    getTriggerProps,
    getContentProps
  }
} 