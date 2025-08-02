import { CustomMultiSelect, Option } from "./CustomMultiSelect";
import { CustomSelect } from "./CustomSelect";
import { cn } from "@/lib/utils";
import React from "react";

interface BaseSelectProps {
  id?: string;
  value?: Option | null;
  options?: Option[];
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  isClearable?: boolean;
  autoFocus?: boolean;
  onInputChange?: (value: string) => Promise<Option[]>;
  controlShouldRenderValue?: boolean;
  components?: Record<string, React.ComponentType<any>>;
  "aria-describedby"?: string;
}

interface CustomSelectProps extends BaseSelectProps {
  onChange: (value: Option | null) => void;
}

interface CustomMultiSelectProps {
  onChange: (value: Option[]) => void;
  value?: Option[];
  options?: Option[];
  placeholder?: string;
  isLoading?: boolean;
  isDisabled?: boolean;
  className?: string;
  isClearable?: boolean;
  autoFocus?: boolean;
  onInputChange?: (value: string) => Promise<Option[]>;
  controlShouldRenderValue?: boolean;
  components?: Record<string, React.ComponentType<any>>;
  "aria-describedby"?: string;
}

export type { Option };

export function Select({
  onChange,
  value,
  options = [],
  placeholder,
  isLoading,
  isDisabled,
  className,
  isClearable = true,
  autoFocus,
  id,
  onInputChange,
  controlShouldRenderValue = true,
  components,
  "aria-describedby": ariaDescribedby,
}: CustomSelectProps) {
  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      isDisabled={isDisabled}
      className={className}
      isLoading={isLoading}
      isClearable={isClearable}
      onInputChange={onInputChange}
    />
  );
}

export function MultiSelect({
  onChange,
  value = [],
  options = [],
  placeholder,
  isLoading,
  isDisabled,
  className,
  isClearable = true,
  autoFocus,

  onInputChange,
  controlShouldRenderValue = true,
  components,
  "aria-describedby": ariaDescribedby,
}: CustomMultiSelectProps) {
  return (
    <CustomMultiSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      isDisabled={isDisabled}
      className={cn(
        className,
        !controlShouldRenderValue && "min-h-[38px]"
      )}
      isLoading={isLoading}
      isClearable={isClearable}
      onInputChange={onInputChange}
    />
  );
}