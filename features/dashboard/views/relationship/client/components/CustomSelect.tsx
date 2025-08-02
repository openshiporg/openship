"use client"

import * as React from "react"
import { Check, ChevronDown, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Option } from "./CustomMultiSelect"
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CustomSelectProps {
  value?: Option | null;
  options?: Option[];
  onChange?: (option: Option | null) => void;
  onInputChange?: (value: string) => Promise<Option[]>;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  isClearable?: boolean;
}

export function CustomSelect({
  value,
  options = [],
  onChange,
  onInputChange,
  placeholder = "Select...",
  isLoading = false,
  isDisabled = false,
  className,
  isClearable = true,
}: CustomSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [availableOptions, setAvailableOptions] = React.useState<Option[]>(options)

  // Update available options when options prop changes
  React.useEffect(() => {
    setAvailableOptions(options)
  }, [options])

  const handleInputChange = React.useCallback(
    async (newInputValue: string) => {
      setInputValue(newInputValue)
      if (onInputChange) {
        const newOptions = await onInputChange(newInputValue)
        setAvailableOptions(newOptions)
      }
    },
    [onInputChange]
  )

  const handleSelect = React.useCallback(
    (option: Option | null) => {
      // If selecting the same value, clear it (toggle behavior)
      if (value && option && value.value === option.value) {
        onChange?.(null)
      } else {
        onChange?.(option)
      }
      setOpen(false)
      setInputValue("")
    },
    [onChange, value]
  )

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onChange?.(null)
    },
    [onChange]
  )

  // Implementation exactly matching shadcn SelectTrigger
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-4 py-2 text-left ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 cursor-pointer",
            isDisabled && "cursor-not-allowed opacity-50",
            className
          )}
          onClick={(e) => {
            e.preventDefault();
            if (!isDisabled) {
              setOpen(true)
            }
          }}
          onKeyDown={(e) => {
            if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          aria-disabled={isDisabled}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="text-base self-start text-left w-full">{value ? value.label : placeholder}</span>
          
          {/* This exactly matches the SelectTrigger's chevron area */}
          <div className="flex items-center">
            {isClearable && value && !isDisabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear(e);
                }}
                className="mr-1 text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 max-w-[400px]" align="start">
        <Command>
          <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
            <input
              placeholder="Search..."
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <>
                {availableOptions.length === 0 ? (
                  <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                    {inputValue.length > 0 ? (
                      <>No results found for "{inputValue}"</>
                    ) : (
                      <>No options available</>
                    )}
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {availableOptions.map((option) => (
                      <div className="px-1 py-0.5" key={option.value}>
                        <div 
                          onClick={() => handleSelect(option)}
                          className={cn(
                            "relative cursor-pointer rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                            value?.value === option.value && "bg-accent text-accent-foreground"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-1 whitespace-normal break-words overflow-visible min-w-0 pr-2">
                              {option.label}
                            </div>
                            {value?.value === option.value && (
                              <div className="flex-shrink-0 mt-0.5">
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
