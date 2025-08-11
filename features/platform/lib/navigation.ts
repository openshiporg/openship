import {
  Store,
  Radio,
  Ticket,
  Sparkles,
  LucideIcon,
  ArrowRightLeft,
} from 'lucide-react';

export interface PlatformNavItem {
  title: string;
  href: string;
  color: string;
  description: string;
  icon?: LucideIcon;
}

export const platformNavItems: PlatformNavItem[] = [
  {
    title: 'Orders',
    href: '/platform/orders',
    color: 'blue',
    description: 'Process customer orders with automated linking, matching, and fulfillment.',
    icon: Ticket,
  },
  {
    title: 'Shops',
    href: '/platform/shops',
    color: 'green',
    description: 'Connect e-commerce platforms like Shopify, Openfront, BigCommerce to source products.',
    icon: Store,
  },
  {
    title: 'Channels',
    href: '/platform/channels',
    color: 'lime',
    description: 'Manage sales channels where products are listed and orders are received.',
    icon: Radio,
  },
  {
    title: 'Matches',
    href: '/platform/matches',
    color: 'purple',
    description: 'Map shop items to channel items for automated inventory synchronization.',
    icon: ArrowRightLeft,
  },
];

// Helper function to get platform nav items with full paths
export function getPlatformNavItemsWithBasePath(basePath: string) {
  return platformNavItems.map(item => ({
    ...item,
    href: `${basePath}${item.href}`,
  }));
}

// Helper function to get icon for a nav item by title
export function getIconForNavItem(title: string): LucideIcon {
  // Handle special cases first
  if (title === 'Onboarding') {
    return Sparkles;
  }
  
  const item = platformNavItems.find(navItem => navItem.title === title);
  return item?.icon || Store;
}