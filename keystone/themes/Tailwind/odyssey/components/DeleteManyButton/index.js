import { Fragment, useMemo, useState } from "react";
import { gql, useMutation } from "@keystone-6/core/admin-ui/apollo";
import { useToasts } from "@keystone/components/Toast";
import { Button } from "@keystone/primitives/default/ui/button";
import { Loader2, Trash } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@keystone/primitives/default/ui/tooltip";
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
} from "@keystone/primitives/default/ui/alert-dialog";

export function DeleteManyButton({
  selectedItems,
  list,
  refetch,
  isDisabled,
  totalItems,
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

  return (
    <Fragment>
      <AlertDialog open={isOpen}>
        <AlertDialogTrigger asChild>
          <Button
            onClick={async () => {
              setIsOpen(true);
            }}
            variant="link"
            isLoading={deleteItemsState.loading}
            isDisabled={isDisabled}
            size="xs"
            className="text-red-500"
          >
            Delete {list.label}
          </Button>
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
              onClick={async () => {
                const { data, errors } = await deleteItems({
                  variables: {
                    where: [...selectedItems].map((id) => ({ id })),
                  },
                });

                console.log({ data, errors });

                const { successfulItems, unsuccessfulItems, successMessage } =
                  data[list.gqlNames.deleteManyMutationName].reduce(
                    (acc, curr) => {
                      if (curr) {
                        acc.successfulItems++;
                        acc.successMessage =
                          acc.successMessage === ""
                            ? (acc.successMessage += curr[list.labelField])
                            : (acc.successMessage += `, ${curr[list.labelField]
                              }`);
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
                  // Find out how many items failed to delete.
                  // Reduce error messages down to unique instances, and append to the toast as a message.
                  toasts.addToast({
                    tone: "negative",
                    title: `Failed to delete ${unsuccessfulItems} of ${data[list.gqlNames.deleteManyMutationName].length
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
                    title: `Deleted ${successfulItems} of ${data[list.gqlNames.deleteManyMutationName].length
                      } ${list.plural} successfully`,
                    message: successMessage,
                  });
                }

                setIsOpen(false);
                return refetch();
              }}
              disabled={deleteItemsState.loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteItemsState.loading && (
                <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
              )} Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* <AlertDialog
        // TODO: change the copy in the title and body of the modal
        isOpen={isOpen}
        title="Delete Confirmation"
        tone="negative"
        actions={{
          confirm: {
            label: "Delete",
            action: async () => {
              const { data, errors } = await deleteItems({
                variables: { where: [...selectedItems].map((id) => ({ id })) },
              });
            
              const { successfulItems, unsuccessfulItems, successMessage } =
                data[list.gqlNames.deleteManyMutationName].reduce(
                  (acc, curr) => {
                    if (curr) {
                      acc.successfulItems++;
                      acc.successMessage =
                        acc.successMessage === ""
                          ? (acc.successMessage += curr[list.labelField])
                          : (acc.successMessage += `, ${
                              curr[list.labelField]
                            }`);
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
                // Find out how many items failed to delete.
                // Reduce error messages down to unique instances, and append to the toast as a message.
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

              return refetch();
            },
          },
          cancel: {
            label: "Cancel",
            action: () => {
              setIsOpen(false);
            },
          },
        }}
      >
        Are you sure you want to delete {selectedItems.size}{" "}
        {selectedItems.size === 1 ? list.singular : list.plural}?
      </AlertDialog> */}
    </Fragment>
  );
}
