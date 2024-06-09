import React, { useMemo, useRef, useState } from "react";
import { useCreateItem } from "@keystone/utils/useCreateItem";
import { useList } from "@keystone/keystoneProvider";
import { Button } from "@ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ui/dialog";
import { Fields } from "@keystone/themes/Tailwind/atlas/components/Fields";
import { useQuery, gql } from "@apollo/client";
import { SHOPS_QUERY } from "./Shops";
import { GraphQLErrorNotice } from "@keystone/themes/Tailwind/atlas/components/GraphQLErrorNotice";
import { SHOP_PLATFORMS_QUERY } from "./ShopPlatforms";
const GET_PLATFORM_DETAILS = gql`
  query ($id: ID!) {
    shopPlatform(where: { id: $id }) {
      id
      name
      appKey
      appSecret
      callbackUrl
      oAuthFunction
      oAuthCallbackFunction
    }
  }
`;

export function getFilteredProps(props, modifications) {
  const fieldKeysToShow = modifications.map((mod) => mod.key);
  const breakGroups = modifications.reduce((acc, mod) => {
    if (mod.breakGroup) {
      acc.push(mod.breakGroup);
    }
    return acc;
  }, []);

  // Create a copy of fieldModes to manipulate
  const newFieldModes = { ...props.fieldModes };

  // Set the mode to 'hidden' for all fields except the ones in fieldKeysToShow
  Object.keys(props.fields).forEach((key) => {
    if (!fieldKeysToShow.includes(key)) {
      newFieldModes[key] = "hidden";
    } else {
      newFieldModes[key] = props.fieldModes[key] || "edit";
    }
  });

  // Update the fieldMeta based on modifications
  const updatedFields = Object.keys(props.fields).reduce((obj, key) => {
    const modification = modifications.find((mod) => mod.key === key);
    if (modification) {
      obj[key] = {
        ...props.fields[key],
        fieldMeta: {
          ...props.fields[key].fieldMeta,
          ...modification.fieldMeta,
        },
      };
    } else {
      obj[key] = props.fields[key];
    }
    return obj;
  }, {});

  // Reorder fields based on the order of the modifications array
  const reorderedFields = modifications.reduce((obj, mod) => {
    obj[mod.key] = updatedFields[mod.key];
    return obj;
  }, {});

  // Handle breaking out of groups if specified
  const updatedGroups = props.groups.map((group) => {
    if (breakGroups.includes(group.label)) {
      return {
        ...group,
        fields: group.fields.filter(
          (field) => !fieldKeysToShow.includes(field.path)
        ),
      };
    }
    return group;
  });

  return {
    ...props,
    fields: reorderedFields,
    fieldModes: newFieldModes,
    groups: updatedGroups,
  };
}

export function CreateShop() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const list = useList("Shop");
  const { create, props, state, error } = useCreateItem(list);
  const { refetch } = useQuery(SHOPS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });

  const handleDialogClose = () => {
    setIsDialogOpen(false); // Close dialog
  };

  const platformId = props.value.platform?.value?.value?.id;

  const filteredProps = useMemo(() => {
    const modifications = [
      { key: "platform", fieldMeta: { hideButtons: true } },
    ];
    return getFilteredProps(props, modifications);
  }, [props]);

  console.log({ filteredProps });

  const ref = useRef(null);
  return (
    <Dialog ref={ref} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <TriggerButton setIsDialogOpen={setIsDialogOpen} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Shop</DialogTitle>
          <DialogDescription>
            Select a platform and fill in the necessary fields
          </DialogDescription>
        </DialogHeader>
        {error && (
          <GraphQLErrorNotice
            networkError={error?.networkError}
            errors={error?.graphQLErrors}
          />
        )}
        <Fields {...filteredProps} />

        {platformId && <FilteredFields platformId={platformId} props={props} />}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="light" onClick={handleDialogClose}>
              Cancel
            </Button>
          </DialogClose>
          {platformId && (
            <CreateShopButton
              platformId={platformId}
              handleShopCreation={create}
              refetch={refetch}
              props={props}
              state={state}
              setIsDialogOpen={setIsDialogOpen}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TriggerButton({ setIsDialogOpen }) {
  const { data, loading, error, refetch } = useQuery(SHOP_PLATFORMS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });

  return (
    <Button
      // className="group flex items-center gap-0.5 whitespace-nowrap rounded-md bg-gradient-to-b from-white to-gray-200 px-4 py-2 font-semibold text-gray-900 ring-1 ring-inset ring-indigo-400/30 transition"
      onClick={() => setIsDialogOpen(true)}
      disabled={error || loading || data?.count === 0}
    >
      Create Shop
    </Button>
  );
}

export function FilteredFields({ platformId, props }) {
  const { data, loading, error } = useQuery(GET_PLATFORM_DETAILS, {
    variables: { id: platformId },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading platform data.</p>;

  const platformData = data?.shopPlatform;

  let modifications = [];

  if (platformData) {
    if (
      platformData.appKey &&
      platformData.appSecret &&
      platformData.oAuthFunction &&
      platformData.oAuthCallbackFunction
    ) {
      modifications = [{ key: "domain", breakGroup: "Credentials" }];
    } else {
      modifications = [
        { key: "name" },
        { key: "domain", breakGroup: "Credentials" },
        { key: "accessToken", breakGroup: "Credentials" },
      ];
    }
  }

  const filteredProps = getFilteredProps(props, modifications);

  if (!filteredProps.fields) return null;

  return (
    <div className="bg-muted/20 p-4 border rounded-lg overflow-auto max-h-[50vh]">
      <Fields {...filteredProps} />
    </div>
  );
}

export function CreateShopButton({
  platformId,
  handleShopCreation,
  refetch,
  props,
  state,
  setIsDialogOpen,
}) {
  const { data, loading, error } = useQuery(GET_PLATFORM_DETAILS, {
    variables: { id: platformId },
  });

  if (loading) return <Button disabled>Loading...</Button>;
  if (error) return <Button disabled>{JSON.stringify(error)}</Button>;

  const platformData = data?.shopPlatform;

  const handleClick = async () => {
    if (
      platformData?.appKey &&
      platformData?.appSecret &&
      platformData?.oAuthFunction &&
      platformData?.oAuthCallbackFunction
    ) {
      const { oauth, scopes } = await import(
        `../../../../../../shopFunctions/${platformData.oAuthFunction}`
      );

      const config = {
        apiKey: platformData.appKey,
        apiSecret: platformData.appSecret,
        redirectUri: platformData.callbackUrl,
        scopes: scopes(),
      };

      console.log(props.value);
      const domain = props.value.domain?.value?.inner?.value;
      oauth(domain, config);
    } else {
      const item = await handleShopCreation();
      if (item) {
        refetch();
        setIsDialogOpen(false);
      }
    }
  };

  return (
    <Button
      variant="primary"
      isLoading={state === "loading"}
      onClick={handleClick}
    >
      {platformData?.oAuthFunction &&
      platformData?.oAuthCallbackFunction &&
      platformData?.appKey &&
      platformData?.appSecret
        ? `Install App on ${platformData.name}`
        : "Create Shop"}
    </Button>
  );
}
