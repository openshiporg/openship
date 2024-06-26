import * as TabsPrimitives from "@radix-ui/react-tabs";
import React from "react";
import { focusRing } from "./utils";
import { cn } from "@keystone/utils/cn";

const Tabs = (props) => {
  return <TabsPrimitives.Root {...props} />;
};
Tabs.displayName = "Tabs";

const TabsListVariantContext = React.createContext("line");

const variantStyles = {
  line: cn(
    // base
    "flex items-center justify-start border-b",
    // border color
    "border-zinc-200 dark:border-zinc-800"
  ),
  solid: cn(
    // base
    "inline-flex items-center justify-center rounded-md p-1",
    // border color
    // "border-zinc-200 dark:border-zinc-800",
    // background color
    "bg-zinc-100 dark:bg-zinc-800"
  ),
};

const TabsList = React.forwardRef(
  (
    { className, variant = "line", orientation = "horizontal", children, ...props },
    forwardedRef
  ) => (
    <TabsPrimitives.List
      ref={forwardedRef}
      className={cn(
        variantStyles[variant],
        orientation === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    >
      <TabsListVariantContext.Provider value={variant}>
        {children}
      </TabsListVariantContext.Provider>
    </TabsPrimitives.List>
  )
);
TabsList.displayName = "TabsList";

function getVariantStyles(tabVariant) {
  switch (tabVariant) {
    case "line":
      return cn(
        // base
        "-mb-px items-center justify-center whitespace-nowrap border-b-2 border-transparent px-3 pb-3 text-sm font-medium transition-all",
        // text color
        "text-zinc-500 dark:text-zinc-500",
        // hover
        "hover:text-zinc-500 hover:dark:text-zinc-400",
        // border hover
        "hover:border-zinc-500 hover:dark:border-zinc-400",
        // selected
        "data-[state=active]:border-zinc-500 data-[state=active]:text-zinc-500",
        "data-[state=active]:dark:border-zinc-400 data-[state=active]:dark:text-zinc-400",
        // disabled
        "disabled:pointer-events-none",
        "disabled:text-zinc-300 disabled:dark:text-zinc-700"
      );
    case "solid":
      return cn(
        // base
        "inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1 transition-all text-sm font-medium",
        // text color
        "text-zinc-500 dark:text-zinc-400",
        // hover
        "hover:text-zinc-700 hover:dark:text-zinc-200",
        // selected
        "data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow",
        "data-[state=active]:dark:bg-zinc-900 data-[state=active]:dark:text-zinc-50",
        // disabled
        "disabled:pointer-events-none disabled:text-zinc-400 disabled:dark:text-zinc-600 disabled:opacity-50"
      );
  }
}

const TabsTrigger = React.forwardRef(
  ({ className, children, ...props }, forwardedRef) => {
    const variant = React.useContext(TabsListVariantContext);
    return (
      <TabsPrimitives.Trigger
        ref={forwardedRef}
        className={cn(getVariantStyles(variant), focusRing, className)}
        {...props}
      >
        {children}
      </TabsPrimitives.Trigger>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(
  ({ className, ...props }, forwardedRef) => (
    <TabsPrimitives.Content
      ref={forwardedRef}
      className={cn("outline-none my-4", focusRing, className)}
      {...props}
    />
  )
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsContent, TabsList, TabsTrigger };