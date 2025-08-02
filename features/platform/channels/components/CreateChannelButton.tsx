"use client";

import { Button } from "@/components/ui/button";
import { Tv } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateChannel } from "./CreateChannel";

interface CreateChannelButtonProps {
  platforms: any[];
}

export function CreateChannelButton({ platforms }: CreateChannelButtonProps) {
  const router = useRouter();
  
  const handleChannelCreated = () => {
    router.refresh();
  };

  return (
    <CreateChannel
      platforms={platforms}
      onChannelCreated={handleChannelCreated}
      trigger={
        <Button
          variant="default"
          className="w-9 lg:w-auto relative lg:ps-12 rounded-lg"
        >
          <Tv className="h-4 w-4" />
          <span className="hidden lg:inline">Create Channel</span>
        </Button>
      }
    />
  );
}