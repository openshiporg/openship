import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { XIcon, ChevronDown } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

export interface Option {
  value: string;
  label: string;
  data?: any;
}

interface CustomMultiSelectProps {
  value?: Option[];
  options?: Option[];
  onChange?: (options: Option[]) => void;
  onInputChange?: (value: string) => Promise<Option[]>;
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  isClearable?: boolean;
}

export function CustomMultiSelect({
  value = [],
  options = [],
  onChange,
  onInputChange,
  placeholder = "Select...",
  isLoading = false,
  isDisabled = false,
  className,
  isClearable = true,
}: CustomMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [availableOptions, setAvailableOptions] = useState<Option[]>(options);
  const inputRef = useRef<HTMLInputElement>(null);
  const commandRef = useRef<HTMLDivElement>(null);

  // Update available options when options prop changes
  useEffect(() => {
    setAvailableOptions(options);
  }, [options]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        commandRef.current &&
        !commandRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = useCallback(
    async (newInputValue: string) => {
      setInputValue(newInputValue);
      if (onInputChange) {
        const newOptions = await onInputChange(newInputValue);
        setAvailableOptions(newOptions);
      }
    },
    [onInputChange]
  );

  const handleSelect = useCallback(
    (option: Option) => {
      if (!value.some((v) => v.value === option.value)) {
        const newValue = [...value, option];
        onChange?.(newValue);
      }
      setInputValue("");
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (optionToRemove: Option) => {
      const newValue = value.filter((v) => v.value !== optionToRemove.value);
      onChange?.(newValue);
    },
    [value, onChange]
  );

  const handleClearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  // Filter out selected options
  const filteredOptions = availableOptions.filter(
    (option) => !value.some((v) => v.value === option.value)
  );

  return (
    <div className="relative" ref={commandRef}>
      <div
        className={cn(
          "border-input ring-offset-background focus-within:ring-ring flex min-h-11 w-full items-center justify-between rounded-md border bg-transparent px-4 py-2 focus-within:ring-2 focus-within:ring-offset-2 text-left",
          isDisabled && "cursor-not-allowed opacity-50",
          className
        )}
        onClick={() => {
          if (!isDisabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <div className="flex flex-wrap gap-1">
          {value.map((option) => (
            <div
              key={option.value}
              className="animate-fadeIn bg-background text-secondary-foreground relative inline-flex h-7 cursor-default items-center rounded-md border ps-2 pe-7 text-xs font-medium transition-all disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 max-w-full"
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">{option.label}</span>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(option);
                  }}
                  className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute -inset-y-px -end-px flex size-7 items-center justify-center rounded-e-md border border-transparent p-0 outline-hidden transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <input
            ref={inputRef}
            disabled={isDisabled}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className={cn(
              "placeholder:text-muted-foreground flex-1 bg-transparent outline-none",
              value.length === 0 ? "w-full" : "w-20"
            )}
            placeholder={value.length === 0 ? placeholder : ""}
          />
        </div>
        <div className="flex items-center gap-1">
          {isClearable && value.length > 0 && !isDisabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex size-7 items-center justify-center rounded-md border border-transparent transition-[color,box-shadow] outline-none focus-visible:ring-[3px]"
            >
              <XIcon className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full max-w-[400px]">
          <Command className="border-input rounded-md border bg-popover shadow-md">
            <CommandList>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  {filteredOptions.length === 0 ? (
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      {inputValue.length > 0 ? (
                        <>No results found for "{inputValue}"</>
                      ) : availableOptions.length === 0 ? (
                        <>No options available</>
                      ) : (
                        <>All options have been selected</>
                      )}
                    </CommandEmpty>
                  ) : (
                    <CommandGroup>
                      {filteredOptions.map((option) => (
                        <div className="px-1 py-0.5" key={option.value}>
                          <div 
                            onClick={() => handleSelect(option)}
                            className="relative cursor-pointer rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                          >
                            <div className="flex-1 whitespace-normal break-words overflow-visible min-w-0 pr-2">
                              {option.label}
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
        </div>
      )}
    </div>
  );
} 