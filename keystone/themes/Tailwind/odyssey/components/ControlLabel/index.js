export const ControlLabel = ({
  children,
  className,
  control,
}) => {
  return (
    <div className="flex items-center space-x-2">
      {control}
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {children && (
          <div className="text-sm leading-tight ml-2 select-none">
            {children}
          </div>
        )}
      </label>
    </div>
  );
};
