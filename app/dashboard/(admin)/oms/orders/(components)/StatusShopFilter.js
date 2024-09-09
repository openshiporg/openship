// components/StatusShopFilter.js
import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { StatusBadge } from "./StatusBadge";

export const StatusShopFilter = ({ statuses, shops, orderCounts }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedStatus = searchParams
    .get("!status_is_i")
    ?.replace(/^"|"$/g, "");
  const selectedShop = searchParams.get("!shop_matches")?.replace(/^"|"$/g, "") || "ALL";

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (!params.get("!status_is_i")) {
      params.set("!status_is_i", `"PENDING"`);
      router.push(`${pathname}?${params.toString()}`, { shallow: true });
    }
  }, []);

  const handleStatusChange = (status) => {
    const params = new URLSearchParams(searchParams);
    if (status === selectedStatus) {
      params.delete("!status_is_i");
    } else {
      params.set("!status_is_i", `"${status}"`);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleShopChange = (shopId) => {
    const params = new URLSearchParams(searchParams);
    if (shopId !== "ALL") {
      params.set("!shop_matches", `"${shopId}"`);
    } else {
      params.delete("!shop_matches");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col divide-y">
      <div className="p-2">
        <h2 className="text-xs font-normal mb-2 text-muted-foreground">
          Status
        </h2>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <StatusBadge
              key={status}
              status={status}
              selectedStatus={selectedStatus}
              count={
                orderCounts ? orderCounts[`${status.toLowerCase()}Count`] : 0
              }
              onClick={handleStatusChange}
            />
          ))}
        </div>
      </div>
      <div className="p-2">
        <h2 className="text-xs font-normal mb-2 text-muted-foreground">
          Shops
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge
            key="ALL"
            color={selectedShop === "ALL" ? "sky" : "zinc"}
            className={`cursor-pointer uppercase tracking-wide border px-3 py-1 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
              selectedShop === "ALL" ? "opacity-100" : "opacity-70"
            }`}
            onClick={() => handleShopChange("ALL")}
          >
            All Shops
          </Badge>
          {shops.map((shop) => (
            <Badge
              key={shop.id}
              color={selectedShop === shop.id ? "sky" : "zinc"}
              className={`cursor-pointer uppercase tracking-wide border px-3 py-1 text-xs font-medium rounded-[calc(theme(borderRadius.lg)-1px)] ${
                selectedShop === shop.id ? "opacity-100" : "opacity-70"
              }`}
              onClick={() => handleShopChange(shop.id)}
            >
              {shop.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};