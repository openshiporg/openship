import { cn } from "@keystone/utils/cn";
import { ChevronDown, ChevronDownIcon, Loader2, X } from "lucide-react";
import ReactSelect, { components, mergeStyles } from "react-select";
export { components as selectComponents } from "react-select";

const portalTarget =
  typeof document !== "undefined" ? document.body : undefined;

const controlStyles = {
  base: "shadow-sm flex align-center wrap justify-between rounded-md border border-input bg-muted/40 p-1.5 ring-offset-background",
  focus: "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  nonFocus: "disabled:cursor-not-allowed disabled:opacity-50",
};

const placeholderStyles =
  "col-start-1 col-end-3 row-start-1 row-end-2 text-muted-foreground pl-1";
const selectInputStyles =
  "inline-grid [grid-template-columns:min-content_auto] col-start-1 col-end-3 row-start-1 row-end-2 pl-1 py-0.5";
const singleValueContainerStyles = "items-center flex grid flex-1 flex-wrap";
const multiValueContainerStyles = "items-center flex flex-1 flex-wrap gap-1";
const singleValueStyles =
  "col-start-1 col-end-3 row-start-1 row-end-2 leading-7 ml-1";
const multiValueStyles =
  "shadow-sm overflow-hidden flex min-w-0 border-[1.5px] bg-background rounded-md items-center pl-2 gap-1 mr-1";
const multiValueLabelStyles = "pr-1 leading-6 text-sm";
const multiValueRemoveStyles =
  "border-l-[1.5px] hover:bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-600 dark:hover:bg-slate-500/20";
const indicatorsContainerStyles =
  "items-center self-stretch flex flex-shrink-0 box-border";
const clearIndicatorStyles =
  "p-1 hover:bg-background border border-transparent hover:border-muted/90 text-muted-foreground rounded-md hover:text-foreground/50";
const indicatorSeparatorStyles = "bg-muted";
const dropdownIndicatorStyles =
  "p-1 hover:bg-background border border-transparent hover:border-muted/90 text-muted-foreground rounded-md hover:text-foreground/50";
const groupHeadingStyles = "ml-3 mt-2 mb-1 text-muted-foreground text-sm";
const noOptionsMessageStyles =
  "text-muted-foreground py-2 px-5 bg-background border border-dashed border-input rounded-sm";

// const optionStyles = {
//   base: "relative cursor-pointer flex w-full items-center pr-2 py-2 pl-4",
//   focus: "text-white dark:text-blue-600 bg-blue-600 dark:bg-blue-500/20",
//   selected: "text-white dark:text-blue-600 bg-blue-500 dark:bg-blue-500/10",
// };

const optionStyles = {
  base: "text-slate-900 dark:text-slate-200 relative rounded-sm cursor-pointer flex w-full items-center pr-2 py-2 pl-4",
  focus: "bg-slate-50 dark:bg-slate-700",
  selected: "font-bold bg-slate-100 dark:bg-slate-800",
};

const menuStyles =
  "border p-1 overflow-hidden z-10 mt-2 top-full absolute w-full box-border rounded-md border bg-popover shadow-md";

const ClearIndicator = (props) => {
  return (
    <components.ClearIndicator {...props}>
      <X strokeWidth={2.5} className="w-5 h-5 p-0.5" />
    </components.ClearIndicator>
  );
};

const MultiValueRemove = (props) => {
  return (
    <components.MultiValueRemove {...props}>
      <X strokeWidth={2.5} className="w-6 h-6 py-[5px]" />
    </components.MultiValueRemove>
  );
};

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown strokeWidth={2.5} className="w-5 h-5 p-0.5" />
    </components.DropdownIndicator>
  );
};

const LoadingIndicator = () => {
  return (
    <Loader2 strokeWidth={2.5} className="h-5 w-5 animate-spin opacity-45" />
  );
};

const specificStyles = {
  menuPortal: () => ({ zIndex: 60 }),
};

const styleProxy = new Proxy(
  {},
  {
    get: (target, propKey) => {
      return target[propKey] ? target[propKey] : () => {};
    },
  }
);

export function Select({
  id,
  onChange,
  value,
  width: widthKey = "large",
  portalMenu,
  styles,
  ...props
}) {
  return (
    <ReactSelect
      inputId={id}
      value={value}
      onChange={(value) => {
        if (!value) {
          onChange(null);
        } else {
          onChange(value);
        }
      }}
      {...props}
      isMulti={false}
      unstyled
      // components={{ DropdownIndicator, ClearIndicator, MultiValueRemove }}
      classNames={{
        container: () => "relative",
        control: ({ isFocused }) =>
          cn(
            isFocused ? controlStyles.focus : controlStyles.nonFocus,
            controlStyles.base
          ),
        placeholder: () => placeholderStyles,
        input: () => selectInputStyles,
        valueContainer: () => singleValueContainerStyles,
        singleValue: () => singleValueStyles,
        multiValue: () => multiValueStyles,
        multiValueLabel: () => multiValueLabelStyles,
        multiValueRemove: () => multiValueRemoveStyles,
        indicatorsContainer: () => indicatorsContainerStyles,
        clearIndicator: () => clearIndicatorStyles,
        indicatorSeparator: () => indicatorSeparatorStyles,
        dropdownIndicator: () => dropdownIndicatorStyles,
        menu: () => menuStyles,
        groupHeading: () => groupHeadingStyles,
        option: ({ isFocused, isSelected }) =>
          cn(
            isFocused && optionStyles.focus,
            isSelected && optionStyles.selected,
            optionStyles.base
          ),
        noOptionsMessage: () => noOptionsMessageStyles,
      }}
      styles={styleProxy}
      components={{
        LoadingIndicator,
        MultiValueRemove,
        ClearIndicator,
        DropdownIndicator,
      }}
    />
  );
}

export function MultiSelect({
  id,
  onChange,
  value,
  width: widthKey = "large",
  portalMenu,
  styles,
  ...props
}) {
  return (
    <ReactSelect
      inputId={id}
      value={value}
      onChange={(value) => {
        if (!value) {
          onChange([]);
        } else if (Array.isArray(value)) {
          onChange(value);
        } else {
          onChange([value]);
        }
      }}
      {...props}
      isMulti
      unstyled
      classNames={{
        container: () => "relative",
        control: ({ isFocused }) =>
          cn(
            isFocused ? controlStyles.focus : controlStyles.nonFocus,
            controlStyles.base
          ),
        placeholder: () => placeholderStyles,
        input: () => selectInputStyles,
        valueContainer: ({ hasValue }) =>
          cn(hasValue ? multiValueContainerStyles : singleValueContainerStyles),
        singleValue: () => singleValueStyles,
        multiValue: () => multiValueStyles,
        multiValueLabel: () => multiValueLabelStyles,
        multiValueRemove: () => multiValueRemoveStyles,
        indicatorsContainer: () => indicatorsContainerStyles,
        clearIndicator: () => clearIndicatorStyles,
        indicatorSeparator: () => indicatorSeparatorStyles,
        dropdownIndicator: () => dropdownIndicatorStyles,
        menu: () => menuStyles,
        groupHeading: () => groupHeadingStyles,
        option: ({ isFocused, isSelected }) =>
          cn(
            isFocused && optionStyles.focus,
            isSelected && optionStyles.selected,
            optionStyles.base
          ),
        noOptionsMessage: () => noOptionsMessageStyles,
      }}
      styles={styleProxy}
      components={{
        LoadingIndicator,
        MultiValueRemove,
        ClearIndicator,
        DropdownIndicator,
      }}
    />
  );
}
