"use client";

import React, { useState } from "react";

import { ChannelPlatformsMobile } from "./(components)/ChannelPlatforms";
import { Channels } from "./(components)/Channels";
import { CreateChannel } from "./(components)/CreateChannel";

import { EditItemDrawer } from "@keystone/themes/Tailwind/atlas/components/EditItemDrawer";

const sortOptions = [
  { name: "Most Popular", href: "#", current: true },
  { name: "Best Rating", href: "#", current: false },
  { name: "Newest", href: "#", current: false },
  { name: "Price: Low to High", href: "#", current: false },
  { name: "Price: High to Low", href: "#", current: false },
];

const ChannelsPage = () => {
  const [drawerState, setDrawerState] = useState({
    itemId: null,
    listKey: null,
  });

  const openDrawer = (itemId, listKey) => {
    setDrawerState({ itemId: itemId, listKey });
  };

  const closeDrawer = () => {
    setDrawerState({ itemId: null, listKey: null });
  };

  return (
    <div>
      <div>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between border-b pb-6 pt-8 gap-4">
            <h1 className="text-4xl font-bold tracking-tight">Channels</h1>
            <div className="flex gap-4 items-center">
              <div className="inline-flex">
                <ChannelPlatformsMobile openDrawer={openDrawer} />
              </div>
              <CreateChannel />
            </div>
          </div>

          <section className="pt-6">
            <Channels openDrawer={openDrawer} />
          </section>
        </main>
      </div>
      {drawerState.listKey && drawerState.itemId && (
        <EditItemDrawer
          listKey={drawerState.listKey}
          itemId={drawerState.itemId}
          closeDrawer={closeDrawer}
          open={drawerState.listKey && drawerState.itemId}
        />
      )}
    </div>
  );
};

export default ChannelsPage;
