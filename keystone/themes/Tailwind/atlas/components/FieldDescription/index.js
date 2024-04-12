export const FieldDescription = ({ id, children, ...props }) => {
  if (children === null) {
    return null;
  }

  return (
    <div className="mb-2 min-w-32 whitespace-pre-wrap" id={id} {...props}>
      {children}
    </div>
  );
};
