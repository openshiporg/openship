"use client";

import { Button } from "@/components/ui/button";
import { Tv } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CreateChannel } from "./CreateChannel";

interface CreateChannelButtonProps {
  platforms: any[];
}

export function CreateChannelButton({ platforms }: CreateChannelButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleChannelCreated = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['lists', 'Channel', 'items']
    });
  };

  return (
    <CreateChannel />
  );
}