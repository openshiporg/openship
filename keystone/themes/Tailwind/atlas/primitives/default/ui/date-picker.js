// Tremor Raw Date Picker [v0.0.1]

"use client";
import * as React from "react";
import * as PopoverPrimitives from "@radix-ui/react-popover";
import { RiCalendar2Fill } from "@remixicon/react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { tv } from "tailwind-variants";

import { cx, focusInput, focusRing, hasErrorInput } from "@/lib/utils";

import { Button } from "./button";
import { Calendar as CalendarPrimitive } from "./calendar";

//#region Trigger
// ============================================================================

const triggerStyles = tv({
  base: [
    // base
    "peer flex w-full cursor-pointer appearance-none items-center gap-x-2 truncate rounded-md border px-3 py-2 shadow-sm outline-none transition-all sm:text-sm",
    // background color
    "bg-white dark:bg-gray-950 ",
    // border color
    "border-gray-300 dark:border-gray-800",
    // text color
    "text-gray-900 dark:text-gray-50",
    // placeholder color
    "placeholder-gray-400 dark:placeholder-gray-500",
    // hover
    "hover:bg-gray-50 hover:dark:bg-gray-950/50",
    // disabled
    "disabled:pointer-events-none",
    "disabled:bg-gray-100 disabled:text-gray-400",
    "disabled:dark:border-gray-800 disabled:dark:bg-gray-800 disabled:dark:text-gray-500",
    // focus
    focusInput,
    // invalid (optional)
    // "aria-[invalid=true]:dark:ring-red-400/20 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-red-200 aria-[invalid=true]:border-red-500 invalid:ring-2 invalid:ring-red-200 invalid:border-red-500"
  ],
  variants: {
    hasError: {
      true: hasErrorInput,
    },
  },
});

const Trigger = React.forwardRef(
  ({ className, children, placeholder, hasError, ...props }, forwardedRef) => {
    return (
      <PopoverPrimitives.Trigger asChild>
        <button
          ref={forwardedRef}
          className={cx(triggerStyles({ hasError }), className)}
          {...props}
        >
          <RiCalendar2Fill className="size-5 shrink-0 text-gray-400 dark:text-gray-600" />
          <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-gray-900 dark:text-gray-50">
            {children ? (
              children
            ) : placeholder ? (
              <span className="text-gray-400 dark:text-gray-600">
                {placeholder}
              </span>
            ) : null}
          </span>
        </button>
      </PopoverPrimitives.Trigger>
    );
  }
);

Trigger.displayName = "DatePicker.Trigger";

//#region Popover
// ============================================================================

const CalendarPopover = React.forwardRef(
  ({ align, className, children, ...props }, forwardedRef) => {
    return (
      <PopoverPrimitives.Portal>
        <PopoverPrimitives.Content
          ref={forwardedRef}
          sideOffset={10}
          side="bottom"
          align={align}
          avoidCollisions
          onOpenAutoFocus={(e) => e.preventDefault()}
          className={cx(
            // base
            "relative z-50 w-fit rounded-md border text-sm shadow-xl shadow-black/[2.5%]", // widths
            "min-w-[calc(var(--radix-select-trigger-width)-2px)] max-w-[95vw]", // heights
            "max-h-[var(--radix-popover-content-available-height)]", // border color
            "border-gray-300 dark:border-gray-800", // background color
            "bg-white dark:bg-gray-950", // transition
            "will-change-[transform,opacity]",
            "data-[state=closed]:animate-hide",
            "data-[state=open]:data-[side=bottom]:animate-slideDownAndFade data-[state=open]:data-[side=left]:animate-slideLeftAndFade data-[state=open]:data-[side=right]:animate-slideRightAndFade data-[state=open]:data-[side=top]:animate-slideUpAndFade",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitives.Content>
      </PopoverPrimitives.Portal>
    );
  }
);

CalendarPopover.displayName = "DatePicker.CalendarPopover";

const PresetContainer = ({
  // Available preset configurations
  presets,

  // Event handler when a preset is selected
  onSelect,

  // Currently selected preset
  currentValue,
}) => {
  const isDateRangePresets = (preset) => {
    return "dateRange" in preset;
  };

  const isDatePresets = (preset) => {
    return "date" in preset;
  };

  const handleClick = (preset) => {
    if (isDateRangePresets(preset)) {
      onSelect(preset.dateRange);
    } else if (isDatePresets(preset)) {
      onSelect(preset.date);
    }
  };

  const compareDates = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const compareRanges = (range1, range2) => {
    const from1 = range1.from;
    const from2 = range2.from;

    let equalFrom = false;

    if (from1 && from2) {
      const sameFrom = compareDates(from1, from2);

      if (sameFrom) {
        equalFrom = true;
      }
    }

    const to1 = range1.to;
    const to2 = range2.to;

    let equalTo = false;

    if (to1 && to2) {
      const sameTo = compareDates(to1, to2);

      if (sameTo) {
        equalTo = true;
      }
    }

    return equalFrom && equalTo;
  };

  const matchesCurrent = (preset) => {
    if (isDateRangePresets(preset)) {
      const value = currentValue;

      return value && compareRanges(value, preset.dateRange);
    } else if (isDatePresets(preset)) {
      const value = currentValue;

      return value && compareDates(value, preset.date);
    }

    return false;
  };

  return (
    <ul role="list" className="flex items-start gap-x-2 sm:flex-col">
      {presets.map((preset, index) => {
        return (
          <li key={index} className="sm:w-full sm:py-px">
            <button
              title={preset.label}
              className={cx(
                // base
                "relative w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border px-2.5 py-1.5 text-left text-base shadow-sm outline-none transition-all sm:border-none sm:py-2 sm:text-sm sm:shadow-none", // text color
                "text-gray-700 dark:text-gray-300", // border color
                "border-gray-300 dark:border-gray-800", // focus
                focusRing, // background color
                "focus-visible:bg-gray-100 focus-visible:dark:bg-gray-900",
                "hover:bg-gray-100 hover:dark:bg-gray-900",
                {
                  "bg-gray-100 dark:bg-gray-900": matchesCurrent(preset),
                }
              )}
              onClick={() => handleClick(preset)}
              aria-label={`Select ${preset.label}`}
            >
              <span>{preset.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

PresetContainer.displayName = "DatePicker.PresetContainer";

//#region Date Picker Shared
// ============================================================================

const formatDate = (date, locale) => {
  const formattedDate = format(date, "MMM d, yyyy", { locale });
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

const SingleDatePicker = ({
  defaultValue,
  value,
  onChange,
  presets,
  disabled,
  disabledDays,
  disableNavigation,
  className,
  placeholder = "Select date",
  hasError,
  translations,
  enableYearNavigation = false,
  locale = enUS,
  align = "center",
  ...props
}) => {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState(value ?? defaultValue ?? undefined);
  const [month, setMonth] = React.useState(date);

  const initialDate = React.useMemo(() => {
    return date;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    setDate(value ?? defaultValue ?? undefined);
  }, [value, defaultValue]);

  React.useEffect(() => {
    if (date) {
      setMonth(date);
    }
  }, [date]);

  React.useEffect(() => {
    if (!open) {
      setMonth(date);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onCancel = () => {
    setDate(initialDate);
    setOpen(false);
  };

  const onOpenChange = (open) => {
    if (!open) {
      onCancel();
    }

    setOpen(open);
  };

  const onDateChange = (date) => {
    const newDate = date;
    setDate(newDate);
  };

  const formattedDate = React.useMemo(() => {
    if (!date) {
      return null;
    }

    return formatDate(date, locale);
  }, [date, locale]);

  const onApply = () => {
    setOpen(false);
    onChange?.(date);
  };

  return (
    <PopoverPrimitives.Root open={open} onOpenChange={onOpenChange}>
      <Trigger
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        hasError={hasError}
        aria-required={props.required || props["aria-required"]}
        aria-invalid={props["aria-invalid"]}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
      >
        {formattedDate}
      </Trigger>
      <CalendarPopover align={align}>
        <div className="flex">
          <div className="flex flex-col sm:flex-row sm:items-start">
            {presets && presets.length > 0 && (
              <div
                className={cx(
                  "relative flex h-14 w-full items-center sm:h-full sm:w-40",
                  "border-b border-gray-300 sm:border-b-0 sm:border-r dark:border-gray-800",
                  "overflow-auto"
                )}
              >
                <div className="absolute px-2 pr-2 sm:inset-0 sm:left-0 sm:py-2">
                  <PresetContainer
                    currentValue={date}
                    presets={presets}
                    onSelect={onDateChange}
                  />
                </div>
              </div>
            )}
            <div>
              <CalendarPrimitive
                mode="single"
                month={month}
                onMonthChange={setMonth}
                selected={date}
                onSelect={onDateChange}
                disabled={disabledDays}
                locale={locale}
                enableYearNavigation={enableYearNavigation}
                disableNavigation={disableNavigation}
                initialFocus
                {...props}
              />
              <div className="flex items-center gap-x-2 border-t border-gray-300 p-3 dark:border-gray-800">
                <Button
                  variant="secondary"
                  className="h-8 w-full"
                  type="button"
                  onClick={onCancel}
                >
                  {translations?.cancel ?? "Cancel"}
                </Button>
                <Button
                  variant="primary"
                  className="h-8 w-full"
                  type="button"
                  onClick={onApply}
                >
                  {translations?.apply ?? "Apply"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CalendarPopover>
    </PopoverPrimitives.Root>
  );
};

const RangeDatePicker = ({
  defaultValue,
  value,
  onChange,
  presets,
  disabled,
  disableNavigation,
  disabledDays,
  enableYearNavigation = false,
  locale = enUS,
  placeholder = "Select date range",
  hasError,
  translations,
  align = "center",
  className,
  ...props
}) => {
  const [open, setOpen] = React.useState(false);
  const [range, setRange] = React.useState(value ?? defaultValue ?? undefined);
  const [month, setMonth] = React.useState(range?.from);

  const initialRange = React.useMemo(() => {
    return range;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  React.useEffect(() => {
    setRange(value ?? defaultValue ?? undefined);
  }, [value, defaultValue]);

  React.useEffect(() => {
    if (range) {
      setMonth(range.from);
    }
  }, [range]);

  React.useEffect(() => {
    if (!open) {
      setMonth(range?.from);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onRangeChange = (range) => {
    const newRange = range;
    setRange(newRange);
  };

  const onCancel = () => {
    setRange(initialRange);
    setOpen(false);
  };

  const onOpenChange = (open) => {
    if (!open) {
      onCancel();
    }

    setOpen(open);
  };

  const displayRange = React.useMemo(() => {
    if (!range) {
      return null;
    }

    return `${range.from ? formatDate(range.from, locale) : ""} - ${
      range.to ? formatDate(range.to, locale) : ""
    }`;
  }, [range, locale]);

  const onApply = () => {
    setOpen(false);
    onChange?.(range);
  };

  return (
    <PopoverPrimitives.Root open={open} onOpenChange={onOpenChange}>
      <Trigger
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        hasError={hasError}
        aria-required={props.required || props["aria-required"]}
        aria-invalid={props["aria-invalid"]}
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
      >
        {displayRange}
      </Trigger>
      <CalendarPopover align={align}>
        <div className="flex">
          <div className="flex flex-col overflow-x-scroll sm:flex-row sm:items-start">
            {presets && presets.length > 0 && (
              <div
                className={cx(
                  "relative flex h-16 w-full items-center sm:h-full sm:w-40",
                  "border-b border-gray-300 sm:border-b-0 sm:border-r dark:border-gray-800",
                  "overflow-auto"
                )}
              >
                <div className="absolute px-3 sm:inset-0 sm:left-0 sm:p-2">
                  <PresetContainer
                    currentValue={range}
                    presets={presets}
                    onSelect={onRangeChange}
                  />
                </div>
              </div>
            )}
            <div className="overflow-x-scroll">
              <CalendarPrimitive
                mode="range"
                selected={range}
                onSelect={onRangeChange}
                month={month}
                onMonthChange={setMonth}
                numberOfMonths={2}
                disabled={disabledDays}
                disableNavigation={disableNavigation}
                enableYearNavigation={enableYearNavigation}
                locale={locale}
                initialFocus
                className="overflow-x-scroll"
                classNames={{
                  months:
                    "flex flex-row divide-x divide-gray-300 dark:divide-gray-800 overflow-x-scroll",
                }}
                {...props}
              />
              <div className="border-t border-gray-300 p-3 sm:flex sm:items-center sm:justify-between dark:border-gray-800">
                <p className={cx("text-gray-900 dark:text-gray-50")}>
                  <span className="text-gray-700 dark:text-gray-300">
                    {translations?.range ?? "Range"}:
                  </span>{" "}
                  <span className="font-medium">{displayRange}</span>
                </p>
                <div className="mt-2 flex items-center gap-x-2 sm:mt-0">
                  <Button
                    variant="secondary"
                    className="h-8 w-full sm:w-fit"
                    type="button"
                    onClick={onCancel}
                  >
                    {translations?.cancel ?? "Cancel"}
                  </Button>
                  <Button
                    variant="primary"
                    className="h-8 w-full sm:w-fit"
                    type="button"
                    onClick={onApply}
                  >
                    {translations?.apply ?? "Apply"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CalendarPopover>
    </PopoverPrimitives.Root>
  );
};

//#region Preset Validation
// ============================================================================

const validatePresets = (presets, rules) => {
  const { toYear, fromYear, fromMonth, toMonth, fromDay, toDay } = rules;

  if (presets && presets.length > 0) {
    const fromYearToUse = fromYear;
    const toYearToUse = toYear;

    presets.forEach((preset) => {
      if ("date" in preset) {
        const presetYear = preset.date.getFullYear();

        if (fromYear && presetYear < fromYear) {
          throw new Error(
            `Preset ${preset.label} is before fromYear ${fromYearToUse}.`
          );
        }

        if (toYear && presetYear > toYear) {
          throw new Error(
            `Preset ${preset.label} is after toYear ${toYearToUse}.`
          );
        }

        if (fromMonth) {
          const presetMonth = preset.date.getMonth();

          if (presetMonth < fromMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label} is before fromMonth ${fromMonth}.`
            );
          }
        }

        if (toMonth) {
          const presetMonth = preset.date.getMonth();

          if (presetMonth > toMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label} is after toMonth ${toMonth}.`
            );
          }
        }

        if (fromDay) {
          const presetDay = preset.date.getDate();

          if (presetDay < fromDay.getDate()) {
            throw new Error(
              `Preset ${preset.label} is before fromDay ${fromDay}.`
            );
          }
        }

        if (toDay) {
          const presetDay = preset.date.getDate();

          if (presetDay > toDay.getDate()) {
            throw new Error(
              `Preset ${preset.label} is after toDay ${format(
                toDay,
                "MMM dd, yyyy"
              )}.`
            );
          }
        }
      }

      if ("dateRange" in preset) {
        const presetFromYear = preset.dateRange.from?.getFullYear();
        const presetToYear = preset.dateRange.to?.getFullYear();

        if (presetFromYear && fromYear && presetFromYear < fromYear) {
          throw new Error(
            `Preset ${preset.label}'s 'from' is before fromYear ${fromYearToUse}.`
          );
        }

        if (presetToYear && toYear && presetToYear > toYear) {
          throw new Error(
            `Preset ${preset.label}'s 'to' is after toYear ${toYearToUse}.`
          );
        }

        if (fromMonth) {
          const presetMonth = preset.dateRange.from?.getMonth();

          if (presetMonth && presetMonth < fromMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label}'s 'from' is before fromMonth ${format(
                fromMonth,
                "MMM, yyyy"
              )}.`
            );
          }
        }

        if (toMonth) {
          const presetMonth = preset.dateRange.to?.getMonth();

          if (presetMonth && presetMonth > toMonth.getMonth()) {
            throw new Error(
              `Preset ${preset.label}'s 'to' is after toMonth ${format(
                toMonth,
                "MMM, yyyy"
              )}.`
            );
          }
        }

        if (fromDay) {
          const presetDay = preset.dateRange.from?.getDate();

          if (presetDay && presetDay < fromDay.getDate()) {
            throw new Error(
              `Preset ${
                preset.dateRange.from
              }'s 'from' is before fromDay ${format(fromDay, "MMM dd, yyyy")}.`
            );
          }
        }

        if (toDay) {
          const presetDay = preset.dateRange.to?.getDate();

          if (presetDay && presetDay > toDay.getDate()) {
            throw new Error(
              `Preset ${preset.label}'s 'to' is after toDay ${format(
                toDay,
                "MMM dd, yyyy"
              )}.`
            );
          }
        }
      }
    });
  }
};

const DatePicker = ({ presets, ...props }) => {
  if (presets) {
    validatePresets(presets, props);
  }

  return <SingleDatePicker presets={presets} {...props} />;
};

DatePicker.displayName = "DatePicker";

const DateRangePicker = ({ presets, ...props }) => {
  if (presets) {
    validatePresets(presets, props);
  }

  return <RangeDatePicker presets={presets} {...props} />;
};

DateRangePicker.displayName = "DateRangePicker";

export { DatePicker, DateRangePicker };
