"use client";

import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CreateShop } from "./CreateShop";

interface CreateShopButtonProps {}

export function CreateShopButton({}: CreateShopButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleShopCreated = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['lists', 'Shop', 'items']
    });
  };

  return (
    <CreateShop
      onShopCreated={handleShopCreated}
      trigger={
        <Button
          variant="default"
          className="w-9 lg:w-auto relative lg:ps-12 rounded-lg"
        >
          <Store className="h-4 w-4" />
          <span className="hidden lg:inline">Create Shop</span>
        </Button>
      }
    />
  );
}