import { timestamp } from "@keystone-6/core/fields";

export const trackingFields = {
  createdAt: timestamp({
    access: { read: () => true, create: () => false, update: () => false },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: "hidden" },
      itemView: { fieldMode: "read" },
    },
  }),
  updatedAt: timestamp({
    access: { read: () => true, create: () => false, update: () => false },
    db: { updatedAt: true },
    validation: { isRequired: true },
    defaultValue: { kind: "now" },
    ui: {
      createView: { fieldMode: 'hidden' },
      itemView: { fieldMode: 'read' },
    },
  }),
};
