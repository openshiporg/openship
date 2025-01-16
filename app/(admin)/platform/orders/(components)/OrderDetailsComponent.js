import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/accordion";
import { Badge } from "@keystone/themes/Tailwind/orion/primitives/default/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@keystone/themes/Tailwind/orion/primitives/default/ui/dropdown-menu";
import { RiLoader2Fill } from "@remixicon/react";
import { ProductDetailsCollapsible } from "./ProductDetailsCollapsible";
import { ChannelSearchAccordion } from "./ChannelSearchAccordion";
import {
  PencilSquareIcon,
  Square2StackIcon,
  TicketIcon,
  TrashIcon,
} from "@heroicons/react/16/solid";
import { ChevronDown, MoreVertical, SaveIcon } from "lucide-react";
import {
  useDeleteItem,
  useUpdateItem,
} from "@keystone/themes/Tailwind/orion/components/EditItemDrawer";
import { AlertTriangle } from "lucide-react";
import { Button } from "@keystone/themes/Tailwind/orion/primitives/default/ui/button";
import { DeleteButton } from "@keystone/themes/Tailwind/orion/components/EditItemDrawer";
import { useList } from "@keystone/keystoneProvider";
import { useApolloClient } from "@keystone-6/core/admin-ui/apollo";

export const OrderDetailsComponent = ({
  order,
  shopId,
  onOrderAction,
  openEditDrawer,
  channels,
  loadingActions,
  removeEditItemButton,
  renderButtons,
}) => {
  const list = useList("Order");
  const client = useApolloClient();

  const handleAddToCart = (product, channelId) => {
    onOrderAction("addToCart", order.id, {
      channelId,
      image: product.image,
      name: product.title,
      price: product.price,
      productId: product.productId,
      variantId: product.variantId,
      quantity: product.quantity || 1,
    });
  };

  const { handleUpdate, updateLoading } = useUpdateItem("Order");

  const handleAcceptError = async () => {
    await handleUpdate(order.id, {
      orderError: "",
    });
  };

  const orderButtons = [
    {
      buttonText: "GET MATCH",
      color: "green",
      icon: <Square2StackIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("getMatch", order.id),
    },
    {
      buttonText: "SAVE MATCH",
      color: "teal",
      icon: <SaveIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("saveMatch", order.id),
    },
    {
      buttonText: "PLACE ORDER",
      color: "cyan",
      icon: <TicketIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("placeOrder", order.id),
    },
    {
      buttonText: "EDIT ORDER",
      color: "blue",
      icon: <PencilSquareIcon className="w-4 h-4" />,
      onClick: () => openEditDrawer(order.id, "Order"),
    },
    // "DELETE ORDER" button removed from here
  ];

  const currentAction = Object.entries(loadingActions).find(
    ([_, value]) => value[order.id]
  )?.[0];

  const getLoadingText = (action) => {
    switch (action) {
      case "getMatch":
        return "Getting Match";
      case "saveMatch":
        return "Saving Match";
      case "placeOrder":
        return "Placing Order";
      case "deleteOrder":
        return "Deleting Order";
      case "addToCart":
        return "Adding to cart";
      default:
        return "Loading";
    }
  };

  const handleDeleteComplete = async () => {
    await client.refetchQueries({ include: "active" });
    // Add any additional logic needed after deletion
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={order.orderId} className="border-0">
        <div className="px-4 py-2 flex justify-between w-full border-b">
          <div className="flex flex-col items-start text-left gap-1.5">
            <div className="flex items-center space-x-4">
              <a
                href={order.orderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="uppercase font-medium text-sm"
              >
                {order.orderName}
              </a>
              {/* {order.readyToProcess && (
                <Badge color="green" className="ml-2">
                  {order.readyToProcess}
                </Badge>
              )} */}
              <span className="text-xs font-medium opacity-65">
                {order.date}
              </span>

              <span className="text-xs font-medium text-muted-foreground">
                {order.shop?.name}
              </span>
            </div>
            <div className="text-sm opacity-75">
              <p>
                {order.firstName} {order.lastName}
              </p>
              <p>{order.streetAddress1}</p>
              {order.streetAddress2 && <p>{order.streetAddress2}</p>}
              <p>
                {order.city}, {order.state} {order.zip}
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-end space-x-2">
              {currentAction && (
                <Badge
                  color="zinc"
                  className="uppercase tracking-wide font-medium text-xs flex items-center gap-1.5 border py-0.5"
                >
                  <RiLoader2Fill className="size-3.5 shrink-0 animate-spin" />
                  {getLoadingText(currentAction)}
                </Badge>
              )}
              {!removeEditItemButton && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="border [&_svg]:size-3 h-6 w-6"
                    >
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {orderButtons.map((button) => (
                      <DropdownMenuItem
                        key={button.buttonText}
                        onClick={button.onClick}
                        className="text-muted-foreground flex gap-2 font-medium tracking-wide"
                        disabled={loadingActions[button.buttonText]?.[order.id]}
                      >
                        <span>{button.icon}</span>
                        {button.buttonText}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <AccordionTrigger hideArrow className="py-0">
                <Button
                  variant="secondary"
                  size="icon"
                  className="border [&_svg]:size-3 h-6 w-6"
                >
                  <ChevronDown />
                </Button>
              </AccordionTrigger>
              {renderButtons && renderButtons()}
            </div>
            {order.orderError && (
              <Badge
                color="red"
                className="flex flex-wrap gap-2 items-center border text-xs font-medium tracking-wide uppercase py-0.5 shadow-xs"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Error: {order.orderError}</span>
                <Button
                  variant="secondary"
                  className="text-muted-foreground flex items-center border bg-background -mr-1.5 py-0 px-1.5 text-[.6rem]"
                  onClick={handleAcceptError}
                  disabled={updateLoading}
                  isLoading={updateLoading}
                >
                  ACCEPT
                </Button>
              </Badge>
            )}
          </div>
        </div>
        <AccordionContent>
          <div className="divide-y">
            <ProductDetailsCollapsible
              orderId={order.id}
              title="Line Item"
              openEditDrawer={openEditDrawer}
              totalItems={order.lineItemsCount}
            />
            <ProductDetailsCollapsible
              orderId={order.id}
              title="Cart Item"
              openEditDrawer={openEditDrawer}
              totalItems={order.cartItemsCount}
            />
          </div>
          <ChannelSearchAccordion
            channels={channels}
            onAddItem={handleAddToCart}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
