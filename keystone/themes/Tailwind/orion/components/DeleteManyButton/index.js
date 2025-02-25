import { Fragment, useMemo, useState } from "react";
import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";
import { useToasts } from "../Toast";
import { Button } from "../../primitives/default/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../primitives/default/ui/alert-dialog";
import { BadgeButton } from "../../primitives/default/ui/badge";

export function DeleteManyButton({
  selectedItems,
  list,
  refetch,
  isDisabled,
  totalItems,
  children,
}) {
  const [deleteItems, deleteItemsState] = useMutation(
    useMemo(
      () => gql`
    mutation($where: [${list.gqlNames.whereUniqueInputName}!]!) {
      ${list.gqlNames.deleteManyMutationName}(where: $where) {
        id
        ${list.labelField}
      }
    }
`,
      [list]
    ),
    { errorPolicy: "all" }
  );
  const [isOpen, setIsOpen] = useState(false);
  const toasts = useToasts();

  const handleDelete = async () => {
    const { data, errors } = await deleteItems({
      variables: {
        where: [...selectedItems].map((id) => ({ id })),
      },
    });

    const { successfulItems, unsuccessfulItems, successMessage } =
      data[list.gqlNames.deleteManyMutationName].reduce(
        (acc, curr) => {
          if (curr) {
            acc.successfulItems++;
            acc.successMessage =
              acc.successMessage === ""
                ? (acc.successMessage += curr[list.labelField])
                : (acc.successMessage += `, ${curr[list.labelField]}`);
          } else {
            acc.unsuccessfulItems++;
          }
          return acc;
        },
        {
          successfulItems: 0,
          unsuccessfulItems: 0,
          successMessage: "",
        }
      );

    // If there are errors
    if (errors?.length) {
      toasts.addToast({
        tone: "negative",
        title: `Failed to delete ${unsuccessfulItems} of ${
          data[list.gqlNames.deleteManyMutationName].length
        } ${list.plural}`,
        message: errors
          .reduce((acc, error) => {
            if (acc.indexOf(error.message) < 0) {
              acc.push(error.message);
            }
            return acc;
          }, [])
          .join("\n"),
      });
    }

    if (successfulItems) {
      toasts.addToast({
        tone: "positive",
        title: `Deleted ${successfulItems} of ${
          data[list.gqlNames.deleteManyMutationName].length
        } ${list.plural} successfully`,
        message: successMessage,
      });
    }

    setIsOpen(false);
    return refetch();
  };

  return (
    <Fragment>
      <AlertDialog open={isOpen}>
        <AlertDialogTrigger>
          {typeof children === "function" 
            ? children({ 
                isOpen,
                setIsOpen,
                isLoading: deleteItemsState.loading,
                isDisabled,
                selectedCount: selectedItems.size,
                listLabel: list.label,
              })
            : children || (
                <Button
                  onClick={() => setIsOpen(true)}
                  isLoading={deleteItemsState.loading}
                  isDisabled={isDisabled}
                  variant="destructive"
                  size="sm"
                  className="text-xs h-6 uppercase font-medium tracking-wide"
                >
                  Delete {selectedItems.size} {list.label}
                </Button>
              )}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedItems.size}{" "}
              {selectedItems.size === 1 ? list.singular : list.plural}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsOpen(false);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteItemsState.loading}
              buttonProps={{
                variant: "destructive",
              }}
              isLoading={deleteItemsState.loading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Fragment>
  );
}
