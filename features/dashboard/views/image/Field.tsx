import {
  type PropsWithChildren,
  type SyntheticEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'

import type { FieldProps } from '../../types'
import { formatBytes } from './utils'
import type { ImageValue } from './index'
import { type controller, validateImage } from '.'

export function Field(props: FieldProps<typeof controller>) {
  const { autoFocus, field, onChange, value } = props
  const inputRef = useRef<HTMLInputElement | null>(null)
  const errorMessage = validateImage(field.extensions, value)

  const onUploadChange = ({
    currentTarget: { validity, files },
  }: SyntheticEvent<HTMLInputElement>) => {
    const file = files?.[0]
    if (!file) return // bail if the user cancels from the file browser
    onChange?.({
      kind: 'upload',
      data: { file, validity },
      previous: value,
    })
  }
  const onFileTrigger = () => {
    inputRef.current?.click()
  }

  // Generate a random input key when the value changes, to ensure the file input is unmounted and
  // remounted (this is the only way to reset its value and ensure onChange will fire again if
  // the user selects the same file again)
  const inputKey = useMemo(() => Math.random(), [value])
  const accept = useMemo(
    () => field.extensions.map((ext: string) => [`.${ext}`, `image/${ext}`].join(', ')).join(', '),
    []
  )

  return (
    <div className="space-y-2">
      <Label htmlFor={field.path}>
        {field.label}
        {field.description && (
          <span className="text-sm text-muted-foreground block">
            {field.description}
          </span>
        )}
      </Label>
      {errorMessage && (
        <div className="text-sm text-destructive">{errorMessage}</div>
      )}
      <ImageView
        isInvalid={Boolean(errorMessage)}
        onFileTrigger={onFileTrigger}
        onChange={onChange}
        value={value}
      />
      <Input
        id={field.path}
        accept={accept}
        autoComplete="off"
        autoFocus={autoFocus}
        disabled={onChange === undefined}
        className="hidden"
        key={inputKey}
        name={field.path}
        onChange={onUploadChange}
        ref={inputRef}
        type="file"
      />
    </div>
  )
}

function ImageView(props: {
  onFileTrigger: () => void
  isInvalid?: boolean
  onChange?: (value: ImageValue) => void
  value: ImageValue
}) {
  const { isInvalid, onFileTrigger, onChange, value } = props
  const imageData = useImageData(value)

  return (
    <div className="space-y-4">
      {isInvalid || !imageData ? null : (
        <ImageDetails {...imageData}>
          {onChange && (
            <div className="flex gap-2 items-center mt-auto">
              <Button type="button" size="sm" variant="outline" onClick={onFileTrigger}>
                Change
              </Button>
              {value.kind === 'from-server' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange({ kind: 'remove', previous: value })
                  }}
                >
                  Remove
                </Button>
              )}
              {value.kind === 'upload' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onChange(value.previous)
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </ImageDetails>
      )}

      {!imageData && (
        <div className="flex gap-2 items-center">
          <Button type="button" disabled={onChange === undefined} onClick={onFileTrigger}>
            Upload
          </Button>
          {value.kind === 'remove' && value.previous && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (value.previous !== undefined) {
                  onChange?.(value?.previous)
                }
              }}
            >
              Undo removal
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function useObjectURL(fileData: File | undefined) {
  const [objectURL, setObjectURL] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!fileData) return
    const url = URL.createObjectURL(fileData)
    setObjectURL(url)
    return () => URL.revokeObjectURL(url)
  }, [fileData])
  return objectURL
}

function ImageDetails(props: PropsWithChildren<ImageData>) {
  // hide content until the uploaded image until it's available; use dimensions
  // as an indicator since they're set on load.
  const isLoaded = props.height && props.width

  return (
    <div
      className={cn(
        "bg-background border rounded-md min-h-48 overflow-hidden flex transition-opacity",
        "max-sm:flex-col",
        isLoaded ? "opacity-100" : "opacity-0"
      )}
    >
      {props.url ? (
        <img
          onLoad={props.onLoad}
          className={cn(
            "max-h-48 max-w-full min-w-0 object-contain",
            "sm:h-48 sm:w-48 sm:flex-shrink-0"
          )}
          alt="preview of the upload"
          src={props.url}
        />
      ) : (
        <div className={cn(
          "max-h-48 max-w-full min-w-0 flex items-center justify-center bg-muted",
          "sm:h-48 sm:w-48 sm:flex-shrink-0"
        )}>
          <ImageIcon className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
      <div className="p-4 flex flex-col gap-3 flex-1 min-w-0">
        {props.name ? (
          <div className="text-sm font-medium truncate" title={props.name}>
            {props.name}
          </div>
        ) : null}
        {props.filesize ? (
          <div className="text-sm text-muted-foreground">
            {formatBytes(props.filesize)} • {props.width}×{props.height}
          </div>
        ) : null}

        {/* field controls dependant on value type */}
        {props.children}
      </div>
    </div>
  )
}

type ImageData = {
  name?: string
  url: string
  filesize?: number
  width?: number
  height?: number
  onLoad: (event: SyntheticEvent<HTMLImageElement>) => void
}

function useImageData(value: ImageValue): ImageData | null {
  // only relevant for uploaded images, but we must observe the rules of hooks
  // so these can't be called conditionally.
  const imagePathFromUpload = useObjectURL(value.kind === 'upload' ? value.data.file : undefined)
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 })
  const onLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      if (value.kind === 'upload') {
        setDimensions({
          height: event.currentTarget.naturalHeight,
          width: event.currentTarget.naturalWidth,
        })
      }
    },
    [value.kind]
  )

  // reset dimensions when the user cancels the upload. we use the dimensions as
  // a signal that the image has loaded.
  useEffect(() => {
    if (value.kind !== 'upload') {
      setDimensions({ height: 0, width: 0 })
    }
  }, [value.kind])

  switch (value.kind) {
    case 'from-server':
      return {
        url: value.data.url,
        name: `${value.data.id}.${value.data.extension}`,
        filesize: value.data.filesize,
        width: value.data.width,
        height: value.data.height,
        onLoad,
      } as const

    case 'upload':
      return {
        // always string for simpler types, should be unreachable if the file selection fails validation.
        url: imagePathFromUpload || '',
        name: value.data.file.name,
        filesize: value.data.file.size,
        width: dimensions.width,
        height: dimensions.height,
        onLoad,
      } as const
  }

  return null
}