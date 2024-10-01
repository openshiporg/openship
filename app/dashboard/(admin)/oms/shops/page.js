"use client";

import React, { useState } from "react";
import { Shops } from "./(components)/Shops";
import { CreateShop } from "./(components)/CreateShop";
import { PlatformCard } from "./(components)/PlatformCard";
import { useDrawer } from "@keystone/themes/Tailwind/atlas/components/Modals/drawer-context";

const ShopsPage = () => {
  const { openEditDrawer } = useDrawer();
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  return (
    <div>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between border-b pb-6 pt-8 gap-4">
          <h1 className="text-4xl font-bold tracking-tight">Shops</h1>
          <div className="flex gap-4 items-center">
            <CreateShop />
          </div>
        </div>

        <section className="pt-6 flex flex-col gap-4">
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
    </div>
  );
};

export default ShopsPage;