export const Container = ({ children, ...props }) => (
  <div className="min-w-0 max-w-3xl" {...props}>
    {children}
  </div>
);
