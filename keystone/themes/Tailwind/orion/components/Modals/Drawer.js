import { Button } from "../../primitives/default/ui/button";
import { DrawerBase } from "./DrawerBase";
import {
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "../../primitives/default/ui/sheet";
import { ScrollArea } from "../../primitives/default/ui/scroll-area";
import { useState } from "react";

export const Drawer = ({
  actions,
  children,
  title,
  description,
  id,
  initialFocusRef,
  width = "narrow",
  trigger,
  isDrawerOpen,
  setIsDrawerOpen,
}) => {
  const { cancel, confirm } = actions;

  const safeClose = actions.confirm.loading ? () => {} : actions.cancel.action;

  return (
    <DrawerBase
      onSubmit={actions.confirm.action}
      onClose={safeClose}
      width={width}
      initialFocusRef={initialFocusRef}
      open={isDrawerOpen}
      onOpenChange={setIsDrawerOpen}
    >
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader className="border-b">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {description
              ? description
              : "Use this form to create an item of this type. Click save when you're done"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="overflow-auto flex-grow">
          <div className="px-5 py-2">{children}</div>
        </ScrollArea>
        <SheetFooter className="flex justify-between gap-2 border-t p-2">
          <SheetClose asChild>
            {cancel && (
              <Button
                onClick={safeClose}
                disabled={confirm.loading}
                variant="secondary"
              >
                {cancel.label}
              </Button>
            )}
          </SheetClose>
          {confirm && (
            <Button
              disabled={confirm.loading || confirm.disabled}
              isLoading={confirm.loading}
              onClick={(e) => {
                actions.confirm
                  .action()
                  .then(() => {
                    // Close the drawer only if the action is successful
                    setIsDrawerOpen(false);
                  })
                  .catch((error) => {
                    // Handle error if action fails
                    // The drawer remains open
                    console.error("Action failed:", error);
                  });
                e.preventDefault();
              }}
            >
              {confirm.label}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </DrawerBase>
  );
};
