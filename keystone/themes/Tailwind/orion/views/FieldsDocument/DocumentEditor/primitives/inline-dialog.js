import { forwardRef } from "react";
import { createPortal } from 'react-dom';

export const InlineDialog = forwardRef(({ isRelative, ...props }, ref) => {
  let dialog = <div ref={ref} contentEditable={false} {...props} />;

  if (isRelative || typeof document === 'undefined') {
    return dialog;
  }

  return createPortal(dialog, document.body);
});