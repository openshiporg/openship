import { Transforms } from  'slate'
import { ReactEditor } from  'slate-react'
import React, { useCallback, useEffect, useRef, useState, useContext } from 'react'

// this ensures that when changes happen, they are immediately shown
// this stops the problem of a cursor resetting to the end when a change is made
// because the changes are applied asynchronously
export function useElementWithSetNodes(editor, element) {
  const [state, setState] = useState({ element, elementWithChanges: element })
  if (state.element !== element) {
    setState({ element, elementWithChanges: element })
  }

  const elementRef = useRef(element)

  useEffect(() => {
    elementRef.current = element
  })

  const setNodes = useCallback((changesOrCallback) => {
    const currentElement = elementRef.current
    const changes =
      typeof changesOrCallback === 'function'
        ? changesOrCallback(currentElement)
        : changesOrCallback
    Transforms.setNodes(editor, changes, { at: ReactEditor.findPath(editor, currentElement) })
    setState({
      element: currentElement,
      elementWithChanges: { ...currentElement, ...changes },
    })
  }, [editor])
  return [state.elementWithChanges, setNodes];
}

export function useEventCallback(callback) {
  const callbackRef = useRef(callback)
  const cb = useCallback((...args) => {
    return callbackRef.current(...args);
  }, [])
  useEffect(() => {
    callbackRef.current = callback
  })
  return cb;
}

const ForceValidationContext = React.createContext(false)

export const ForceValidationProvider = ForceValidationContext.Provider

export function useForceValidation () {
  return useContext(ForceValidationContext);
}
