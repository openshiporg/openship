import { checkbox } from '@keystone-6/core/fields';

export const permissionFields = {
  canSeeOtherUsers: checkbox({
    label: 'User can query other users',
  }),
  canEditOtherUsers: checkbox({
    label: 'User can edit other users',
  }),
  canManageUsers: checkbox({
    label: 'User can CRUD users',
  }),
  canManageRoles: checkbox({
    label: 'User can CRUD roles',
  }),
  canAccessDashboard: checkbox({
    label: 'User can access the dashboard',
  }),
  canSeeOtherShops: checkbox({
    label: 'User can query other shops',
  }),
  canManageShops: checkbox({
    label: 'User can CRUD shops',
  }),
  canCreateShops: checkbox({
    label: 'User can create shops',
  }),
  canSeeOtherChannels: checkbox({
    label: 'User can query other channels',
  }),
  canManageChannels: checkbox({
    label: 'User can CRUD channels',
  }),
  canCreateChannels: checkbox({
    label: 'User can create channels',
  }),
  canSeeOtherOrders: checkbox({
    label: 'User can query other orders',
  }),
  canManageOrders: checkbox({
    label: 'User can CRUD orders',
  }),
  canProcessOrders: checkbox({
    label: 'User can process orders',
  }),
  canSeeOtherMatches: checkbox({
    label: 'User can query other matches',
  }),
  canManageMatches: checkbox({
    label: 'User can CRUD matches',
  }),
  canCreateMatches: checkbox({
    label: 'User can create matches',
  }),
  canSeeOtherLinks: checkbox({
    label: 'User can query other links',
  }),
  canManageLinks: checkbox({
    label: 'User can CRUD links',
  }),
  canCreateLinks: checkbox({
    label: 'User can create links',
  }),
  canManagePlatforms: checkbox({
    label: 'User can manage platforms',
  }),
  canViewPlatformMetrics: checkbox({
    label: 'User can view platform metrics',
  }),
  canManageApiKeys: checkbox({
    label: 'User can manage API keys',
  }),
  canCreateApiKeys: checkbox({
    label: 'User can create API keys',
  }),
  canAccessAnalytics: checkbox({
    label: 'User can access analytics',
  }),
  canExportData: checkbox({
    label: 'User can export data',
  }),
  canManageWebhooks: checkbox({
    label: 'User can manage webhooks',
  }),
};

// export type Permission = keyof typeof permissionFields;

export const permissionsList = Object.keys(
  permissionFields
);