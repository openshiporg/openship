import { relationship, text } from "@keystone-6/core/fields";
import { list } from "@keystone-6/core";
import { isSignedIn, permissions } from "../access";
import { permissionFields } from "./fields";

export const Role = list({
  /*
      SPEC
      - [x] Block all public access
      - [x] Restrict edit access based on canManageRoles
      - [ ] Prevent users from deleting their own role
      - [ ] Add a pre-save hook that ensures some permissions are selected when others are:
          - [ ] when canEditOtherUsers is true, canSeeOtherUsers must be true
          - [ ] when canManageUsers is true, canEditOtherUsers and canSeeOtherUsers must be true
      - [ ] Extend the Admin UI with client-side validation based on the same set of rules
    */
  access: {
    operation: {
      query: isSignedIn,
      create: permissions.canManageRoles,
      update: permissions.canManageRoles,
      delete: permissions.canManageRoles,
    },
  },
  ui: {
    hideCreate: (args: any) => !permissions.canManageRoles({ session: args.session, context: args.context, listKey: 'Role', operation: 'create' }),
    hideDelete: (args: any) => !permissions.canManageRoles({ session: args.session, context: args.context, listKey: 'Role', operation: 'delete' }),
    listView: {
      initialColumns: ["name", "assignedTo"],
    },
    itemView: {
      defaultFieldMode: (args: any) =>
        permissions.canManageRoles({ session: args.session, context: args.context, listKey: 'Role', operation: 'update' }) ? "edit" : "read",
    },
  },
  fields: {
    /* The name of the role */
    name: text({ validation: { isRequired: true } }),
    ...permissionFields,
    assignedTo: relationship({
      ref: "User.role",
      many: true,
      ui: {
        itemView: { fieldMode: "read" },
      },
    }),
  },
});