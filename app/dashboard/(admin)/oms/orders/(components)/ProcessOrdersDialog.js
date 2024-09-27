import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@ui/dialog";
import { Button, buttonVariants } from "@ui/button";
import { Input } from "@ui/input";
import { Badge, BadgeButton } from "@ui/badge";
import { Plus, X, ChevronRight, ChevronDown } from "lucide-react";
import { OrderDetailsComponent } from "./OrderDetailsComponent";
import { cn } from "@keystone/utils/cn";
import { RiLoader2Fill } from "@remixicon/react";

export const ProcessOrdersDialog = ({
  isOpen,
  onClose,
  orders,
  onProcessOrders,
  processingOrders,
}) => {
  const [searchEntry, setSearchEntry] = useState("");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [removedOrders, setRemovedOrders] = useState([]);

  const ordersWithCart = orders;

  useEffect(() => {
    setSelectedOrders(ordersWithCart.map((order) => order.id));
  }, [ordersWithCart]);

  const filteredOrders = useMemo(() => {
    return ordersWithCart.filter((order) =>
      order.orderName.toLowerCase().includes(searchEntry.toLowerCase())
    );
  }, [ordersWithCart, searchEntry]);

  const handleRemoveOrder = (orderId) => {
    setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    setRemovedOrders((prev) => [...prev, orderId]);
  };

  const handleAddOrder = (orderId) => {
    setSelectedOrders((prev) => [...prev, orderId]);
    setRemovedOrders((prev) => prev.filter((id) => id !== orderId));
  };

  const handleProcessOrders = () => {
    onProcessOrders(selectedOrders);
  };

  const handleSearch = () => {
    const searchResults = ordersWithCart.filter((order) =>
      order.orderName.toLowerCase().includes(searchEntry.toLowerCase())
    );
    setSelectedOrders(searchResults.map((order) => order.id));
    setRemovedOrders(
      ordersWithCart
        .filter((order) => !searchResults.includes(order))
        .map((order) => order.id)
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Process Orders</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search orders..."
              className="input pr-10"
              value={searchEntry}
              onChange={(e) => setSearchEntry(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <div className="absolute right-2 top-2">
              <BadgeButton
                onClick={handleSearch}
                className="border text-xs py-0.5 uppercase tracking-wide font-medium"
              >
                Search
              </BadgeButton>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 flex-grow overflow-y-auto">
          <details open className="p-4 border rounded-lg bg-muted/40 group">
            <summary className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer">
              <div className="flex gap-3 items-center">
                <div
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "self-start p-1 transition-transform group-open:rotate-90"
                  )}
                >
                  <ChevronRight className="size-3" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col gap-1">
                    <text className="relative text-lg/5 font-medium">
                      Orders to be Processed
                    </text>
                    <div>
                      <Badge className="border text-[.7rem] py-0.5 uppercase tracking-wide font-medium">
                        {selectedOrders.length} ORDER
                        {selectedOrders.length !== 1 ? "S" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </summary>
            <div className="overflow-y-auto max-h-[30vh]">
              {filteredOrders.map(
                (order) =>
                  selectedOrders.includes(order.id) && (
                    <div
                      key={order.id}
                      className="border rounded-lg relative mt-2 bg-background ml-8"
                    >
                      <OrderDetailsComponent
                        order={order}
                        shopId={order.shop?.id}
                        onOrderAction={() => {}}
                        openEditDrawer={() => {}}
                        channels={[]}
                        loadingActions={{}}
                        isProcessDialog={true}
                        removeEditItemButton
                        renderButtons={() => (
                          <div className="flex gap-2">
                            {processingOrders.includes(order.id) && (
                              <Badge
                                color="zinc"
                                className="uppercase tracking-wide font-medium text-xs flex items-center gap-1.5 border py-0.5"
                              >
                                <RiLoader2Fill className="size-3.5 shrink-0 animate-spin" />
                                Processing
                              </Badge>
                            )}
                            <BadgeButton
                              color="red"
                              onClick={() => handleRemoveOrder(order.id)}
                              className="border p-1"
                            >
                              <X className="h-3 w-3" />
                            </BadgeButton>
                          </div>
                        )}
                      />
                    </div>
                  )
              )}
            </div>
          </details>

          <details open className="p-4 border rounded-lg bg-muted/40 group">
            <summary className="list-none outline-none [&::-webkit-details-marker]:hidden cursor-pointer">
              <div className="flex gap-3 items-center">
                <div
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "self-start p-1 transition-transform group-open:rotate-90"
                  )}
                >
                  <ChevronRight className="size-3" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-col gap-1">
                    <text className="relative text-lg/5 font-medium">
                      Removed Orders
                    </text>
                    <div>
                      <Badge
                        className="border text-[.7rem] py-0.5 uppercase tracking-wide font-medium"
                        color="red"
                      >
                        {removedOrders.length} ORDER
                        {removedOrders.length !== 1 ? "S" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </summary>
            <div className="overflow-y-auto max-h-[30vh]">
              {ordersWithCart
                .filter((order) => removedOrders.includes(order.id))
                .map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg opacity-75 mt-2 bg-background ml-8"
                  >
                    <OrderDetailsComponent
                      order={order}
                      shopId={order.shop?.id}
                      onOrderAction={() => {}}
                      openEditDrawer={() => {}}
                      channels={[]}
                      loadingActions={{}}
                      isProcessDialog={true}
                      removeEditItemButton
                      renderButtons={() => (
                        <BadgeButton
                          color="green"
                          onClick={() => handleAddOrder(order.id)}
                          className="border p-1"
                        >
                          <Plus className="h-3 w-3" />
                        </BadgeButton>
                      )}
                    />
                  </div>
                ))}
            </div>
          </details>
        </div>
        <DialogFooter>
          <Button variant="light" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleProcessOrders}
            disabled={selectedOrders.length === 0}
          >
            Process Orders
            <Badge className="ml-2 border py-0.5 px-1.5">
              {selectedOrders.length}
            </Badge>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
