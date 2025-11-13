import { useMemo } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Fields } from "@/features/dashboard/components/Fields";
import { getList } from "@/features/dashboard/actions/getList";
import { enhanceFields } from "@/features/dashboard/utils/enhanceFields";
import { useCreateItem } from "@/features/dashboard/utils/useCreateItem";

interface CreateItemDrawerProps {
  listKey: string;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => void;
}

// Inner component that ONLY renders when list is loaded - EXACT Keystone pattern
function CreateItemForm({
  list,
  enhancedFields,
  onCreate,
  onClose
}: {
  list: any;
  enhancedFields: Record<string, any>;
  onCreate: (data: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  // NOW we can safely call the hook because we know list and enhancedFields are loaded
  const createItem = useCreateItem(list, enhancedFields, { skipRevalidation: true });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createItem) return;

    const item = await createItem.create();
    if (item?.id) {
      onCreate(item);
      onClose();
    }
  };

  // This will never be null because we only render this component when data is ready
  if (!createItem) return null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-4">
        <Fields
          {...createItem.props}
          fields={enhancedFields}
          view="createView"
        />
      </div>

      <DrawerFooter className="flex-shrink-0">
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={createItem.state === 'loading'}>
            {createItem.state === 'loading' ? 'Creating...' : `Add ${list.singular}`}
          </Button>
        </div>
      </DrawerFooter>
    </form>
  );
}

export function CreateItemDrawer({ listKey, isOpen, onClose, onCreate }: CreateItemDrawerProps) {
  // Use SWR to fetch list data (same pattern as relationship field)
  const { data: list, error, isLoading } = useSWR(
    `list-${listKey}`,
    async () => await getList(listKey),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute,
    }
  );

  // Create enhanced fields like the create page does
  const enhancedFields = useMemo(() => {
    if (!list) return null;
    return enhanceFields(list.fields || {}, list.key);
  }, [list]);

  const handleCancel = () => {
    onClose();
  };

  // Show loading state
  if (isLoading) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Loading...</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-8 text-center">
            Loading form...
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Show error state if no list
  if (error || !list || !enhancedFields) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Error</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 py-8 text-center text-red-600">
            {error ? `Error loading ${listKey}: ${error.message}` : `Could not load form for ${listKey}`}
          </div>
          <DrawerFooter>
            <Button onClick={handleCancel}>Close</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // ONLY render the form component when list and enhancedFields are ready
  // This matches Keystone's pattern of conditionally rendering BuildItemDialog
  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle>Add {list.singular}</DrawerTitle>
          <DrawerDescription>
            Create a new {list.singular.toLowerCase()}
          </DrawerDescription>
        </DrawerHeader>

        <CreateItemForm
          list={list}
          enhancedFields={enhancedFields}
          onCreate={onCreate}
          onClose={onClose}
        />
      </DrawerContent>
    </Drawer>
  );
}
