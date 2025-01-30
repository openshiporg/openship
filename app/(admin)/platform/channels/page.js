"use client";

import React, { useState } from "react";
import { Channels } from "./(components)/Channels";
import { CreateChannel } from "./(components)/CreateChannel";
import { PlatformCard } from "./(components)/PlatformCard";
import { useDrawer } from "@keystone/themes/Tailwind/orion/components/Modals/drawer-context";
import { PageBreadcrumbs } from "@keystone/themes/Tailwind/orion/components/PageBreadcrumbs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/breadcrumb";
import { AdminLink } from "@keystone/themes/Tailwind/orion/components/AdminLink";

const ChannelsPage = () => {
  const { openEditDrawer } = useDrawer();
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  return (
    <>
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
            label: "Channels",
          },
        ]}
      />
      <main className="max-w-4xl mx-auto w-full p-4 md:p-6">
        <div className="flex flex-col md:flex-row mb-4 gap-2 justify-between">
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">Channels</h1>
            <p className="text-muted-foreground">
              Manage channels and their products
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <CreateChannel />
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
            <Channels
              openDrawer={openEditDrawer}
              selectedPlatform={selectedPlatform}
            />
          </div>
        </section>
      </main>
    </>
  );
};

export default ChannelsPage;
