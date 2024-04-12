import React, { useState } from "react";
import { Calendar as TailwindCalendar } from "@keystone/primitives/default/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@keystone/primitives/default/ui/popover";
import { Button } from "@keystone/primitives/default/ui/button";

export const Calendar = ({ ...props }) => {
  const [date, setDate] = useState(new Date());
  const indexOfMonday = 1; // Assuming you want to start the week on Monday

  return (
    <div className="p-2">
      <TailwindCalendar
        mode="single"
        selected={date}
        onSelect={setDate}
        weekStartsOn={indexOfMonday}
        {...props}
      />
    </div>
  );
};
