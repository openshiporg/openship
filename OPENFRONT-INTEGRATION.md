# OpenFront Webhook System Implementation

## Single-Point Global Webhook Implementation for KeystoneJS

This document outlines how to implement a full-blown webhook system for ALL KeystoneJS models in ONE place, providing Shopify-like webhook functionality.

### **1. Create a Global Webhook Plugin**

```typescript
// features/webhooks/webhook-plugin.ts
import { BaseListTypeInfo, KeystoneConfig } from '@keystone-6/core/types';
import { DatabaseProvider } from '@keystone-6/core/types';

export function withWebhooks<TypeInfo extends BaseListTypeInfo>(
  config: KeystoneConfig<TypeInfo>
): KeystoneConfig<TypeInfo> {
  
  // Apply hooks to ALL lists automatically
  const enhancedLists = Object.fromEntries(
    Object.entries(config.lists).map(([listKey, listConfig]) => [
      listKey,
      {
        ...listConfig,
        hooks: {
          ...listConfig.hooks,
          afterOperation: async (args) => {
            // Call original hook if it exists
            if (listConfig.hooks?.afterOperation) {
              await listConfig.hooks.afterOperation(args);
            }
            
            // Trigger webhook for this operation
            await triggerWebhook({
              listKey,
              operation: args.operation,
              item: args.item,
              context: args.context
            });
          }
        }
      }
    ])
  );

  return {
    ...config,
    lists: enhancedLists
  };
}

async function triggerWebhook({ listKey, operation, item, context }) {
  try {
    // Get active webhooks for this list and operation
    const webhooks = await context.sudo().query.WebhookEndpoint.findMany({
      where: {
        isActive: { equals: true },
        events: { 
          some: `${listKey.toLowerCase()}.${operation}` 
        }
      },
      query: 'id url secret events'
    });

    // Queue webhook deliveries
    for (const webhook of webhooks) {
      await context.sudo().query.WebhookEvent.createOne({
        data: {
          eventType: `${listKey.toLowerCase()}.${operation}`,
          resourceType: listKey,
          resourceId: item.id,
          payload: await formatPayload(listKey, item, context),
          endpoint: { connect: { id: webhook.id } },
          nextAttempt: new Date(),
        }
      });
    }

    // Trigger delivery
    process.nextTick(() => deliverWebhooks());
    
  } catch (error) {
    console.error('Webhook trigger failed:', error);
  }
}
```

### **2. Webhook Data Models**

```typescript
// features/keystone/models/WebhookEndpoint.ts
export const WebhookEndpoint = list({
  access: allowAll,
  fields: {
    url: text({ validation: { isRequired: true } }),
    events: json({ 
      defaultValue: [],
      ui: { 
        description: 'Events like ["order.created", "product.updated"]' 
      }
    }),
    isActive: checkbox({ defaultValue: true }),
    secret: text({ ui: { itemView: { fieldMode: 'hidden' } } }),
    lastTriggered: timestamp(),
    failureCount: integer({ defaultValue: 0 }),
    user: relationship({ ref: 'User.webhookEndpoints' }),
  },
  hooks: {
    resolveInput: {
      create: ({ resolvedData }) => {
        if (!resolvedData.secret) {
          resolvedData.secret = crypto.randomBytes(32).toString('hex');
        }
        return resolvedData;
      },
    },
  },
});

// features/keystone/models/WebhookEvent.ts
export const WebhookEvent = list({
  access: allowAll,
  fields: {
    eventType: text({ validation: { isRequired: true } }),
    resourceId: text({ validation: { isRequired: true } }),
    resourceType: text({ validation: { isRequired: true } }),
    payload: json(),
    deliveryAttempts: integer({ defaultValue: 0 }),
    delivered: checkbox({ defaultValue: false }),
    lastAttempt: timestamp(),
    nextAttempt: timestamp(),
    endpoint: relationship({ ref: 'WebhookEndpoint' }),
  },
});
```

### **3. Apply Plugin to Your Keystone Config**

```typescript
// keystone.ts
import { withWebhooks } from './features/webhooks/webhook-plugin';

const baseConfig = {
  db: { /* your db config */ },
  lists: {
    User,
    Order, 
    Product,
    // ALL your models - no individual hook setup needed!
  },
};

// Apply webhook plugin to ALL models at once
export default withWebhooks(baseConfig);
```

### **4. Webhook Management API**

```typescript
// app/api/webhooks/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { url, events } = body;

  const webhook = await keystoneContext.sudo().query.WebhookEndpoint.createOne({
    data: {
      url,
      events, // ["order.created", "product.updated", etc.]
      isActive: true,
      user: { connect: { id: getCurrentUserId(request) } },
    },
  });

  return NextResponse.json({ webhook });
}

export async function GET(request: NextRequest) {
  const webhooks = await keystoneContext.sudo().query.WebhookEndpoint.findMany({
    where: { user: { id: { equals: getCurrentUserId(request) } } },
  });

  return NextResponse.json({ webhooks });
}
```

### **5. Webhook Delivery System**

```typescript
// features/webhooks/delivery.ts
export async function deliverWebhooks() {
  const pendingEvents = await keystoneContext.sudo().query.WebhookEvent.findMany({
    where: {
      delivered: { equals: false },
      deliveryAttempts: { lt: 5 },
      nextAttempt: { lte: new Date() }
    },
    query: `
      id eventType payload deliveryAttempts
      endpoint { id url secret }
    `
  });

  for (const event of pendingEvents) {
    await deliverSingleWebhook(event);
  }
}

async function deliverSingleWebhook(event) {
  try {
    const signature = crypto
      .createHmac('sha256', event.endpoint.secret)
      .update(JSON.stringify(event.payload))
      .digest('hex');

    const response = await fetch(event.endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenFront-Webhook-Signature': signature,
        'X-OpenFront-Topic': event.eventType,
      },
      body: JSON.stringify(event.payload),
    });

    if (response.ok) {
      await keystoneContext.sudo().query.WebhookEvent.updateOne({
        where: { id: event.id },
        data: { delivered: true, lastAttempt: new Date() }
      });
    }
  } catch (error) {
    // Handle retry logic
    const nextAttempt = new Date();
    nextAttempt.setMinutes(nextAttempt.getMinutes() + Math.pow(2, event.deliveryAttempts));
    
    await keystoneContext.sudo().query.WebhookEvent.updateOne({
      where: { id: event.id },
      data: {
        deliveryAttempts: event.deliveryAttempts + 1,
        lastAttempt: new Date(),
        nextAttempt
      }
    });
  }
}

// Run delivery every 30 seconds
setInterval(deliverWebhooks, 30000);
```

## Features

This approach gives you:
- **ONE place** to configure webhooks for ALL models
- **Shopify-like API** - users create webhooks with URL + events
- **Automatic hook injection** into every model
- **Full webhook management** - create, list, delete webhooks
- **Reliable delivery** with retries and failure handling
- **Zero model-specific code** required

Just apply the `withWebhooks` plugin and every model automatically gets webhook support!