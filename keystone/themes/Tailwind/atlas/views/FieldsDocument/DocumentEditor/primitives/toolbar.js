import { createContext, forwardRef, useContext } from "react";

// Spacers and Separators
// ------------------------------

export const ToolbarSpacer = () => {
  return <span className="inline-block w-4" />;
};

export const ToolbarSeparator = () => {
  return <span className="inline-block self-stretch bg-gray-300 mx-1 w-px" />;
};


const directionToAlignment = {
  row: "center",
  column: "start",
};

const ToolbarGroupContext = createContext({ direction: 'row' });
const useToolbarGroupContext = () => useContext(ToolbarGroupContext);

export const ToolbarGroup = forwardRef(({ children, direction = 'row', ...props }, ref) => {
  return (
    <ToolbarGroupContext.Provider value={{ direction }}>
      <div
        ref={ref}
        className={`flex ${direction === 'row' ? 'flex-row' : 'flex-col'} items-${directionToAlignment[direction]} gap-1 h-full`}
        {...props}
      >
        {children}
      </div>
    </ToolbarGroupContext.Provider>
  );
});

export const ToolbarButton = forwardRef(({
  as: Tag = 'button',
  isDisabled,
  isPressed,
  isSelected,
  variant = 'default',
  ...props
}, ref) => {
  const extraProps = {};
  const { direction: groupDirection } = useToolbarGroupContext();

  if (Tag === 'button') {
    extraProps.type = 'button';
  }

  const variantClasses = {
    default: 'text-gray-800 hover:bg-gray-200 active:bg-gray-300',
    action: 'text-blue-600 hover:bg-blue-50 active:bg-blue-100',
    destructive: 'text-red-600 hover:bg-red-50 active:bg-red-100',
  };
  const style = variantClasses[variant];

  return (
    <Tag
      {...extraProps}
      ref={ref}
      disabled={isDisabled}
      data-pressed={isPressed}
      data-selected={isSelected}
      data-display-mode={groupDirection}
      className={`align-center bg-transparent border-0 rounded cursor-pointer flex font-medium h-8 whitespace-nowrap ${style} ${
        groupDirection === 'row' ? 'px-2' : 'px-4 w-full'
      } ${isDisabled ? 'text-gray-400 pointer-events-none' : ''}
      ${isPressed ? 'bg-gray-300' : ''}
      ${isSelected ? 'bg-gray-500 text-white' : ''}`}
      {...props}
    />
  );
});


export function KeyboardInTooltip({ children }) {
  return (
    <kbd className="m-0.5 px-1 rounded whitespace-pre">
      {children}
    </kbd>
  );
}
