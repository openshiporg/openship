export const Container = ({ children, ...props }) => (
  <div className="min-w-0 max-w-4xl" {...props}>
    {children}
  </div>
);
