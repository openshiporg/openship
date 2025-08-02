import { list } from '@keystone-6/core'
import { allOperations } from '@keystone-6/core/access'
import { float, integer, relationship, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { trackingFields } from "./trackingFields";

export const LineItem = list({
  access: {
    operation: {
      create: isSignedIn,
      query: isSignedIn,
      update: isSignedIn,
      delete: permissions.canManageOrders,
    },
    filter: {
      query: rules.canReadOrders,
      update: rules.canManageOrders,
      delete: rules.canManageOrders,
    },
  },
  hooks: {
    resolveInput: {
      create: ({ operation, resolvedData, context }) => {
        // Auto-assign user if not provided
        if (!resolvedData.user && context.session?.itemId) {
          return {
            ...resolvedData,
            user: { connect: { id: context.session.itemId } },
          }
        }
        return resolvedData
      },
    },
  },
  ui: {
    listView: {
      initialColumns: ['name', 'quantity', 'price', 'order'],
    },
  },
  fields: {
    // Product information
    name: text({
      validation: { isRequired: true },
    }),
    image: text(),
    price: float(),
    quantity: integer(),
    
    // Product identifiers
    productId: text(),
    variantId: text(),
    sku: text(),
    lineItemId: text(),
    
    // Relationships
    order: relationship({
      ref: 'Order.lineItems',
      ui: {
        displayMode: 'cards',
        cardFields: ['orderId', 'orderName'],
      },
    }),
    user: relationship({
      ref: 'User.lineItems',
    }),
    
    ...trackingFields
  },
})