import React, { useState } from "react";
import { Calendar as TailwindCalendar } from "../../primitives/default/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../primitives/default/ui/popover";
import { Button } from "../../primitives/default/ui/button";

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
