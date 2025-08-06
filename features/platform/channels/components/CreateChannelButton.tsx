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
    <CreateChannel />
  );
}