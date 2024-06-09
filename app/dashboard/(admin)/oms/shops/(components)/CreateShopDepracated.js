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
import { useQuery, gql } from "@keystone-6/core/admin-ui/apollo";
// import {
//   Select,
//   SelectContent,
//   SelectGroup,
//   SelectItem,
//   SelectLabel,
//   SelectTrigger,
//   SelectValue,
// } from "@ui/select";
import Select from "react-select";

const GET_PLATFORM_DETAILS = gql`
  query ($id: ID!) {
    shopPlatform(where: { id: $id }) {
      id
      name
      appKey
      appSecret
      oAuthFunction
    }
  }
`;

export function CreateShop({ refetch }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  const options = [
    { value: "chocolate", label: "Chocolate" },
    { value: "strawberry", label: "Strawberry" },
    { value: "vanilla", label: "Vanilla" },
  ];
  const list = useList("Shop");
  const { create, props } = useCreateItem(list);

  const handleDialogClose = () => {
    setIsDialogOpen(false); // Close dialog
  };

  const platformId = props.value.platform?.value?.value?.id;

  // Filter out only the platform field
  const filteredProps = useMemo(() => {
    const fieldKeysToShow = ["platform"];
    const filteredFields = Object.keys(props.fields)
      .filter((key) => fieldKeysToShow.includes(key))
      .reduce((obj, key) => {
        obj[key] = props.fields[key];
        return obj;
      }, {});
    return { ...props, fields: filteredFields };
  }, [props]);

  console.log({ filteredProps });

  const ref = useRef(null);
  return (
    <Dialog ref={ref} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => setIsDialogOpen(true)}>Add Shop</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Shop</DialogTitle>
          <DialogDescription>
            Select a platform and fill in the necessary fields
          </DialogDescription>
        </DialogHeader>
        {/* <div className="bg-muted/20 p-4 border rounded-lg overflow-auto max-h-[50vh]"> */}
        {/* <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select> */}
        <Fields ref={ref.current} {...filteredProps} />
        {/* <Select
            menuPortalTarget={ref.current}
            defaultValue={selectedOption}
            onChange={setSelectedOption}
            options={options}
            styles={{
              menuPortal: (defaultStyles) => ({
                ...defaultStyles,
                zIndex: 9999,
                paddingBottom: "10px", // style the menu when it's portalled into the DOM node given to `menuPortalTarget`
              }),
            }}
          /> */}
        {/* </div> */}

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
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FilteredFields({ platformId, props }) {
  const { data, loading, error } = useQuery(GET_PLATFORM_DETAILS, {
    variables: { id: platformId },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error loading platform data.</p>;

  const platformData = data?.shopPlatform;

  const filteredProps = useMemo(() => {
    if (
      platformData?.appKey &&
      platformData?.appSecret &&
      platformData?.oAuthFunction
    ) {
      return {};
    }

    const fieldKeysToShow = ["name", "domain", "accessToken"];
    const filteredFields = Object.keys(props.fields)
      .filter((key) => fieldKeysToShow.includes(key))
      .reduce((obj, key) => {
        obj[key] = props.fields[key];
        return obj;
      }, {});
    return { ...props, fields: filteredFields };
  }, [props, platformId, platformData]);

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
      platformData?.oAuthFunction
    ) {
      const { oauth } = await import(
        `../../../../../../shopFunctions/${platformData.oAuthFunction}`
      );

      const config = {
        apiKey: platformData.appKey,
        apiSecret: platformData.appSecret,
        redirectUri: `${process.env.FRONTEND_URL}/api/o-auth/shop/callback/${platformData.id}`,
        scopes: platformData.scopes,
      };

      const domain = props.fields.domain.value.inner.value;
      oauth(domain, config);
    } else {
      await handleShopCreation();
      refetch();
    }
  };

  return (
    <Button variant="primary" onClick={handleClick}>
      {platformData?.oAuthFunction &&
      platformData?.appKey &&
      platformData?.appSecret
        ? `Install ${platformData.name} App`
        : "Create Shop"}
    </Button>
  );
}
