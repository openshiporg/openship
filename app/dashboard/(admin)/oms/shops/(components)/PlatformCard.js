import React, { useState } from "react";
import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import { EllipsisVertical, Plus } from "lucide-react";
import { Button } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/button";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { Skeleton } from "@ui/skeleton";
import { CreatePlatform } from "./CreatePlatform";
import { SHOP_PLATFORMS_QUERY } from "./ShopPlatforms";

export const PlatformCard = ({ openDrawer, setSelectedPlatform }) => {
  const [selectedPlatformId, setSelectedPlatformId] = useState(null);
  const { data, loading, error, refetch } = useQuery(SHOP_PLATFORMS_QUERY, {
    variables: { where: { OR: [] }, take: 50, skip: 0 },
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Platforms</h2>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div>Error loading platforms: {error.message}</div>;
  const platforms = data?.items || [];

  const handlePlatformClick = (platformId) => {
    if (selectedPlatformId === platformId) {
      setSelectedPlatformId(null);
      setSelectedPlatform(null);
    } else {
      setSelectedPlatformId(platformId);
      setSelectedPlatform(platformId);
    }
  };

  return (
    <div>
      <h2 className="text-xs font-normal mb-3 text-muted-foreground">
        Platforms
      </h2>
      <div className="flex flex-wrap gap-2">
        <CreatePlatform
          refetch={refetch}
          trigger={
            <Button variant="secondary" className="p-1.5">
              <Plus className="size-3.5" />
            </Button>
          }
        />

        {platforms.map((platform) => (
          <Badge
            key={platform.id}
            color={selectedPlatformId === platform.id ? "sky" : "zinc"}
            className={`cursor-pointer flex items-center justify-between gap-2 uppercase tracking-wide border pl-3 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
              selectedPlatformId === platform.id ? "opacity-100" : "opacity-70"
            }`}
            onClick={() => handlePlatformClick(platform.id)}
          >
            {platform.name}
            <Button
              variant="secondary"
              className="p-1"
              onClick={(e) => {
                e.stopPropagation();
                openDrawer(platform.id, "ShopPlatform");
              }}
            >
              <EllipsisVertical className="size-2" />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
