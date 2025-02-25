import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarIcon } from "lucide-react";

import { deserializeDate } from "@keystone/utils/deserializeDate";
import { formatDate } from "@keystone/utils/formatDate";
import { formatDateType } from "@keystone/utils/formatDateType";
import { dateFormatPlaceholder } from "@keystone/utils/dateFormatPlaceholder";
import { cn } from "@keystone/utils/cn";
import { Calendar } from "../Calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../primitives/default/ui/popover";
import { buttonVariants } from "../../primitives/default/ui/button";

export function useEventCallback(callback) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });
  return useCallback((...args) => callbackRef.current(...args), []);
}

export const DatePicker = ({
  value,
  onUpdate,
  onClear,
  onBlur: _onBlur,
  ...props
}) => {
  const [isOpen, _setOpen] = useState(false);
  const onBlur = useEventCallback(() => {
    _onBlur?.();
  });
  const setOpen = useCallback(
    (val) => {
      _setOpen(val);
      if (!val) {
        onBlur?.();
      }
    },
    [onBlur]
  );

  const handleDayClick = useCallback(
    (day) => {
      onUpdate(formatDateType(day));
      setTimeout(() => {
        setOpen(false);
      }, 300);
    },
    [onUpdate, setOpen]
  );

  const selectedDay = deserializeDate(value);
  const formattedDate = value ? formatDate(selectedDay) : undefined;

  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            onClick={() => setOpen(true)}
            className={cn(
              buttonVariants({ variant: "light" }),
              "text-base bg-muted/40 dark:bg-muted/40 h-10 font-normal border w-full shadow-sm justify-start dark:border-zinc-800 flex rounded-md border-input px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              !(formattedDate || dateFormatPlaceholder) &&
                "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedDate || "Select date"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar onDayClick={handleDayClick} selected={selectedDay} />
        </PopoverContent>
      </Popover>
    </div>
  );
};
