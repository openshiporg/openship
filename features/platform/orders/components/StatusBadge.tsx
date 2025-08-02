import { Badge } from "@/components/ui/badge";

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "emerald"
  },
  INPROCESS: {
    label: "In Process",
    color: "blue"
  },
  AWAITING: {
    label: "Awaiting",
    color: "purple"
  },
  BACKORDERED: {
    label: "Backordered",
    color: "orange"
  },
  CANCELLED: {
    label: "Cancelled",
    color: "red"
  },
  COMPLETE: {
    label: "Complete",
    color: "cyan"
  },
} as const;

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      color={statusConfig[status].color}
      className="text-[.6rem] sm:text-[.7rem] py-0 px-2 sm:px-3 tracking-wide font-medium rounded-md border h-6"
    >
      {status}
    </Badge>
  );
}