"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, ArrowUpDown, PlusIcon, FilterIcon } from "lucide-react";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { PageBreadcrumbs } from "@keystone/themes/Tailwind/orion/components/PageBreadcrumbs";
import { AdminLink } from "@keystone/themes/Tailwind/orion/components/AdminLink";
import { CreateShop } from "./(components)/CreateShop";
import { PlatformCard } from "./(components)/PlatformCard";
import { Shops } from "./(components)/Shops";
import { useDrawer } from "@keystone/themes/Tailwind/orion/components/Modals/drawer-context";
import { FilterAdd } from "@keystone/themes/Tailwind/orion/components/FilterAdd";
import { RiBarChartFill } from "@remixicon/react";
import { useList } from "@keystone/keystoneProvider";
import { SortSelection } from "@keystone/themes/Tailwind/orion/components/SortSelection";
import { useSort } from "@keystone/utils/useSort";
import { Badge } from "@ui/badge";

export default function ShopsPage() {
  const { openEditDrawer } = useDrawer();
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [searchString, setSearchString] = useState("");
  const list = useList("Shop");
  const orderableFields = new Set(["name", "domain", "createdAt", "updatedAt"]);
  const sort = useSort(list, orderableFields);

  const EmptyState = () => (
    <div className="flex h-72 items-center justify-center rounded-lg border bg-muted">
      <div className="text-center">
        <RiBarChartFill
          className="mx-auto h-7 w-7 text-muted-foreground"
          aria-hidden={true}
        />
        <p className="mt-2 font-medium text-foreground">
          No shops connected
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect your e-commerce stores to start managing your inventory
        </p>
        <Button 
          onClick={() => document.querySelector('[aria-label="Create Shop"]')?.click()}
          className="mt-4"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Connect Shop
        </Button>
      </div>
    </div>
  );

  return (
    <section className="h-screen overflow-hidden flex flex-col">
      <PageBreadcrumbs
        items={[
          {
            type: "link",
            label: "Dashboard",
            href: "/",
          },
          {
            type: "page",
            label: "Platform",
            showModelSwitcher: true,
            switcherType: "platform",
          },
          {
            type: "page",
            label: "Shops",
          },
        ]}
      />

      <div className="flex flex-col flex-1 min-h-0">
        {/* Title Section */}
        <div className="flex flex-col p-4">
          <h1 className="text-2xl font-semibold">Shops</h1>
          <p className="text-muted-foreground">
            Create and manage your connected shops
          </p>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-2 px-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <form onSubmit={(e) => e.preventDefault()}>
              <Input
                type="search"
                className="pl-9 w-full h-9 rounded-lg placeholder:text-muted-foreground/80 text-sm shadow-sm"
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                placeholder="Search shops..."
              />
            </form>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <FilterAdd listKey="Shop" filterableFields={["platform", "status"]}>
              <Button
                variant="outline"
                size="icon"
                className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
              >
                <FilterIcon className="stroke-muted-foreground" />
                <span className="hidden lg:inline">Filter</span>
              </Button>
            </FilterAdd>

            <SortSelection list={list} orderableFields={orderableFields}>
              <Button
                variant="outline"
                size="icon"
                className="lg:px-4 lg:py-2 lg:w-auto rounded-lg"
              >
                <ArrowUpDown className="stroke-muted-foreground" />
                <span className="hidden lg:inline">
                  {sort ? (
                    <>
                      {list.fields[sort.field].label}{" "}
                      <Badge
                        variant="blue"
                        className="ml-1 text-[10px] px-1 py-0 font-medium"
                      >
                        {sort.direction}
                      </Badge>
                    </>
                  ) : (
                    "Sort"
                  )}
                </span>
              </Button>
            </SortSelection>

            <CreateShop />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="divide-y">
            <PlatformCard
              openDrawer={openEditDrawer}
              setSelectedPlatform={setSelectedPlatform}
            />
            <Shops
              openDrawer={openEditDrawer}
              selectedPlatform={selectedPlatform}
              searchString={searchString}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
