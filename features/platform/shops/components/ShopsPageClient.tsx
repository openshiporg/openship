"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlatformWrapper } from "../../components/PlatformWrapper";
import { CreatePlatform } from "./CreatePlatform";
import { EditItemDrawerClientWrapper } from "@/features/platform/components/EditItemDrawerClientWrapper";
import { Plus } from "lucide-react";

interface Platform {
  id: string;
  name: string;
  shopsCount?: number;
}

interface ShopsPageClientProps {
  platforms: Platform[];
  totalCount: number;
}

export function ShopsPageClient({ platforms, totalCount }: ShopsPageClientProps) {
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingPlatformId, setEditingPlatformId] = useState<string | null>(null);
  const [showCreatePlatform, setShowCreatePlatform] = useState(false);
  const router = useRouter();

  const handleAddPlatform = () => {
    setShowCreatePlatform(true);
  };

  const handleEditPlatform = (platformId: string) => {
    setEditingPlatformId(platformId);
    setEditDrawerOpen(true);
  };


  const renderAddButton = () => (
    <CreatePlatform
      open={showCreatePlatform}
      onOpenChange={setShowCreatePlatform}
      trigger={
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Platform
        </div>
      }
    />
  );

  return (
    <>
      <PlatformWrapper
        platforms={platforms.map(p => ({ 
          id: p.id, 
          name: p.name, 
          count: p.shopsCount || 0 
        }))}
        totalCount={totalCount}
        onAddPlatform={handleAddPlatform}
        onEditPlatform={handleEditPlatform}
        renderAddButton={renderAddButton}
      />

      <EditItemDrawerClientWrapper
        listKey="shop-platforms"
        itemId={editingPlatformId || ""}
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingPlatformId(null);
        }}
        onSave={() => {
          router.refresh();
        }}
      />
    </>
  );
}