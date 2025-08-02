import { list } from '@keystone-6/core'
import { allOperations } from '@keystone-6/core/access'
import { float, integer, relationship, text, timestamp } from '@keystone-6/core/fields'

import { isSignedIn, permissions, rules } from '../access'
import { trackingFields } from './trackingFields'

export const CartItem = list({
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
      initialColumns: ['name', 'quantity', 'price', 'status', 'channel'],
    },
  },
  fields: {
    // Product information
    name: text({
      validation: { isRequired: true },
    }),
    image: text(),
    price: text(),
    quantity: integer(),
    
    // Product identifiers
    productId: text(),
    variantId: text(),
    sku: text(),
    lineItemId: text(),
    
    // Processing information
    url: text(),
    error: text({
      ui: {
        displayMode: 'textarea',
      },
    }),
    purchaseId: text(),
    status: text({ defaultValue: 'PENDING' }),
    
    // Relationships
    order: relationship({
      ref: 'Order.cartItems',
      ui: {
        displayMode: 'cards',
        cardFields: ['orderId', 'orderName'],
      },
    }),
    channel: relationship({
      ref: 'Channel.cartItems',
      ui: {
        displayMode: 'cards',
        cardFields: ['name', 'domain'],
      },
    }),
    trackingDetails: relationship({
      ref: 'TrackingDetail.cartItems',
      many: true,
    }),
    user: relationship({
      ref: 'User.cartItems',
    }),
    
    ...trackingFields
  },
})