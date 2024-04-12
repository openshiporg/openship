import { Fragment } from "react";
import FocusLock from "react-focus-lock";
import { RemoveScroll } from "react-remove-scroll";
import { Blanket } from "./Blanket";
import { Dialog } from "@keystone/primitives/default/ui/dialog";

export const DialogBase = ({ children, isOpen, onClose, width, ...props }) => {
  const onKeyDown = (event) => {
    if (event.key === "Escape" && !event.defaultPrevented) {
      event.preventDefault();
      onClose();
    }
  };

  return isOpen ? (
    <Fragment>
      <Blanket onClick={onClose} />
      <FocusLock autoFocus returnFocus>
        <RemoveScroll enabled>
          <Dialog
            isOpen={isOpen}
            onClose={onClose}
            aria-modal="true"
            role="dialog"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            className={`fixed top-0 left-0 w-full h-full flex justify-center items-center ${width} custom-slide-in-animation`} // width and custom animation class
            {...props}
          >
            {children}
          </Dialog>
        </RemoveScroll>
      </FocusLock>
    </Fragment>
  ) : null;
};
