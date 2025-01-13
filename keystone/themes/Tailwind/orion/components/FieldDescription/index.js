export const FieldDescription = ({ id, children, ...props }) => {
  if (children === null) {
    return null;
  }

  return (
    <div className="-mt-1 mb-1 whitespace-pre-wrap text-xs text-muted-foreground/80" id={id} {...props}>
      {children}
    </div>
  );
};
