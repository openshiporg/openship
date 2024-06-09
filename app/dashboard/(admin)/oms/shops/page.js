"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@ui/breadcrumb";
import { ShopPlatforms } from "./(components)/ShopPlatforms";
import { Shops } from "./(components)/Shops";
import { CreateShop } from "./(components)/CreateShop";
import { EditItemDrawer } from "@keystone/themes/Tailwind/atlas/components/EditItemDrawer";

const ShopsPage = () => {
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
    <div className="flex flex-col gap-4 w-full">
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/oms">Order Management System</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>Shops</BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center justify-between">
        <div className="flex-col items-center mt-2">
          <h1 className="text-lg font-semibold md:text-2xl">Shops</h1>
          <p className="text-muted-foreground">
            Manage your shop platforms and shops
          </p>
        </div>
        <CreateShop />
      </div>
      <div className="flex gap-6">
        <div className="basis-96">
          <ShopPlatforms openDrawer={openDrawer} />
        </div>
        <div className="w-full">
          <Shops openDrawer={openDrawer} />
        </div>
      </div>
      {drawerState.listKey && drawerState.itemId && (
        <EditItemDrawer
          listKey={drawerState.listKey}
          itemId={drawerState.itemId}
          setOpen={() => setDrawerState({ platformId: null, listKey: null })}
          onSave={() => {
            // Refetch data or perform any other necessary action after save
            closeDrawer();
          }}
        />
      )}
    </div>
  );
};

export default ShopsPage;
