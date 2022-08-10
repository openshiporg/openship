import { useState, useEffect } from 'react';

export function Collapse({ component, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);
  return <>{component({ open, setOpen })}</>;
}
