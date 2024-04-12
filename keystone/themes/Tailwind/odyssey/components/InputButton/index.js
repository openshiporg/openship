import { forwardRef } from "react";
import { Adornment, AdornmentWrapper } from "@keystone/components/Adornment";

import { CalendarIcon, XIcon } from "lucide-react";

export const InputButton = forwardRef(
  ({ invalid = false, isSelected, onClear, ...props }, ref) => {
    return (
      <AdornmentWrapper shape="square" size="medium">
        <Button
          ref={ref}
          className={`cursor-pointer text-left ${
            invalid ? "border-red-500" : ""
          } ${isSelected ? "focus:ring focus:ring-indigo-300" : ""}`}
          type="button"
          {...props}
        />
        {onClear && <ClearButton onClick={onClear} />}
        <Adornment align="right" className="pr-2 pointer-events-none">
          <CalendarIcon color="dim" />
        </Adornment>
      </AdornmentWrapper>
    );
  }
);

const ClearButton = (props) => {
  return (
    <Adornment
      as="button"
      align="right"
      type="button"
      tabIndex={-1}
      className="align-center bg-transparent border-0 rounded-full flex justify-center outline-none p-0 right-6 top-6 hover:text-gray-500"
      {...props}
    >
      <span className="sr-only">clear date value</span>
      <XIcon size="small" />
    </Adornment>
  );
};
