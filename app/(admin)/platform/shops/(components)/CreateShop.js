import React, { useMemo, useState } from "react";
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
import { Fields } from "@keystone/themes/Tailwind/orion/components/Fields";
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
import { GraphQLErrorNotice } from "@keystone/themes/Tailwind/orion/components/GraphQLErrorNotice";
import { SHOP_PLATFORMS_QUERY } from "./ShopPlatforms";
import { SHOPS_QUERY } from "./Shops";

const GET_SHOP_PLATFORM_DETAILS = gql`
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

export function getFilteredProps(props, modifications, defaultCollapse) {
  const fieldKeysToShow = modifications.map((mod) => mod.key);
  const breakGroups = modifications.reduce((acc, mod) => {
    if (mod.breakGroup) {
      acc.push(mod.breakGroup);
    }
    return acc;
  }, []);

  const newFieldModes = { ...props.fieldModes };

  Object.keys(props.fields).forEach((key) => {
    if (!fieldKeysToShow.includes(key)) {
      newFieldModes[key] = "hidden";
    } else {
      newFieldModes[key] = props.fieldModes[key] || "edit";
    }
  });

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

  const reorderedFields = modifications.reduce((obj, mod) => {
    obj[mod.key] = updatedFields[mod.key];
    return obj;
  }, {});

  const updatedGroups = props.groups.map((group) => {
    if (breakGroups.includes(group.label)) {
      return {
        ...group,
        fields: group.fields.filter(
          (field) => !fieldKeysToShow.includes(field.path)
        ),
      };
    }
    return {
      ...group,
      collapsed: defaultCollapse,
    };
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
    setIsDialogOpen(false);
  };

  const platformId = props.value.platform?.value?.value?.id;

  const filteredProps = useMemo(() => {
    const modifications = [
      { key: "platform", fieldMeta: { hideButtons: true } },
    ];
    return getFilteredProps(props, modifications);
  }, [props]);

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <Button variant="outline" onClick={handleDialogClose}>
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
  const { data, loading, error } = useQuery(SHOP_PLATFORMS_QUERY, {
    variables: {
      where: { OR: [] },
      take: 50,
      skip: 0,
    },
  });

  return (
    <Button
      onClick={() => setIsDialogOpen(true)}
      disabled={error || loading || data?.count === 0}
    >
      Create Shop
    </Button>
  );
}

export function FilteredFields({ platformId, props }) {
  const { data, loading, error } = useQuery(GET_SHOP_PLATFORM_DETAILS, {
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
  const { data, loading, error } = useQuery(GET_SHOP_PLATFORM_DETAILS, {
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
        `../../../../../shopAdapters/${platformData.oAuthFunction}`
      );

      const config = {
        apiKey: platformData.appKey,
        apiSecret: platformData.appSecret,
        redirectUri: platformData.callbackUrl,
        scopes: scopes(),
      };

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
      isLoading={state === "loading"}
      onClick={handleClick}
    >
      {platformData?.oAuthFunction && platformData?.oAuthCallbackFunction && platformData?.appKey && platformData?.appSecret
        ? `Install App on ${platformData.name}`
        : "Create Shop"}
    </Button>
  );
}
