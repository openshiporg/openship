import { forwardRef } from "react";

export const Blanket = forwardRef((props, ref) => {
  return (
    <div
      ref={ref}
      className="fixed inset-0 bg-black bg-opacity-30 animate-in fadeIn duration-300"
      {...props}
    />
  );
});