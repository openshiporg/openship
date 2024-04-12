import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import FocusLock from "react-focus-lock";

import { InputButton } from "@keystone/components/InputButton";
import { deserializeDate } from "@keystone/utils/deserializeDate";
import { formatDate } from "@keystone/utils/formatDate";
import { formatDateType } from "@keystone/utils/formatDateType";
import { dateFormatPlaceholder } from "@keystone/utils/dateFormatPlaceholder";
import { Calendar } from "@keystone/components/Calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@keystone/primitives/default/ui/popover";
import { Button } from "@keystone/primitives/default/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@keystone/utils/cn";

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
    <Fragment>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            onClick={() => setOpen(true)}
            className={cn(
              "text-md bg-muted w-[280px] justify-start text-left font-normal",
              !(formattedDate || dateFormatPlaceholder) &&
                "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formattedDate || dateFormatPlaceholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar onDayClick={handleDayClick} selected={selectedDay} />
        </PopoverContent>
      </Popover>
    </Fragment>
  );
};
