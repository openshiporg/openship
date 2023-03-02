import { checkbox } from '@keystone-6/core/fields';

export const permissionFields = {
  canSeeOtherUsers: checkbox({
    label: 'User can query other users',
  }),
  canManageUsers: checkbox({
    label: 'User can Edit other users',
  }),
  canManageRoles: checkbox({
    label: 'User can CRUD roles',
  }),
  canSeeOtherOrders: checkbox({
    label: 'User can query other orders',
  }),
  canManageOrders: checkbox({
    label: 'User can CRUD orders',
  }),
  canSeeOtherShops: checkbox({
    label: 'User can query other shops',
  }),
  canManageShops: checkbox({
    label: 'User can CRUD shops',
  }),
  canSeeOtherChannels: checkbox({
    label: 'User can query other channels',
  }),
  canManageChannels: checkbox({
    label: 'User can CRUD channels',
  }),
  canSeeOtherMatches: checkbox({
    label: 'User can query other matches',
  }),
  canManageMatches: checkbox({
    label: 'User can CRUD matches',
  }),
  canSeeOtherLinks: checkbox({
    label: 'User can query other matches',
  }),
  canManageLinks: checkbox({
    label: 'User can CRUD matches',
  }),
};

// export type Permission = keyof typeof permissionFields;

export const permissionsList = Object.keys(
  permissionFields
);
