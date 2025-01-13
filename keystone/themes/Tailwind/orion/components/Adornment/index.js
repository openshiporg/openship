import { createContext, useContext } from "react";
import { forwardRefWithAs } from "@keystone/utils/forwardRefWithAs";

/**
 * What is this thing?
 * ------------------------------
 * We expose primitive components for adorning inputs with icons and buttons.
 * There's some awkard requirements surrounding size and shape that's best to
 * consolidate in one place.
 */

const AdornmentContext = createContext({
  shape: "square",
  size: "medium",
});
const useAdornmentContext = () => useContext(AdornmentContext);

export const AdornmentWrapper = ({ children, shape, size }) => {
  return (
    <AdornmentContext.Provider value={{ shape, size }}>
      <div className="items-center flex relative w-full">{children}</div>
    </AdornmentContext.Provider>
  );
};

// Adornment Element
// ------------------------------

const alignmentPaddingMap = {
  left: "marginLeft",
  right: "marginRight",
};

export const Adornment = forwardRefWithAs(
  ({ align, as: Tag = "div", ...props }, ref) => {
    // optical alignment shifts towards the middle of the container with the large
    // border radius on "round" inputs. use padding rather than margin to optimise
    // the hit-area of interactive elements

    return (
      <Tag
        ref={ref}
        className="items-center flex justify-center absolute top-0 left-0 rounded-md w-16 h-16 px-6"
        {...props}
      />
    );
  }
);
