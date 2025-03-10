import React, { useState } from "react";
import { useQuery } from "@keystone-6/core/admin-ui/apollo";
import { MoreVertical, Plus } from "lucide-react";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import {
  Badge,
  BadgeButton,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
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
      <div className="p-4">
        <h2 className="text-xs font-normal mb-3 text-muted-foreground">
          Platforms
        </h2>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-lg" />
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
    <div className="p-4">
      <h2 className="text-xs font-normal mb-3 text-muted-foreground">
        Platforms
      </h2>
      <div className="flex flex-wrap gap-2">
        <CreatePlatform
          refetch={refetch}
          trigger={
            <Button
              variant="secondary"
              className="border rounded-lg h-8 w-8"
            >
              <Plus />
              {platforms.length === 0 && "Create platform to get started"}
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
              size="icon"
              className="border [&_svg]:size-2.5 h-5 w-5"
              onClick={(e) => {
                e.stopPropagation();
                openDrawer(platform.id, "ShopPlatform");
              }}
            >
              <MoreVertical />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
