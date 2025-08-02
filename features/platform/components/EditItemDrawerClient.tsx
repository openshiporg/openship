'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Badge } from '@/components/ui/badge'
import { Fields } from '../../dashboard/components/Fields'
import { useInvalidFields } from '../../dashboard/utils/useInvalidFields'
import { useHasChanges, serializeValueToOperationItem } from '../../dashboard/utils/useHasChanges'
import { enhanceFields } from '../../dashboard/utils/enhanceFields'
import { updateItemAction, deleteItemAction } from '../../dashboard/actions/item-actions'
import { AlertCircle, Check, Loader2, Undo2, Copy } from 'lucide-react'
import { RiDeleteBinLine } from '@remixicon/react'
import { toast } from 'sonner'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'

interface EditItemDrawerClientProps {
  list: any
  item: Record<string, unknown>
  itemId: string
  onClose: () => void
  onSave?: (updatedItem: any) => void
}

// Hook for event callbacks (copied from ItemPageClient)
function useEventCallback<Func extends (...args: any[]) => unknown>(callback: Func): Func {
  const callbackRef = useRef(callback)
  const cb = useCallback((...args: any[]) => {
    return callbackRef.current(...args)
  }, [])
  useEffect(() => {
    callbackRef.current = callback
  })
  return cb as any
}

// Helper function to deserialize item data using enhanced fields (copied from ItemPageClient)
function deserializeItemToValue(
  enhancedFields: Record<string, any>,
  item: Record<string, unknown | null>
) {
  const result: Record<string, unknown | null> = {}
  
  Object.entries(enhancedFields).forEach(([fieldPath, field]) => {
    try {
      // Enhanced fields already have controllers
      const controller = field.controller
      
      // Create itemForField with only the GraphQL fields this controller needs
      const itemForField: Record<string, unknown> = {}
      // For now, just use the field path as the GraphQL field
      itemForField[field.path] = item?.[field.path] ?? null
      
      // Call deserialize with the properly structured data
      result[fieldPath] = controller.deserialize(itemForField)
    } catch (error) {
      console.error(`Error deserializing field ${fieldPath}:`, error)
    }
  })
  
  return result
}

export function EditItemDrawerClient({ 
  list, 
  item, 
  itemId, 
  onClose, 
  onSave 
}: EditItemDrawerClientProps) {
  const router = useRouter()
  // Create enhanced fields exactly like ItemPageClient does
  const enhancedFields = useMemo(() => {
    return enhanceFields(list.fields || {}, list.key)
  }, [list.fields, list.key])

  // Deserialize the item data exactly like ItemPageClient
  const initialValue = useMemo(() => {
    return deserializeItemToValue(enhancedFields, item)
  }, [enhancedFields, item])

  // State exactly like ItemPageClient
  const [value, setValue] = useState(() => initialValue)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [forceValidation, setForceValidation] = useState(false)
  const [copied, setCopied] = useState(false)

  // Reset value when initialValue changes (like ItemPageClient)
  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  // Create isRequireds object exactly like ItemPageClient
  const isRequireds = useMemo(() => {
    const result: Record<string, any> = {}
    
    Object.entries(enhancedFields).forEach(([fieldPath, field]) => {
      result[fieldPath] = field.itemView?.isRequired || false
    })
    
    // Override with dynamic adminMeta data if available
    if (list.adminMetaFields) {
      list.adminMetaFields.forEach((field: any) => {
        if (field.itemView && field.itemView.isRequired !== undefined) {
          result[field.path] = field.itemView.isRequired
        }
      })
    }
    
    return result
  }, [enhancedFields, list.adminMetaFields])

  // Use validation and change detection exactly like ItemPageClient
  const invalidFields = useInvalidFields(enhancedFields, value, isRequireds)
  const hasChanges = useHasChanges('update', enhancedFields, value, initialValue)

  // Save handler exactly like ItemPageClient
  const handleSave = useEventCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    // Check for invalid fields - exact ItemPageClient pattern
    const newForceValidation = invalidFields.size !== 0
    setForceValidation(newForceValidation)
    if (newForceValidation) {
      console.log('Validation failed, invalid fields:', Array.from(invalidFields))
      return
    }
    
    setSaveState('saving')
    
    try {
      // Serialize only changed fields - exact ItemPageClient pattern
      const changedData = serializeValueToOperationItem('update', enhancedFields, value, initialValue)
      
      console.log('Saving item with data:', {
        id: initialValue.id,
        data: changedData,
        hasChanges: Object.keys(changedData).length > 0
      })
      
      // Call server action - exactly like ItemPageClient
      const { errors } = await updateItemAction(list.key, initialValue.id as string, changedData)
      
      // Handle errors exactly like ItemPageClient
      const error = errors?.find(x => x.path === undefined || x.path?.length === 1)
      if (error) {
        toast.error('Unable to save item', {
          description: error.message
        })
        setSaveState('idle')
        return
      }
      
      toast.success(`Saved changes to ${list.singular.toLowerCase()}`)
      setSaveState('saved')
      
      // Reset validation state after successful save
      setForceValidation(false)
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(item)
      }
      
      // Reset to idle after showing saved state
      setTimeout(() => setSaveState('idle'), 2000)
      
      // Close drawer after successful save
      setTimeout(() => onClose(), 2500)
      
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error('Unable to save item', {
        description: error.message
      })
      setSaveState('idle')
    }
  })

  const handleCancel = () => {
    onClose()
  }

  // Copy handler for item ID
  const handleCopy = useEventCallback(async () => {
    try {
      await navigator.clipboard.writeText(itemId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('ID copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  })

  // Reset handler exactly like ItemPageClient
  const handleReset = useEventCallback(() => {
    setValue(initialValue)
    setForceValidation(false)
  })

  // Delete handler exactly like ItemPageClient
  const handleDelete = useEventCallback(async () => {
    try {
      const { errors } = await deleteItemAction(list.key, itemId)
      
      const error = errors?.find(x => x.path === undefined || x.path?.length === 1)
      if (error) {
        toast.error('Unable to delete item.', {
          action: {
            label: 'Details',
            onClick: () => console.error('Delete error:', error.message)
          }
        })
        return
      }
      
      toast.success(`${list.singular} deleted successfully.`)
      
      // Close the drawer first
      onClose()
      
      // Don't redirect automatically - let the parent handle navigation
      // The drawer is used in platform context, not Keystone admin context
    } catch (err: any) {
      toast.error("Unable to delete item.", {
        action: {
          label: "Details",
          onClick: () => console.error('Delete error:', err.message)
        }
      })
    }
  })

  return (
    <>
      <DrawerHeader className="flex-shrink-0">
        <DrawerTitle>Edit {list.singular}</DrawerTitle>
        <div className="mt-2">
          <div className="relative border rounded-md bg-muted/40 transition-all">
            <div className="p-1 flex items-center gap-3">
              <div className="flex gap-3 flex-1 min-w-0">
                <div className="flex-shrink-0">
                  <div className="bg-background shadow-xs border rounded-sm py-0.5 px-1 text-[.65rem] text-muted-foreground">
                    ID
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-mono truncate">
                    {itemId}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-sm h-6 w-6 flex-shrink-0 relative"
                onClick={handleCopy}
                disabled={copied}
              >
                <div
                  className={`transition-all duration-200 ${
                    copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                  }`}
                >
                  <Check className="size-3 text-emerald-500" />
                </div>
                <div
                  className={`absolute transition-all duration-200 ${
                    copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                  }`}
                >
                  <Copy className="size-3" />
                </div>
                <span className="sr-only">{copied ? "Copied" : "Copy ID"}</span>
              </Button>
            </div>
          </div>
        </div>
      </DrawerHeader>
      
      <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto p-4">
          <Fields
            list={list}
            fields={enhancedFields}
            value={value}
            onChange={setValue}
            forceValidation={forceValidation}
            invalidFields={invalidFields}
            isRequireds={isRequireds}
          />
        </div>

        <DrawerFooter className="flex-shrink-0 border-t !flex-col">

          
          <div className="flex justify-between items-center w-full">
            {/* Reset and Delete icon buttons on the left */}
            <div className="flex gap-2">
              {/* Reset button - only show when there are changes */}
              {hasChanges && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <Undo2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset changes</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure? Lost changes cannot be recovered.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleReset}>
                        Yes, reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {/* Delete button - only show if list allows deletion */}
              {!list.hideDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <RiDeleteBinLine className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>
                          {list.singular}
                          {!list.isSingleton && ` ${itemId}`}
                        </strong>
                        ? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete}>
                        Yes, delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>

            {/* Save and Cancel buttons on the right */}
            <div className="flex gap-3 ml-auto">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saveState === 'saving' || !hasChanges}
                className="min-w-[100px]"
              >
                {saveState === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : saveState === 'saved' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </form>
    </>
  )
}
