"use client";

import * as React from "react";
import { CheckIcon, XCircle, ChevronDown, XIcon, X } from "lucide-react";
import { cn } from "@keystone/utils/cn";
import { Button } from "./button";
import { Badge } from "./badge";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";

export const MultiSelect = React.forwardRef(
  (
    {
      options,
      onValueChange,
      defaultValue = [],
      placeholder = "Select options",
      maxCount = 3,
      className,
      ...props
    },
    ref
  ) => {
    const [selectedValues, setSelectedValues] = React.useState(defaultValue);
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    React.useEffect(() => {
      setSelectedValues(defaultValue);
    }, [defaultValue]);

    const toggleOption = (value) => {
      const newSelectedValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const toggleAll = () => {
      if (selectedValues.length === options.length) {
        handleClear();
      } else {
        const allValues = options.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }
    };

    const filteredOptions = options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            {...props}
            variant="secondary"
            role="combobox"
            aria-expanded={isOpen}
            className={cn(
              "w-full justify-between",
              selectedValues.length > 0 ? "h-full" : "h-10",
              className
            )}
          >
            <div className="flex flex-wrap gap-1">
              {selectedValues.length > 0 ? (
                selectedValues.slice(0, maxCount).map((value) => (
                  <Badge
                    key={value}
                    color="sky"
                    className="border mr-1 flex items-center gap-2 text-sm py-0.5 pr-1 pl-1.5"
                  >
                    {options.find((option) => option.value === value)?.label}
                    <Badge
                      color="zinc"
                      className="border p-0.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(value);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Badge>
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
              {selectedValues.length > maxCount && (
                <Badge variant="secondary" className="mr-1 mb-1">
                  +{selectedValues.length - maxCount} more
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2 border" align="start">
          <div className="flex flex-col">
            <Input
              className="px-2 py-1 border-b mb-2"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="max-h-[300px] overflow-auto">
              <div
                className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-muted"
                onClick={toggleAll}
              >
                <div
                  className={cn(
                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                    selectedValues.length === options.length
                      ? "bg-primary text-primary-foreground"
                      : "opacity-75"
                  )}
                >
                  {selectedValues.length === options.length && (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </div>
                <span>Select All</span>
              </div>
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center px-2 py-1.5 cursor-pointer hover:bg-muted"
                  onClick={() => toggleOption(option.value)}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                      selectedValues.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50"
                    )}
                  >
                    {selectedValues.includes(option.value) && (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </div>
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
            {selectedValues.length > 0 && (
              <Button
                variant="light"
                className="mt-2"
                onClick={() => {
                  handleClear();
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
