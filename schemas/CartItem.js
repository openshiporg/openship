import {
  integer,
  text,
  relationship,
  virtual,
  float,
} from '@keystone-6/core/fields';
import { list } from '@keystone-6/core';
import { isSignedIn, rules, permissions } from '../access';
import { trackingFields } from './trackingFields';

export const CartItem = list({
  access: {
    // create: isSignedIn,
    // read: rules.canReadOrders,
    // update: rules.canUpdateOrders,
    // delete: rules.canUpdateOrders,
    operation: {
      create: isSignedIn,
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canUpdateOrders,
      delete: rules.canUpdateOrders,
    },
  },
  fields: {
    name: text(),
    image: text(),
    price: text(),
    quantity: integer(),
    productId: text(),
    variantId: text(),
    lineItemId: text(),
    sku: text(),
    url: text(),
    error: text(),
    purchaseId: text(),
    status: text(),
    order: relationship({ ref: 'Order.cartItems' }),
    trackingDetails: relationship({ ref: "TrackingDetail.cartItems", many: true }),
    user: relationship({
      ref: 'User.cartItems',
      hooks: {
        resolveInput: ({ context, resolvedData }) => {
          if (context?.session?.itemId) {
            return {
              connect: { id: context.session.itemId },
            };
          }
          return resolvedData.user;
        },
      },
    }),
    channel: relationship({ ref: 'Channel.cartItems' }),
    ...trackingFields,
  },
});
