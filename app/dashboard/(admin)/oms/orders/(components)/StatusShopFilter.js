// components/StatusShopFilter.js
import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { RelationshipSelect } from "@keystone/themes/Tailwind/atlas/components/RelationshipSelect";
import { useList } from "@keystone/keystoneProvider";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";

export const StatusShopFilter = ({ statuses, orderCounts }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedStatus = searchParams
    .get("!status_is_i")
    ?.replace(/^"|"$/g, "");
  const selectedShop =
    searchParams.get("!shop_matches")?.replace(/^"|"$/g, "") || "ALL";

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

  const handleShopChange = (newValue) => {
    const params = new URLSearchParams(searchParams);
    if (newValue !== "ALL") {
      params.set("!shop_matches", `"${newValue}"`);
    } else {
      params.delete("!shop_matches");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const foreignList = useList("Shop");

  // const shopSelectState = {
  //   kind: "many",
  //   value: selectedShop === "ALL" ? [] : [{ id: selectedShop }],
  //   onChange: (newItems) => {
  //     handleShopChange(newItems.length > 0 ? newItems[0].id : "ALL");
  //   },
  // };

  const { filterValues, loading } = useRelationshipFilterValues({
    value: searchParams.get("!shop_matches")?.replace(/^"|"$/g, ""),
    list: foreignList,
  });
  const state = {
    kind: "many",
    value: filterValues,
    onChange: (newItems) => {
      const params = new URLSearchParams(searchParams);
      if (newItems.length > 0) {
        params.set("!shop_matches", `"${newItems.map((item) => item.id).join(",")}"`);
      } else {
        params.delete("!shop_matches");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
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
          Filter by shop
        </h2>
        {/* <div className="flex flex-wrap gap-2">
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
        </div> */}
        <RelationshipSelect
          controlShouldRenderValue
          list={foreignList}
          labelField="name" // Assuming the shop name field is called "name"
          searchFields={["name"]} // Adjust if there are other searchable fields
          isLoading={loading}
          // isDisabled={onChange === undefined}
          placeholder="Showing all shop orders"
          state={state}
        />
      </div>
    </div>
  );
};

function useRelationshipFilterValues({ value, list }) {
  const foreignIds = getForeignIds(value);
  const where = { id: { in: foreignIds } };

  const query = gql`
    query FOREIGNLIST_QUERY($where: ${list.gqlNames.whereInputName}!) {
      items: ${list.gqlNames.listQueryName}(where: $where) {
        id
        ${list.labelField}
      }
    }
  `;

  const { data, loading } = useQuery(query, {
    variables: {
      where,
    },
  });

  return {
    filterValues:
      data?.items?.map((item) => {
        return {
          id: item.id,
          label: item[list.labelField] || item.id,
        };
      }) || foreignIds.map((f) => ({ label: f, id: f })),
    loading: loading,
  };
}

function getForeignIds(value) {
  if (typeof value === "string" && value.length > 0) {
    return value.split(",");
  }
  return [];
}
