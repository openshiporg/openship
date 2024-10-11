// components/StatusBadge.js
import React from 'react';
import { Badge } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";

export const StatusBadge = ({ status, selectedStatus, count, onClick }) => {
  return (
    <Badge
      color={selectedStatus === status ? "sky" : "zinc"}
      className={`flex items-center gap-1.5 cursor-pointer uppercase tracking-wide border px-3 py-0.5 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
        selectedStatus === status ? "opacity-100" : "opacity-70"
      }`}
      onClick={() => onClick(status)}
    >
      {status}
      <span className="rounded-md py-[1px] px-1.5 -mr-2 bg-background border">
        {count}
      </span>
    </Badge>
  );
};