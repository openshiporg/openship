import React from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/accordion";
import { Badge } from "@keystone/themes/Tailwind/atlas/primitives/default/ui/badge";
import {
  Dropdown,
  DropdownButton,
  DropdownMenu,
  DropdownItem,
} from "@keystone/themes/Tailwind/atlas/primitives/default/ui/dropdown-menu";
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
} from "@keystone/themes/Tailwind/atlas/components/EditItemDrawer";

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
  const { handleDelete: deleteCartItem, deleteLoading: deleteCartItemLoading } =
    useDeleteItem("CartItem");
  const { handleUpdate: updateCartItem, updateLoading: updateCartItemLoading } =
    useUpdateItem("CartItem");

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
    {
      buttonText: "DELETE ORDER",
      color: "red",
      icon: <TrashIcon className="w-4 h-4" />,
      onClick: () => onOrderAction("deleteOrder", order.id),
    },
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

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={order.orderId} className="border-0">
        <div className="px-4 py-2 flex items-start justify-between w-full border-b">
          <div className="flex flex-col items-start text-left gap-1.5">
            <div className="flex items-center space-x-4">
              <span className="uppercase font-medium text-sm">
                {order.orderName}
              </span>
              <span className="text-xs font-medium opacity-65">
                {order.date}
              </span>
              {order.orderError && (
                <Badge color="red" className="text-xs">
                  Error
                </Badge>
              )}
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
          <div className="flex items-center space-x-2">
            {currentAction && (
              <Badge
                color="zinc"
                className="uppercase tracking-wide font-medium text-xs flex items-center gap-1.5 border py-0.5"
                >
                <RiLoader2Fill className="size-3.5 shrink-0 animate-spin" />
                {getLoadingText(currentAction)}
              </Badge>
            )}
            {renderButtons && renderButtons()}
            {!removeEditItemButton && (
              <Dropdown>
                <DropdownButton variant="secondary" className="border p-1">
                  <MoreVertical className="h-3 w-3" />
                </DropdownButton>
                <DropdownMenu anchor="bottom end">
                  {orderButtons.map((button) => (
                    <DropdownItem
                      key={button.buttonText}
                      onClick={button.onClick}
                      className="text-muted-foreground flex gap-2 font-medium tracking-wide"
                      disabled={loadingActions[button.buttonText]?.[order.id]}
                    >
                      <span>{button.icon}</span>
                      {button.buttonText}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            )}
            <AccordionTrigger hideArrow className="py-0">
              <Badge color="zinc" className="border p-1">
                <ChevronDown className="h-3 w-3" />
              </Badge>
            </AccordionTrigger>
          </div>
        </div>
        <AccordionContent>
          <div className="divide-y">
            <ProductDetailsCollapsible
              items={order.lineItems}
              title="Line Item"
              defaultOpen={true}
              openEditDrawer={openEditDrawer}
              removeEditItemButton={removeEditItemButton}
            />
            <ProductDetailsCollapsible
              items={order.cartItems}
              title="Cart Item"
              defaultOpen={true}
              openEditDrawer={openEditDrawer}
              removeEditItemButton={removeEditItemButton}
              updateItem={updateCartItem}
              deleteItem={deleteCartItem}
              updateLoading={updateCartItemLoading}
              deleteLoading={deleteCartItemLoading}
            />
          </div>
          {order.orderError && (
            <div className="flex items-center mt-1">
              <Badge color="red" className="text-xs mr-2">
                Error: {order.orderError}
              </Badge>
            </div>
          )}
          <ChannelSearchAccordion
            channels={channels}
            onAddItem={handleAddToCart}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
