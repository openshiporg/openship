import { permissionsList } from "./schemas/fields";
/*
  The basic level of access to the system is being signed in as a valid user. This gives you access
  to the Admin UI, access to your own User and Todo items, and read access to roles.
*/
export const isSignedIn = ({ session }) => !!session;

/*
  Permissions are shorthand functions for checking that the current user's role has the specified
  permission boolean set to true
*/
// export const permissions = {
//   //   canCreateTodos: ({ session }: ListAccessArgs) =>
//   //     !!session?.data.role?.canCreateTodos,
//   //   canManageAllTodos: ({ session }: ListAccessArgs) =>
//   //     !!session?.data.role?.canManageAllTodos,
//   canManageUsers: ({ session }: ListAccessArgs) =>
//     !!session?.data.role?.canManageUsers,
//   canManageRoles: ({ session }: ListAccessArgs) =>
//     !!session?.data.role?.canManageRoles,
//   canManageOrders: ({ session }: ListAccessArgs) =>
//     !!session?.data.role?.canManageOrders,
//   canManageShops: ({ session }: ListAccessArgs) =>
//     !!session?.data.role?.canManageShops,
//   canManageChannels: ({ session }: ListAccessArgs) =>
//     !!session?.data.role?.canManageChannels,
//   canManageMatches: ({ session }: ListAccessArgs) =>
//     !!session?.data.role?.canManageMatches,
// };

export const permissions = Object.fromEntries(
  permissionsList.map((permission) => [
    permission,
    function ({ session }) {
      return !!session?.data.role?.[permission];
    },
  ])
);

/*
  Rules are logical functions that can be used for list access, and may return a boolean (meaning
  all or no items are available) or a set of filters that limit the available items
*/
export const rules = {
  ownItem({ session }) {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 2. If not, do they own this item?
    return { user: { id: session?.itemId } };
  },
  canReadUsers: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    if (permissions.canSeeOtherUsers({ session })) {
      return true; // They can read everything!
    }
    // Can only see yourself
    return { id: { equals: session.itemId } };
  },
  canUpdateUsers: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    if (permissions.canManageUsers({ session })) {
      return true;
    }
    // Can update yourself
    return { id: { equals: session.itemId } };
  },
  canReadOrders: ({ session }) => {
    if (!isSignedIn({ session })) {
      return false;
    }
    if (permissions.canSeeOtherOrders({ session })) {
      return true; // They can read everything!
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canUpdateOrders: ({ session }) => {
    if (!isSignedIn({ session })) {
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageOrders({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session?.itemId } } };
  },
  canReadShops: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canSeeOtherShops({ session })) {
      return true; // They can read everything!
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canUpdateShops: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageShops({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canReadChannels: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canSeeOtherChannels({ session })) {
      return true; // They can read everything!
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canUpdateChannels: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageChannels({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canReadMatches: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canSeeOtherMatches({ session })) {
      return true; // They can read everything!
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canUpdateMatches: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageMatches({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canReadLinks: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canSeeOtherLinks({ session })) {
      return true; // They can read everything!
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
  canUpdateLinks: ({ session }) => {
    if (!session) {
      // No session? No Users.
      return false;
    }
    // 1. Do they have the permission of canManageProducts
    if (permissions.canManageLinks({ session })) {
      return true;
    }
    // 2. If not, do they own this item?
    return { user: { id: { equals: session.itemId } } };
  },
};
