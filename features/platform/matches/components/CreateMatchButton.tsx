import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CreateMatchButtonProps {
  onClick: () => void;
}

export function CreateMatchButton({ onClick }: CreateMatchButtonProps) {
  return (
    <Button onClick={onClick}>
      <Plus className="mr-2 h-4 w-4" />
      Create Match
    </Button>
  );
}