"use client";

import * as React from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "@keystone/utils/cn";
import { Logo } from "@keystone/components/Logo";
import { MoreVerticalIcon } from "lucide-react";
import { Button } from "@keystone/primitives/default/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@keystone/primitives/default/ui/sheet";

export function MainNav({ items, children, sideData }) {
  const segment = useSelectedLayoutSegment();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex items-center">
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items?.map((item, index) => (
            <Link
              key={index}
              href={item.disabled ? "#" : item.href}
              className={cn(
                "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                item.href.startsWith(`/${segment}`)
                  ? "text-foreground"
                  : "text-foreground/60",
                item.disabled && "cursor-not-allowed opacity-80"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      ) : null}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button className="md:hidden px-0 h-7" variant="ghost">
            <MoreVerticalIcon className="w-4 h-4" />
          </Button>
        </SheetTrigger>
        <Link href="/" className="px-4 items-center space-x-2 md:flex">
          <Logo />
        </Link>
        <SheetContent
          side={"left"}
          className="w-3/5 sm:w-1/2 pt-8 px-2"
          onClick={() => setOpen(false)}
        >
          {sideData}
        </SheetContent>
      </Sheet>
    </div>
  );
}
