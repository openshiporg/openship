// components/StatusShopFilter.js
import React, { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import { RelationshipSelect } from "@keystone/themes/Tailwind/orion/components/RelationshipSelect";
import { MultipleSelector } from "@keystone/themes/Tailwind/orion/primitives/default/ui/multi-select";
import { useList } from "@keystone/keystoneProvider";
import { gql, useQuery } from "@keystone-6/core/admin-ui/apollo";
import { cn } from "@keystone/utils/cn";

const Square = ({ className, children }) => (
  <span
    data-square
    className={cn(
      "flex size-5 items-center justify-center rounded text-xs font-medium",
      className
    )}
    aria-hidden="true"
  >
    {children}
  </span>
);

const statusColors = {
  PENDING: "bg-amber-400/20 text-amber-600 border-amber-300",
  INPROCESS: "bg-blue-400/20 text-blue-600 border-blue-300",
  AWAITING: "bg-purple-400/20 text-purple-600 border-purple-300",
  BACKORDERED: "bg-orange-400/20 text-orange-600 border-orange-300",
  CANCELLED: "bg-red-400/20 text-red-600 border-red-300",
  COMPLETE: "bg-green-400/20 text-green-600 border-green-300",
};

export const StatusShopFilter = ({ statuses, orderCounts }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedStatus = searchParams
    .get("!status_is_i")
    ?.replace(/^"|"$/g, "");

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

  const foreignList = useList("Shop");
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
        params.set(
          "!shop_matches",
          `"${newItems.map((item) => item.id).join(",")}"`
        );
      } else {
        params.delete("!shop_matches");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
  };

  const { data: shopsData } = useQuery(gql`
    query GetShops {
      shops {
        id
        name
      }
    }
  `);

  const shopOptions = React.useMemo(() => {
    return (shopsData?.shops || []).map((shop) => ({
      value: shop.id,
      label: shop.name,
    }));
  }, [shopsData]);

  const selectedShops = React.useMemo(() => {
    const shopIds = searchParams
      .get("!shop_matches")
      ?.replace(/^"|"$/g, "")
      ?.split(",")
      .filter(Boolean);
    if (!shopIds) return [];
    return shopOptions.filter((shop) => shopIds.includes(shop.value));
  }, [searchParams, shopOptions]);

  const handleShopSelectChange = (newValue) => {
    const params = new URLSearchParams(searchParams);
    if (newValue.length > 0) {
      params.set(
        "!shop_matches",
        `"${newValue.map((item) => item.value).join(",")}"`
      );
    } else {
      params.delete("!shop_matches");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="w-[200px]">
        <Select value={selectedStatus} onValueChange={handleStatusChange} className="h-8">
          <SelectTrigger className="h-9.5 rounded-lg text-sm font-medium tracking-wide ps-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_[data-square]]:shrink-0">
            <SelectValue placeholder="FILTER BY STATUS" />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
            <SelectGroup>
              <SelectLabel className="text-muted-foreground font-normal text-xs ps-2">Filter by status</SelectLabel>
              {statuses.map((status) => (
                <SelectItem key={status} value={status} className="text-xs font-medium">
                  <Square className={cn(statusColors[status], "border")}>
                    {orderCounts
                      ? orderCounts[`${status.toLowerCase()}Count`]
                      : 0}
                  </Square>
                  <span className="whitespace-normal break-words min-w-0 flex-1 uppercase tracking-wide ml-1">
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 flex gap-2">
        {/* <div className="flex-1 hidden">
          <RelationshipSelect
            controlShouldRenderValue
            list={foreignList}
            labelField="name"
            searchFields={["name"]}
            isLoading={loading}
            placeholder="Filter by shop"
            state={state}
          />
        </div> */}

        <div className="flex-1">
          <MultipleSelector
            value={selectedShops}
            onChange={handleShopSelectChange}
            options={shopOptions}
            placeholder="Filter by shop"
            className="h-8 rounded-lg"
            emptyIndicator={
              <p className="text-center text-sm text-muted-foreground">No shops found.</p>
            }
            loadingIndicator={
              <p className="text-center text-sm text-muted-foreground">Loading shops...</p>
            }
          />
        </div>
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
