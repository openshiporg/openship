import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../primitives/default/ui/breadcrumb";
import { Separator } from "../../primitives/default/ui/separator";
import { SidebarTrigger } from "../../primitives/default/ui/sidebar";
import { ModelSwitcherDropdown } from "../ModelSwitcherDropdown";
import { AdminLink } from "../AdminLink";

export function PageBreadcrumbs({ items }) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            {items.map((item, index) => (
              <React.Fragment key={index}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {item.type === "link" && (
                    <BreadcrumbLink>
                      <AdminLink href={item.href}>{item.label}</AdminLink>
                    </BreadcrumbLink>
                  )}
                  {item.type === "model" && (
                    <div className="flex items-center gap-1">
                      <BreadcrumbLink>
                        <AdminLink href={item.href}>{item.label}</AdminLink>
                      </BreadcrumbLink>
                      {item.showModelSwitcher && (
                        <ModelSwitcherDropdown type="model" />
                      )}
                    </div>
                  )}
                  {item.type === "page" && (
                    <div className="flex items-center gap-1">
                      {item.showModelSwitcher ? (
                        <ModelSwitcherDropdown
                          type={item.switcherType || "model"}
                          title={item.label}
                        />
                      ) : (
                        <BreadcrumbPage>{item.label}</BreadcrumbPage>
                      )}
                    </div>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
