import { useKeystone, useList } from "@keystone/keystoneProvider";
import { Drawer } from "../Modals";
import { Fields } from "../Fields";
import { GraphQLErrorNotice } from "../GraphQLErrorNotice";
import { LoadingIcon } from "../LoadingIcon";
import {
  useMutation,
  gql,
  useQuery,
  useApolloClient,
} from "@keystone-6/core/admin-ui/apollo";
import { useState, useMemo } from "react";
import {
  deserializeValue,
  makeDataGetter,
  useChangedFieldsAndDataForUpdate,
  useInvalidFields,
} from "@keystone-6/core/admin-ui/utils";
import { Button } from "@ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@ui/dialog";
import { useToasts } from "../Toast";
import { Trash, Trash2 } from "lucide-react";
import { DrawerBase } from "../Modals/DrawerBase";
import {
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../primitives/default/ui/sheet";
import { ScrollArea } from "../../primitives/default/ui/scroll-area";

function DeleteButton({ itemLabel, itemId, list, onClose }) {
  const toasts = useToasts();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteItem, { loading }] = useMutation(
    gql`mutation ($id: ID!) {
        ${list.gqlNames.deleteMutationName}(where: { id: $id }) {
          id
        }
      }`,
    { variables: { id: itemId } }
  );

  return (
    <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          onClick={() => setIsConfirmModalOpen(true)}
          className="h-7"
        >
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Confirmation</DialogTitle>
        </DialogHeader>
        <div className="text-sm">
          Are you sure you want to delete <strong>{itemLabel}</strong>?
        </div>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              variant="secondary"
              onClick={() => setIsConfirmModalOpen(false)}
            >
              Close
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            isLoading={loading}
            onClick={async () => {
              try {
                await deleteItem();
                setIsConfirmModalOpen(false); // Close the dialog after successful deletion
                if (onClose) onClose(); // Ensure onClose is called after closing the dialog
                return toasts.addToast({
                  title: itemLabel,
                  message: `Deleted ${list.singular} item successfully`,
                  tone: "positive",
                });
              } catch (err) {
                return toasts.addToast({
                  title: `Failed to delete ${list.singular} item: ${itemLabel}`,
                  message: err.message,
                  tone: "negative",
                });
              }
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetChangesButton({ onReset, disabled }) {
  const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
  return (
    <Dialog open={isConfirmModalOpen} onOpenChange={setConfirmModalOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled} className="h-7">
          Reset changes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Confirmation</DialogTitle>
        </DialogHeader>
        <text className="text-sm">Are you sure you want to reset changes?</text>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button
              variant="secondary"
              onClick={() => setConfirmModalOpen(false)}
            >
              Close
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              onReset();
              setConfirmModalOpen(false);
            }}
          >
            Reset Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditItemDrawer({ listKey, itemId, closeDrawer, open }) {
  const { createViewFieldModes } = useKeystone();
  const list = useList(listKey);
  const client = useApolloClient();

  const { data, error, loading } = useQuery(
    gql`
      query ($id: ID!) {
        item: ${list.gqlNames.itemQueryName}(where: { id: $id }) {
          id
          ${Object.keys(list.fields)
            .map((field) => list.fields[field].controller.graphqlSelection)
            .join("\n")}
        }
      }
    `,
    { variables: { id: itemId } }
  );

  const itemGetter = useMemo(
    () => makeDataGetter(data, error?.graphQLErrors).get("item"),
    [data, error]
  );

  const [state, setValue] = useState(() => ({
    value: deserializeValue(list.fields, itemGetter),
    item: itemGetter,
  }));

  if (data && state.item.data !== itemGetter.data) {
    setValue({
      value: deserializeValue(list.fields, itemGetter),
      item: itemGetter,
    });
  }

  const [update, { loading: updateLoading, error: updateError }] = useMutation(
    gql`
      mutation ($data: ${list.gqlNames.updateInputName}!, $id: ID!) {
        item: ${list.gqlNames.updateMutationName}(where: { id: $id }, data: $data) {
          id
        }
      }
    `
  );

  const { changedFields, dataForUpdate } = useChangedFieldsAndDataForUpdate(
    list.fields,
    state.item,
    state.value
  );
  const invalidFields = useInvalidFields(list.fields, state.value);

  const handleSave = async () => {
    if (invalidFields.size === 0) {
      await update({ variables: { data: dataForUpdate, id: itemId } });
      refetchListQuery();
      closeDrawer(); // Close the drawer
    }
  };

  const handleReset = () => {
    setValue({
      value: deserializeValue(list.fields, itemGetter),
      item: itemGetter,
    });
  };

  const refetchListQuery = async () => {
    await client.refetchQueries({
      include: "active",
    });
  };

  return (
    <DrawerBase
      onSubmit={handleSave}
      onClose={closeDrawer}
      onOpenChange={closeDrawer}
      width="narrow"
      open={open}
    >
      {/* <SheetTrigger asChild>{trigger}</SheetTrigger> */}
      <SheetContent className="flex flex-col">
        <SheetHeader className="border-b">
          <SheetTitle>Edit {list.singular}</SheetTitle>
          <SheetDescription>
            <div className="flex flex-col gap-4 -mt-1 -mb-3">
              <span>
                Use this form to edit this item. Click save when you're done
              </span>
              <div className="flex gap-2">
                <DeleteButton
                  itemLabel={itemGetter.get("label").data || itemId}
                  itemId={itemId}
                  list={list}
                  onClose={async () => {
                    await refetchListQuery(); // Ensure refetch is called
                    closeDrawer(); // Close the EditItemDrawer
                  }}
                />
                <ResetChangesButton
                  onReset={handleReset}
                  disabled={!changedFields.size}
                />
              </div>
            </div>
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="overflow-auto flex-grow">
          <div className="px-5">
            {createViewFieldModes.state === "error" && (
              <GraphQLErrorNotice
                networkError={
                  createViewFieldModes.error instanceof Error
                    ? createViewFieldModes.error
                    : undefined
                }
                errors={
                  createViewFieldModes.error instanceof Error
                    ? undefined
                    : createViewFieldModes.error
                }
              />
            )}
            {loading ? (
              <LoadingIcon label="Loading item data" />
            ) : (
              <>
                {updateError && (
                  <GraphQLErrorNotice
                    networkError={updateError?.networkError}
                    errors={updateError?.graphQLErrors}
                  />
                )}
                <Fields
                  fields={list.fields}
                  groups={list.groups}
                  fieldModes={
                    createViewFieldModes.state === "loaded"
                      ? createViewFieldModes.lists[listKey]
                      : null
                  }
                  value={state.value}
                  forceValidation={false}
                  invalidFields={invalidFields}
                  onChange={(getNewValue) => {
                    setValue((prev) => ({
                      ...prev,
                      value: getNewValue(prev.value),
                    }));
                  }}
                />
              </>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="flex justify-between gap-0 border-t p-2">
          <SheetClose asChild>
            <Button
              variant="secondary"
              onClick={() => {
                if (
                  !changedFields.size ||
                  window.confirm(
                    "There are unsaved changes, are you sure you want to exit?"
                  )
                ) {
                  closeDrawer();
                }
              }}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button
            disabled={updateLoading || !changedFields.size}
            isLoading={updateLoading}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </DrawerBase>
  );
}
