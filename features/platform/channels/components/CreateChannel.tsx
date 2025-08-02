"use client";
import React, { useMemo, useState } from "react";
import { useList } from "@/features/dashboard/hooks/useAdminMeta";
import { useCreateItem } from "@/features/dashboard/utils/useCreateItem";
import { enhanceFields } from "@/features/dashboard/utils/enhanceFields";
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button";
import { CirclePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Fields } from "@/features/dashboard/components/Fields";
import { getFilteredProps } from "../../shops/components/CreatePlatform";

export function CreateChannel() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  const { list } = useList('Channel');

  // Create enhanced fields like Keystone does
  const enhancedFields = useMemo(() => {
    if (!list?.fields) return {}
    return enhanceFields(list.fields, list.key)
  }, [list?.fields, list?.key])

  // Use the create item hook with enhanced fields
  const createItem = useCreateItem(list, enhancedFields);
  
  if (!createItem) return null;

  const handleChannelCreation = async () => {
    const item = await createItem.create()
    if (item?.id) {
      setIsDialogOpen(false);
      // Use Next.js router to refresh the page properly
      router.refresh();
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const filteredProps = useMemo(() => {
    if (!createItem) return null

    const modifications = [
      { key: "platform" },
      { key: "name" },
      { key: "domain" },
      { key: "accessToken" },
    ];

    return getFilteredProps(createItem.props, modifications, false);
  }, [createItem?.props]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          className={cn(
            buttonVariants({ size: "icon" }),
            "lg:px-4 lg:py-2 lg:w-auto rounded-lg"
          )}
        >
          <CirclePlus />
          <span className="hidden lg:inline">Create Channel</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Channel</DialogTitle>
          <DialogDescription>
            Connect a new sales channel to your platform
          </DialogDescription>
        </DialogHeader>

        {filteredProps && <Fields {...filteredProps} />}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleDialogClose}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={createItem.state === "loading"}
            onClick={handleChannelCreation}
          >
            {createItem.state === "loading" ? "Creating..." : "Create Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}