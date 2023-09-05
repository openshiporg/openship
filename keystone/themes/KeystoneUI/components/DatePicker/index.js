/** @jsxRuntime classic */
/** @jsx jsx */

import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import FocusLock from "react-focus-lock"
import { jsx } from '@keystone-ui/core';
import { PopoverDialog, useControlledPopover } from "@keystone-ui/popover"

import { InputButton } from "@keystone/components/InputButton"
import { deserializeDate } from "@keystone/utils/deserializeDate";
import { formatDate } from "@keystone/utils/formatDate";
import { formatDateType } from "@keystone/utils/formatDateType";
import { dateFormatPlaceholder } from "@keystone/utils/dateFormatPlaceholder";
import { Calendar } from "@keystone/components/Calendar";

export function useEventCallback(callback) {
  const callbackRef = useRef(callback)
  const cb = useCallback((...args) => {
    return callbackRef.current(...args)
  }, [])
  useEffect(() => {
    callbackRef.current = callback
  })
  return cb
}

export const DatePicker = ({
  value,
  onUpdate,
  onClear,
  onBlur: _onBlur,
  ...props
}) => {
  const [isOpen, _setOpen] = useState(false)
  const onBlur = useEventCallback(() => {
    _onBlur?.()
  })
  const setOpen = useCallback(
    val => {
      _setOpen(val)
      if (!val) {
        onBlur?.()
      }
    },
    [onBlur]
  )
  const { dialog, trigger, arrow } = useControlledPopover(
    {
      isOpen,
      onClose: useCallback(() => {
        setOpen(false)
      }, [setOpen])
    },
    {
      placement: "bottom-start",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [0, 8]
          }
        }
      ]
    }
  )

  const handleDayClick = useCallback(
    day => {
      onUpdate(formatDateType(day))
      // wait a moment so the user has time to see the day become selected
      setTimeout(() => {
        setOpen(false)
      }, 300)
    },
    [onUpdate, setOpen]
  )

  // We **can** memoize this, but its a trivial operation
  // and in the opinion of the author not really something to do
  // before other more important performance optimisations
  const selectedDay = deserializeDate(value)
  const formattedDate = value ? formatDate(selectedDay) : undefined

  return (
    <Fragment>
      <InputButton
        aria-label={
          "Choose date" +
          (formattedDate ? `, selected date is ${formattedDate}` : "")
        }
        onClick={() => setOpen(true)}
        onClear={
          value
            ? () => {
                onClear()
                onBlur?.()
              }
            : undefined
        }
        isSelected={isOpen}
        ref={trigger.ref}
        {...props}
        {...trigger.props}
        // todo - magic number - align instead to parent Field ?
        style={{ minWidth: 200 }}
      >
        {formattedDate || dateFormatPlaceholder}
      </InputButton>
      {isOpen && (
        <PopoverDialog
          arrow={arrow}
          isVisible
          ref={dialog.ref}
          {...dialog.props}
        >
          <FocusLock autoFocus returnFocus disabled={!isOpen}>
            <Calendar onDayClick={handleDayClick} selected={selectedDay} />
          </FocusLock>
        </PopoverDialog>
      )}
    </Fragment>
  )
}
