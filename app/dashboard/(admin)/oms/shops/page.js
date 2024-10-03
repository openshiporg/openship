"use client";

import React, { useState } from "react";
import { Shops } from "./(components)/Shops";
import { CreateShop } from "./(components)/CreateShop";
import { PlatformCard } from "./(components)/PlatformCard";
import { useDrawer } from "@keystone/themes/Tailwind/atlas/components/Modals/drawer-context";
import { Link } from "next-view-transitions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/breadcrumb";

const ShopsPage = () => {
  const { openEditDrawer } = useDrawer();
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  return (
    <main>
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink as={Link} href="/dashboard">
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Shops</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row mb-4 gap-2 justify-between">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">Shops</h1>
          <p className="text-muted-foreground">Manage shops and their products</p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateShop />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <PlatformCard
            openDrawer={openEditDrawer}
            setSelectedPlatform={setSelectedPlatform}
          />
        </div>
        <div>
          <Shops
            openDrawer={openEditDrawer}
            selectedPlatform={selectedPlatform}
          />
        </div>
      </section>
    </main>
  );
};

export default ShopsPage;