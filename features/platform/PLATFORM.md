# OpenShip 4 Platform Architecture

## Overview

OpenShip 4 is a Next.js 15 + KeystoneJS 6 order orchestration platform that connects shops (order sources) with channels (fulfillment providers) through an intelligent matching and routing system. The platform uses a two-tier architecture where platforms define integration capabilities and shops/channels are instances of those platforms.

## Core Concepts

### Two-Tier Architecture

**Platform Level (Templates):**
- `ShopPlatform` - Defines integration functions for shop types (Shopify, WooCommerce, etc.)
- `ChannelPlatform` - Defines integration functions for fulfillment providers (Amazon, 3PL, etc.)

**Instance Level (Connections):**
- `Shop` - Actual shop connections using platform templates
- `Channel` - Actual fulfillment connections using platform templates

### Data Flow

```
Shop Order → Order → Matching → CartItem → Channel Fulfillment → Tracking → Shop Notification
```

## KeystoneJS Schema

### Platform Models

#### ShopPlatform
Defines integration capabilities for shop types:
```typescript
{
  name: "Shopify" | "WooCommerce" | "BigCommerce",
  searchOrdersFunction: "function code",
  searchProductsFunction: "function code", 
  getOrderFunction: "function code",
  updateOrderFunction: "function code",
  getWebhooksFunction: "function code",
  // ... other platform-specific functions
}
```

#### ChannelPlatform  
Defines integration capabilities for fulfillment providers:
```typescript
{
  name: "Amazon FBA" | "Shopify" | "3PL Provider",
  searchProductsFunction: "function code",
  createPurchaseFunction: "function code",
  searchOrdersFunction: "function code", 
  cancelPurchaseFunction: "function code",
  getWebhooksFunction: "function code",
  // ... other platform-specific functions
}
```

### Instance Models

#### Shop
Actual shop connections:
```typescript
{
  name: "My Shopify Store",
  domain: "mystore.myshopify.com",
  accessToken: "encrypted_token",
  platform: → ShopPlatform,
  linkMode: "sequential" | "simultaneous",
  metadata: {}, // Shop-specific config
  user: → User,
  orders: [→ Order],
  links: [→ Link],
  shopItems: [→ ShopItem]
}
```

#### Channel
Actual fulfillment connections:
```typescript
{
  name: "Amazon FBA Account",
  domain: "sellercentral.amazon.com", 
  accessToken: "encrypted_credentials",
  platform: → ChannelPlatform,
  metadata: {}, // Channel-specific config
  user: → User,
  links: [→ Link],
  channelItems: [→ ChannelItem],
  cartItems: [→ CartItem]
}
```

### Order Management Models

#### Order
Central order entity from shops:
```typescript
{
  orderId: "unique_shop_order_id",
  orderName: "#1001",
  email: "customer@email.com",
  
  // Customer details
  firstName, lastName, phone,
  streetAddress1, streetAddress2, city, state, zip, country,
  
  // Pricing
  currency: "USD",
  totalPrice: 99.99,
  subTotalPrice: 89.99,
  totalDiscounts: 0,
  totalTax: 10.00,
  
  // Processing controls
  linkOrder: true,    // Auto-link to channels via Link rules
  matchOrder: true,   // Auto-match via Match database
  processOrder: true, // Auto-fulfill matched items
  
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "ERROR",
  error: "Error details if any",
  
  shop: → Shop,
  lineItems: [→ LineItem], // What customer ordered
  cartItems: [→ CartItem], // What's being fulfilled
  user: → User
}
```

#### LineItem
Items in the original shop order:
```typescript
{
  name: "Product Name",
  image: "product_image_url",
  price: 29.99,
  quantity: 2,
  lineItemId: "shop_line_item_id",
  productId: "shop_product_id", 
  variantId: "shop_variant_id",
  sku: "product_sku",
  order: → Order
}
```

#### CartItem
Items being fulfilled through channels:
```typescript
{
  name: "Fulfillment Product Name",
  image: "channel_product_image",
  price: 25.99, // Channel price (may differ)
  quantity: 2,
  productId: "channel_product_id",
  variantId: "channel_variant_id", 
  inventoryQuantity: 100,
  
  status: "PENDING" | "PROCESSING" | "COMPLETE" | "CANCELLED",
  error: "Fulfillment error details",
  
  order: → Order,
  channel: → Channel,
  user: → User,
  trackingDetails: [→ TrackingDetail]
}
```

### Product Models

#### ShopItem
Products from shops (for matching):
```typescript
{
  name: "Shop Product Name",
  image: "shop_image_url",
  productId: "shop_product_id",
  variantId: "shop_variant_id",
  price: 29.99,
  availableForSale: true,
  
  shop: → Shop,
  user: → User,
  matches: [→ Match] // Links to channel products
}
```

#### ChannelItem  
Products from channels (for fulfillment):
```typescript
{
  name: "Channel Product Name", 
  image: "channel_image_url",
  productId: "channel_product_id",
  variantId: "channel_variant_id",
  price: 25.99,
  availableForSale: true,
  inventoryQuantity: 100,
  
  channel: → Channel,
  user: → User,
  matches: [→ Match] // Links to shop products
}
```

### Linking & Matching Models

#### Link
Automated routing rules between shops and channels:
```typescript
{
  shop: → Shop,
  channel: → Channel, 
  rank: 1, // Priority order for sequential linking
  dynamicWhereClause: {}, // Conditional rules for order matching
  user: → User
}
```

#### Match
Manual product mappings between shops and channels:
```typescript
{
  shopItem: → ShopItem,
  channelItem: → ChannelItem,
  user: → User
}
```

#### TrackingDetail
Fulfillment tracking information:
```typescript
{
  trackingCompany: "UPS",
  trackingNumber: "1Z123456789",
  trackingUrl: "https://tracking.url",
  
  cartItem: → CartItem
}
```

## Platform Features

### Orders Platform (`/dashboard/platform/orders`)
- **Order Management**: View and process orders from connected shops
- **GET MATCH**: Find existing product matches for order items
- **SAVE MATCH**: Create new product matches during order processing  
- **Bulk Processing**: Process multiple orders simultaneously
- **Status Tracking**: Monitor order fulfillment status

**Key Components:**
- `OrderListPageClient` - Main orders list with filtering
- `OrderPageClient` - Individual order details and processing
- `ProcessOrdersDialog` - Bulk order processing interface

### Shops Platform (`/dashboard/platform/shops`)  
- **Shop Management**: Connect and configure shop integrations
- **Order Search**: Search and import orders from connected shops
- **Webhook Management**: Configure shop webhooks for automation
- **Link Management**: Set up automated routing rules

**Key Components:**
- `ShopListPageClient` - Shops overview and management
- `ShopDetailsComponent` - Shop configuration and settings
- `SearchOrders` - Shop order search and import

### Channels Platform (`/dashboard/platform/channels`)
- **Channel Management**: Connect and configure fulfillment providers  
- **Product Search**: Search channel catalogs for fulfillment options
- **Order Management**: Track channel purchase orders
- **Webhook Management**: Configure channel webhooks for tracking

**Key Components:**
- `ChannelListPageClient` - Channels overview and management
- `ChannelDetailsComponent` - Channel configuration and settings
- `SearchOrders` - Channel order search and tracking

### Matches Platform (`/dashboard/platform/matches`)
- **Product Matching**: Create mappings between shop and channel products
- **Match Management**: View and edit existing product matches
- **Bulk Matching**: Create multiple matches efficiently
- **Match Analytics**: Track match performance and accuracy

**Key Components:**
- `MatchesListPageClient` - Matches overview and management
- `MatchPageClient` - Individual match details and editing
- `CreateMatchButton` - Match creation interface

## Integration Architecture

### Shop Adapter Pattern
Shop platforms execute functions through a standardized adapter:

```typescript
// Example: Search orders from Shopify
const result = await executeShopAdapterFunction({
  platform: {
    domain: shop.domain,
    accessToken: shop.accessToken,
    searchOrdersFunction: platform.searchOrdersFunction
  },
  functionName: 'searchOrdersFunction',
  args: { status: 'fulfilled', limit: 50 }
});
```

### Channel Adapter Pattern  
Channel platforms execute functions through a standardized adapter:

```typescript
// Example: Create purchase order on Amazon
const result = await executeChannelAdapterFunction({
  platform: {
    domain: channel.domain, 
    accessToken: channel.accessToken,
    createPurchaseFunction: platform.createPurchaseFunction
  },
  functionName: 'createPurchaseFunction',
  args: { products: cartItems, shipping: address }
});
```

## GraphQL API

### Key Mutations
- `addMatchToCart` - Add matched products to cart for order
- `matchOrder` - Apply product matches to order
- `placeOrders` - Process multiple orders for fulfillment
- `createChannelPurchase` - Create purchase order on channel
- `cancelOrder` - Cancel order processing
- `updateShopProduct` - Update shop product information

### Key Queries
- `searchShopOrders` - Search orders from connected shops
- `searchShopProducts` - Search products from connected shops  
- `searchChannelProducts` - Search products from connected channels
- `getMatchQuery` - Get product matches for order
- `getFilteredMatches` - Get matches with filtering

### Webhook Endpoints
- `/api/handlers/shop/create-order/{shopId}` - New order webhook
- `/api/handlers/shop/cancel-order/{shopId}` - Order cancellation webhook
- `/api/handlers/channel/cancel-purchase/{channelId}` - Purchase cancellation webhook
- `/api/handlers/channel/create-tracking/{channelId}` - Tracking creation webhook

## Access Control

### Permissions
- `canCreateShops` - Create new shop connections
- `canManageShops` - Manage shop settings and configuration
- `canCreateChannels` - Create new channel connections  
- `canManageChannels` - Manage channel settings and configuration
- `canManageOrders` - Process and manage orders

### Data Isolation
All data is user-scoped - users only see their own:
- Shops and channels
- Orders and line items
- Matches and links
- Product catalogs

## Automation Features

### Linking Modes
- **Sequential**: Try channels in rank order until one succeeds
- **Simultaneous**: Send to all matching channels simultaneously

### Processing Flags
- `linkOrder`: Auto-create cart items via Link rules
- `matchOrder`: Auto-create cart items via Match database  
- `processOrder`: Auto-fulfill cart items immediately

### Webhook Integration
- Automatic order import from shops
- Automatic tracking updates from channels
- Real-time status synchronization

## Performance Considerations

### Database Optimization
- Indexed fields: `orderId`, shop/channel relationships
- Efficient queries with proper joins
- Virtual fields for computed data (webhooks)

### Caching Strategy
- Platform function code caching
- Product search result caching
- Webhook response caching

### Error Handling
- Graceful degradation for platform failures
- Retry logic for transient errors
- Comprehensive error logging and reporting

This platform architecture enables sophisticated order orchestration across multiple shops and fulfillment channels while maintaining data integrity and user isolation.