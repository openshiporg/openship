import { useKeystone } from "@keystone/keystoneProvider";
import { basePath } from "@keystone/index";
import { ChevronDown, Folders } from "lucide-react";
import { AdminLink } from "../AdminLink";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../primitives/default/ui/dropdown-menu";
import { Button } from "../../primitives/default/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";

// Try to import customNavItems, fallback to empty array if not found
let customNavItems = [];
try {
  const navItems = require("@keystone/index").customNavItems;
  if (navItems) customNavItems = navItems;
} catch (e) {
  // Project doesn't have customNavItems defined
}

export function ModelSwitcherDropdown({ type = "model", title }) {
  const {
    adminMeta: { lists },
  } = useKeystone();

  const renderableLists = Object.values(lists).filter((list) => {
    return !list.isHidden && !list.isSingleton;
  });

  const items =
    type === "model"
      ? renderableLists.map((list) => ({
          label: list.label,
          href: `/${list.path}`,
        }))
      : customNavItems.map((item) => ({
          label: item.title,
          href: `${item.href || item.url}`,
        }));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <>
          {title && <span className="mr-1">{title}</span>}
          <Button
            variant="outline"
            size="icon"
            className="h-5 w-5 [&_svg]:size-3 ml-1"
          >
            <Folders />
          </Button>
        </>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48 overflow-y-auto max-h-72"
      >
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <AdminLink href={item.href}>{item.label}</AdminLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
