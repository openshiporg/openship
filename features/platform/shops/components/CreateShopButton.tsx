"use client";

import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { CreateShop } from "./CreateShop";

interface CreateShopButtonProps {
  platforms: any[];
}

export function CreateShopButton({ platforms }: CreateShopButtonProps) {
  const router = useRouter();
  
  const handleShopCreated = () => {
    router.refresh();
  };

  return (
    <CreateShop
      platforms={platforms}
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