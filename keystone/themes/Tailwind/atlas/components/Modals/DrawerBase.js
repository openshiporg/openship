import { Fragment, useRef } from "react";
import { Sheet } from "../../primitives/default/ui/sheet";

export const DrawerBase = ({
  children,
  initialFocusRef,
  onClose,
  onSubmit,
  width = "narrow",
  transitionState,
  ...props
}) => {
  const containerRef = useRef(null);

  const onKeyDown = (event) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Sheet tabIndex={-1} {...props}>
      {children}
    </Sheet>
  );
};
