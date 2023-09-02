import { relationship, text, checkbox } from "@keystone-6/core/fields";
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
          - [ ] when canEditOtherPeople is true, canSeeOtherPeople must be true
          - [ ] when canManagePeople is true, canEditOtherPeople and canSeeOtherPeople must be true
      - [ ] Extend the Admin UI with client-side validation based on the same set of rules
    */
  access: {
    operation: {
      create: permissions.canManageRoles,
      query: isSignedIn,
      update: permissions.canManageRoles,
      delete: permissions.canManageRoles,
    },
  },
  ui: {
    hideCreate: (args) => !permissions.canManageRoles(args),
    hideDelete: (args) => !permissions.canManageRoles(args),
    listView: {
      initialColumns: ["name", "assignedTo"],
    },
    itemView: {
      defaultFieldMode: (args) =>
        permissions.canManageRoles(args) ? "edit" : "read",
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
