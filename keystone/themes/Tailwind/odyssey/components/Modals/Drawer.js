import { Button } from "@keystone/primitives/default/ui/button";
import { DrawerBase } from "./DrawerBase";
import {
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@keystone/primitives/default/ui/sheet";
import { ScrollArea } from "@keystone/primitives/default/ui/scroll-area";
import { useState } from "react";

export const Drawer = ({
  actions,
  children,
  title,
  id,
  initialFocusRef,
  width = "narrow",
  trigger,
}) => {
  const [open, setOpen] = useState(false);

  const { cancel, confirm } = actions;

  const safeClose = actions.confirm.loading ? () => {} : actions.cancel.action;

  return (
    <DrawerBase
      onSubmit={actions.confirm.action}
      onClose={safeClose}
      width={width}
      initialFocusRef={initialFocusRef}
      open={open}
      onOpenChange={setOpen}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Use this form to create an item of this type. Click save when you're done.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="overflow-auto flex-grow">
          <div className="px-5">{children}</div>
        </ScrollArea>
        <SheetFooter className="flex justify-between border-t p-2">
          <SheetClose>
            {cancel && (
              <Button
                onClick={safeClose}
                disabled={confirm.loading}
                variant="outline"
              >
                {cancel.label}
              </Button>
            )}
          </SheetClose>
          {confirm && (
            <Button
              disabled={confirm.loading}
              isLoading={confirm.loading}
              onClick={(e) => {
                actions.confirm
                  .action()
                  .then(() => {
                    // console.log("then");
                    // Close the drawer only if the action is successful
                    setOpen(false);
                  })
                  .catch((error) => {
                    // Handle error if action fails
                    // The drawer remains open
                    console.error("Action failed:", error);
                  });
                e.preventDefault();
              }}
              color="blue"
              className="border shadow-sm"
            >
              {confirm.label}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </DrawerBase>
  );
};
