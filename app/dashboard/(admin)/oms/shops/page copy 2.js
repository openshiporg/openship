"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, gql, useMutation } from "@keystone-6/core/admin-ui/apollo";
import { Button } from "@ui/button";
import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@ui/card";
import { Dialog, DialogContent, DialogTitle } from "@ui/dialog";
import { Input } from "@ui/input";
import { shopFunctions } from "../../../../../shopFunctions";
import { useForm } from "react-hook-form";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
import { DotFillIcon } from "@primer/octicons-react";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { useList } from "@keystone/keystoneProvider";

const SHOP_PLATFORMS_QUERY = gql`
  query GetShopPlatforms {
    shopPlatforms {
      id
      name
      key
    }
  }
`;

const SHOPS_QUERY = gql`
  query GetShops {
    shops {
      id
      name
      description
      platform {
        key
        name
      }
    }
  }
`;

const CREATE_SHOP_MUTATION = gql`
  mutation CreateShop($data: ShopCreateInput!) {
    createShop(data: $data) {
      id
    }
  }
`;

const CREATE_SHOP_PLATFORM_MUTATION = gql`
  mutation CreateShopPlatform($data: ShopPlatformCreateInput!) {
    createShopPlatform(data: $data) {
      id
    }
  }
`;

// Mock shopFunctions for testing purposes
const mockShopFunctions = {
  ...shopFunctions,
  testplatform1: () => import("../../../../../shopFunctions/shopify"),
  testplatform2: () => import("../../../../../shopFunctions/bigcommerce"),
  testplatform3: () => import("../../../../../shopFunctions/woocommerce"),
  testplatform4: () => import("../../../../../shopFunctions/shopify"),
  testplatform5: () => import("../../../../../shopFunctions/bigcommerce"),
  testplatform6: () => import("../../../../../shopFunctions/woocommerce"),
};

const ShopPlatforms = ({
  handlePlatformActivation,
  activePlatformKeys,
  setPlatformModal,
}) => {
  const [visiblePlatforms, setVisiblePlatforms] = useState(5);

  return (
    <nav
      className="pr-4 pt-3 fixed left-0 top-0 bottom-0 hidden md:w-64 lg:w-72 border-r h-screen border-zinc-200 md:left-auto md:shrink-0 z-10 md:!opacity-100 md:!block dark:border-zinc-800"
      // className="h-full border-r -mt-6 pt-6 pr-4 grid gap-3 text-sm text-muted-foreground"
    >
      <div className="flex flex-col gap-2">
        <div className="text-muted-foreground font-light uppercase tracking-wide text-xs">
          Shop Platforms
        </div>
        {Object.keys(mockShopFunctions)
          .slice(0, visiblePlatforms)
          .map((platformKey) => (
            <div key={platformKey} className="flex items-center gap-4">
              {activePlatformKeys?.includes(platformKey) ? (
                <Button
                  variant="secondary"
                  className="px-1 py-1 text-emerald-500"
                >
                  <DotFillIcon className="size-3" />
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="px-1 py-1"
                  onClick={() => handlePlatformActivation(platformKey)}
                >
                  <PlusIcon className="size-3" strokeWidth={2.5} />
                </Button>
              )}
              <Link
                className={`text-base font-normal ${
                  activePlatformKeys?.includes(platformKey)
                    ? "text-primary"
                    : "text-muted-foreground/80"
                }`}
                href="#"
              >
                {platformKey.charAt(0).toUpperCase() + platformKey.slice(1)}
              </Link>
            </div>
          ))}
        {visiblePlatforms < Object.keys(mockShopFunctions).length && (
          // <Button
          //   variant="light"
          //   onClick={() => setVisiblePlatforms((prev) => prev + 5)}
          //   className="-mt-2 shadow-none border-0 bg-gradient-to-b from-white to-zinc-50 dark:from-gray-950 dark:to-transparent"
          // >
          //   Show 5 more
          // </Button>

          <div
            onClick={() => setVisiblePlatforms((prev) => prev + 5)}
            className="cursor-pointer -mt-3 pt-3 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent dark:from-gray-950 dark:to-transparent" />
            <div className="flex justify-center">
              <button className="tracking-wide uppercase inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 dark:text-gray-50 dark:hover:bg-gray-700">
                <ChevronDownIcon className="h-4 w-4" />
                Show 5 More
              </button>
            </div>
          </div>
        )}
        <Button variant="secondary" onClick={() => setPlatformModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Custom Platform
        </Button>
      </div>
    </nav>
  );
};

const ShopForm = ({ fields, handleSubmit, loading }) => {
  const {
    register,
    handleSubmit: formSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form onSubmit={formSubmit(handleSubmit)}>
      {fields.map(({ name, title, placeholder, rightSection }) => (
        <div key={name} className="form-group">
          <label htmlFor={name}>{title}</label>
          <Input
            id={name}
            placeholder={placeholder}
            {...register(name, { required: true })}
            rightSection={rightSection}
            className={errors[name] ? "input-error" : ""}
          />
          {errors[name] && (
            <span className="error">This field is required</span>
          )}
        </div>
      ))}
      <Button type="submit" loading={loading}>
        Create Shop
      </Button>
    </form>
  );
};

const Shops = ({ shopsData }) => (
  <div className="grid gap-6">
    {shopsData?.shops.map((shop) => (
      <Card key={shop.id}>
        <CardHeader>
          <CardTitle>{shop.name}</CardTitle>
          <CardDescription>{shop.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{shop.name}</p>
              <p className="text-sm text-muted-foreground">
                {shop.platform?.name}
              </p>
            </div>
            <Button size="sm" variant="outline">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const ShopsPage = () => {
  const { data: shopPlatformsData } = useQuery(SHOP_PLATFORMS_QUERY);
  const { data: shopsData } = useQuery(SHOPS_QUERY);
  const [createShop] = useMutation(CREATE_SHOP_MUTATION);
  const [showModal, setShowModal] = useState(false);
  const [platformModal, setPlatformModal] = useState(false);
  const [type, setType] = useState("");
  const list = useList("ShopPlatform");
  const { state: createPlatformState, create } = useCreateItem(list);

  const handlePlatformActivation = async (platformKey) => {
    const platformName =
      platformKey.charAt(0).toUpperCase() + platformKey.slice(1);

    try {
      await create({
        name: platformName,
        key: platformKey,
        updateProductFunction: platformKey,
        getWebhooksFunction: platformKey,
        deleteWebhookFunction: platformKey,
        createWebhookFunction: platformKey,
        searchProductsFunction: platformKey,
        getProductFunction: platformKey,
        searchOrdersFunction: platformKey,
        addTrackingFunction: platformKey,
        addCartToPlatformOrderFunction: platformKey,
        oAuthFunction: platformKey,
      });
      console.log(`Activated platform: ${platformName}`);
    } catch (error) {
      console.error(`Failed to activate platform: ${platformKey}`, error);
    }
  };

  const handleCreateShop = async (values) => {
    setLoading(true);
    try {
      await createShop({ variables: { data: values } });
      setLoading(false);
      setShowModal(false);
      // refetch shops data or update UI accordingly
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const ShopForms = shopPlatformsData?.shopPlatforms.reduce((acc, platform) => {
    acc[platform.key] = {
      label: platform.name,
      fields: [
        { title: "Name", name: "name", placeholder: "Shop Name" },
        { title: "Domain", name: "domain", placeholder: "shopdomain.com" },
        {
          title: "Access Token",
          name: "accessToken",
          placeholder: "supersecret",
        },
      ],
      handleSubmit: (values) =>
        handleCreateShop({ platform: platform.key, ...values }),
    };
    return acc;
  }, {});

  const activePlatformKeys = shopPlatformsData?.shopPlatforms.map(
    (platform) => platform.key
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* <div className="mx-auto grid w-full max-w-6xl gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">Shops</h1>
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Shop
          </Button>
        </div>
      </div> */}
      {/* <div className="flex justify-between">
        <div className="flex-col items-center">
          <h1 className="text-lg font-semibold md:text-2xl">Shops</h1>
          <p className="text-muted-foreground">
            <span>Manage your platforms and shops</span>
          </p>
        </div>
        <div>
          <Button onClick={() => setShowModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Shop
          </Button>
        </div>
      </div> */}
      <div className="mx-auto grid w-full items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
        <ShopPlatforms
          handlePlatformActivation={handlePlatformActivation}
          activePlatformKeys={activePlatformKeys}
          setPlatformModal={setPlatformModal}
        />
        <Shops shopsData={shopsData} />
      </div>
      <Dialog open={platformModal} onOpenChange={setPlatformModal}>
        <DialogContent>
          <DialogTitle>Add Custom Platform</DialogTitle>
          {/* Add form for adding custom platform */}
        </DialogContent>
      </Dialog>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogTitle>Create Shop</DialogTitle>
          <select onChange={(e) => setType(e.target.value)} value={type}>
            {shopPlatformsData?.shopPlatforms.map((platform) => (
              <option key={platform.key} value={platform.key}>
                {platform.name}
              </option>
            ))}
          </select>
          {type && ShopForms[type] && (
            <ShopForm key={type} loading={loading} {...ShopForms[type]} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopsPage;
