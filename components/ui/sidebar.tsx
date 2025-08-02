"use client";

import {
  ComponentProps,
  createContext,
  CSSProperties,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, VariantProps } from "class-variance-authority";
import { PanelLeftIcon, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useIsMobile } from "./use-mobile";

const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_LEFT = "16rem";
const SIDEBAR_WIDTH_RIGHT = "20rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarState = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
};

type SidebarContextProps = {
  left: SidebarState;
  right: SidebarState;
  isMobile: boolean;
};

const SidebarContext = createContext<SidebarContextProps | null>(null);
const SidebarInnerContext = createContext<"left" | "right" | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  const side = useContext(SidebarInnerContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  const currentSide = side || "left";

  return {
    ...context[currentSide],
    isMobile: context.isMobile,
    side: currentSide,
  };
}

function useSidebarWithSide(side: "left" | "right") {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return {
    ...context[side],
    isMobile: context.isMobile,
    side,
  };
}

function SidebarProvider({
  defaultOpenLeft = true,
  defaultOpenRight = true,
  openLeft: openLeftProp,
  openRight: openRightProp,
  onOpenChangeLeft: setOpenLeftProp,
  onOpenChangeRight: setOpenRightProp,
  defaultOpen,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: ComponentProps<"div"> & {
  defaultOpenLeft?: boolean;
  defaultOpenRight?: boolean;
  openLeft?: boolean;
  openRight?: boolean;
  onOpenChangeLeft?: (open: boolean) => void;
  onOpenChangeRight?: (open: boolean) => void;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();

  const [openMobileLeft, setOpenMobileLeft] = useState(false);
  const [_openLeft, _setOpenLeft] = useState(defaultOpen ?? defaultOpenLeft);
  const openLeft = openProp ?? openLeftProp ?? _openLeft;

  const [openMobileRight, setOpenMobileRight] = useState(false);
  const [_openRight, _setOpenRight] = useState(defaultOpenRight);
  const openRight = openRightProp ?? _openRight;

  const setOpenLeft = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(openLeft) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else if (setOpenLeftProp) {
        setOpenLeftProp(openState);
      } else {
        _setOpenLeft(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}_left=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, setOpenLeftProp, openLeft],
  );

  const setOpenRight = useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(openRight) : value;
      if (setOpenRightProp) {
        setOpenRightProp(openState);
      } else {
        _setOpenRight(openState);
      }
      document.cookie = `${SIDEBAR_COOKIE_NAME}_right=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenRightProp, openRight],
  );

  const toggleSidebarLeft = useCallback(() => {
    return isMobile
      ? setOpenMobileLeft((open) => !open)
      : setOpenLeft((open) => !open);
  }, [isMobile, setOpenLeft]);

  const toggleSidebarRight = useCallback(() => {
    return isMobile
      ? setOpenMobileRight((open) => !open)
      : setOpenRight((open) => !open);
  }, [isMobile, setOpenRight]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT) {
          event.preventDefault();
          toggleSidebarLeft();
        } else if (event.key === "n") {
          event.preventDefault();
          toggleSidebarRight();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebarLeft, toggleSidebarRight]);

  const leftState: SidebarState = {
    state: openLeft ? "expanded" : "collapsed",
    open: openLeft,
    setOpen: setOpenLeft,
    openMobile: openMobileLeft,
    setOpenMobile: setOpenMobileLeft,
    toggleSidebar: toggleSidebarLeft,
  };

  const rightState: SidebarState = {
    state: openRight ? "expanded" : "collapsed",
    open: openRight,
    setOpen: setOpenRight,
    openMobile: openMobileRight,
    setOpenMobile: setOpenMobileRight,
    toggleSidebar: toggleSidebarRight,
  };

  const contextValue = useMemo<SidebarContextProps>(
    () => ({
      left: leftState,
      right: rightState,
      isMobile,
    }),
    [
      leftState.state,
      leftState.open,
      leftState.openMobile,
      rightState.state,
      rightState.open,
      rightState.openMobile,
      isMobile,
      setOpenLeft,
      setOpenRight,
      setOpenMobileLeft,
      setOpenMobileRight,
      toggleSidebarLeft,
      toggleSidebarRight,
    ],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-left": SIDEBAR_WIDTH_LEFT,
              "--sidebar-width-right": SIDEBAR_WIDTH_RIGHT,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-sidebar",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("Sidebar must be used within a SidebarProvider.");
  }

  const { state, openMobile, setOpenMobile } = context[side];
  const { isMobile } = context;

  if (collapsible === "none") {
    return (
      <SidebarInnerContext.Provider value={side}>
        <div
          data-slot="sidebar"
          data-side={side}
          className={cn(
            "flex h-full flex-col bg-sidebar text-sidebar-foreground",
            side === "left" ? "w-(--sidebar-width-left)" : "w-(--sidebar-width-right)",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SidebarInnerContext.Provider>
    );
  }

  if (isMobile) {
    return (
      <SidebarInnerContext.Provider value={side}>
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-slot="sidebar"
            data-mobile="true"
            className={cn(
              "bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden",
              side === "left" ? "w-(--sidebar-width-left)" : "w-(--sidebar-width-right)"
            )}
            style={
              {
                "--sidebar-width-left": SIDEBAR_WIDTH_MOBILE,
                "--sidebar-width-right": SIDEBAR_WIDTH_MOBILE,
              } as CSSProperties
            }
            side={side}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Sidebar</SheetTitle>
              <SheetDescription>Displays the mobile sidebar.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      </SidebarInnerContext.Provider>
    );
  }

  return (
    <SidebarInnerContext.Provider value={side}>
      <div
        className="group peer hidden text-sidebar-foreground md:block"
        data-state={state}
        data-collapsible={state === "collapsed" ? collapsible : ""}
        data-variant={variant}
        data-side={side}
        data-slot="sidebar"
      >
        <div
          data-slot="sidebar-gap"
          className={cn(
            "relative bg-transparent transition-[width] duration-200 ease-linear",
            side === "left" ? "w-(--sidebar-width-left)" : "w-(--sidebar-width-right)",
            "group-data-[collapsible=offcanvas]:w-0",
            "group-data-[side=right]:rotate-180",
            variant === "floating" || variant === "inset"
              ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
          )}
        />
        <div
          data-slot="sidebar-container"
          className={cn(
            "fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex",
            side === "left" 
              ? "w-(--sidebar-width-left) left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width-left)*-1)]"
              : "w-(--sidebar-width-right) right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width-right)*-1)]",
            variant === "floating" || variant === "inset"
              ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
              : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
            className,
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            data-slot="sidebar-inner"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm"
          >
            {children}
          </div>
        </div>
      </div>
    </SidebarInnerContext.Provider>
  );
}

function SidebarTrigger({
  className,
  onClick,
  side,
  icon,
  ...props
}: ComponentProps<typeof Button> & { side?: "left" | "right"; icon?: string }) {
  const contextSide = useContext(SidebarInnerContext);
  const targetSide = side || contextSide || "left";
  const { toggleSidebar } = useSidebarWithSide(targetSide);

  // Map string icons to components
  const getIconComponent = () => {
    switch (icon) {
      case "chat":
        return <MessagesSquare className="size-4" />;
      default:
        return (
          <PanelLeftIcon
            className={cn("size-4", {
              "rotate-180": targetSide === "right",
            })}
          />
        );
    }
  };

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      data-side={targetSide}
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      {getIconComponent()}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}

function SidebarRail({ className, ...props }: ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();

  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-sidebar",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({ className, ...props }: ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("h-8 w-full bg-background shadow-none", className)}
      {...props}
    />
  );
}

function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn(
        "mx-2 w-auto bg-sidebar-border dark:bg-sidebar-foreground/10",
        className,
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}

function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 ring-sidebar-ring outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button";

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );

  if (!tooltip) {
    return button;
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        // uncomment this if needed in the future
        // hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring outline-hidden transition-transform peer-hover/menu-button:text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground data-[state=open]:opacity-100 md:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  const width = useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as CSSProperties
        }
      />
    </div>
  );
}

function SidebarMenuSub({ className, ...props }: ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSubItem({ className, ...props }: ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
  useSidebarWithSide,
};
