# Openship 4 - AI Assistant Guide

## Overview

Openship 4 is a Next.js 15 + KeystoneJS 6 order orchestration platform that connects shops (order sources) with channels (fulfillment providers) through intelligent matching and routing. This is the main codebase for the Openship 4 application.

## Platform Understanding

For comprehensive technical details about the Openship 4 platform architecture, schema, and features, refer to:
**`features/platform/PLATFORM.md`**

This platform documentation explains:
- KeystoneJS data models and relationships (15+ models)
- Shop and channel adapter systems
- Two-tier platform architecture (platforms vs instances)  
- Order orchestration and matching workflows
- GraphQL API structure and operations
- Access control and automation features

## Project Architecture

Openship 4 is a complete rewrite providing order orchestration between shops and fulfillment channels.

## Core Concepts

### Two-Tier Architecture
- **Platform Level**: ShopPlatform and ChannelPlatform define integration capabilities
- **Instance Level**: Shop and Channel are actual connections using platform templates

### Order Flow
```
Shop Order → Order → Matching → CartItem → Channel Fulfillment → Tracking → Shop Notification
```

### Data Models (KeystoneJS)
Key models include:
- **Shop**: Order source connections (Shopify stores, WooCommerce sites)
- **Channel**: Fulfillment provider connections (Amazon, 3PL providers)
- **Order**: Orders imported from shops for processing
- **CartItem**: Items being fulfilled through channels
- **Match**: Manual product mappings between shops and channels
- **Link**: Automated routing rules between shops and channels

## Platform Features

### Orders Platform (`/dashboard/platform/orders`)
- Order management and processing
- GET MATCH and SAVE MATCH functionality
- Bulk order processing
- Status tracking and fulfillment

### Shops Platform (`/dashboard/platform/shops`)
- Shop connection management
- Order search and import
- Webhook configuration
- Link management for automated routing

### Channels Platform (`/dashboard/platform/channels`)
- Channel connection management
- Product search and fulfillment
- Order tracking and management
- Webhook configuration

### Matches Platform (`/dashboard/platform/matches`)
- Product matching interface
- Manual mapping creation and management
- Match analytics and performance tracking

## Integration System

### Shop Adapter Pattern
```typescript
// Execute shop platform functions
const result = await executeShopAdapterFunction({
  platform: shopPlatform,
  functionName: 'searchOrdersFunction',
  args: { status: 'fulfilled', limit: 50 }
});
```

### Channel Adapter Pattern
```typescript
// Execute channel platform functions
const result = await executeChannelAdapterFunction({
  platform: channelPlatform,
  functionName: 'createPurchaseFunction',
  args: { products: cartItems, shipping: address }
});
```

## GraphQL API

### Key Mutations
- `addMatchToCart` - Add matched products to order cart
- `matchOrder` - Apply product matches to order
- `placeOrders` - Process multiple orders for fulfillment
- `createChannelPurchase` - Create purchase order on channel
- `cancelOrder` - Cancel order processing

### Key Queries
- `searchShopOrders` - Search orders from connected shops
- `searchShopProducts` - Search products from shops
- `searchChannelProducts` - Search products from channels
- `getMatchQuery` - Get product matches for order

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

## Development Guidelines

### Code Organization
```
features/
├── keystone/           # Data models and GraphQL schema
├── platform/          # Admin interface components
│   ├── orders/        # Order management
│   ├── shops/         # Shop connections
│   ├── channels/      # Channel connections
│   └── matches/       # Product matching
├── integrations/      # Shop and channel adapters
└── dashboard/         # Shared admin components
```

### AI Assistant Instructions

When working on Openship 4:

1. **Read Platform Documentation**: Always reference the `features/platform/PLATFORM.md` file for technical details
2. **Verify Implementation**: Check actual code rather than making assumptions about features
3. **Test Workflows**: Ensure end-to-end functionality works as expected
4. **Follow Patterns**: Use established adapter patterns for integrations
5. **Maintain Data Isolation**: Ensure user-scoped data access

## Access Control

### Permissions
- `canCreateShops` - Create new shop connections
- `canManageShops` - Manage shop settings
- `canCreateChannels` - Create new channel connections
- `canManageChannels` - Manage channel settings
- `canManageOrders` - Process and manage orders

### Data Isolation
All data is user-scoped - users only see their own shops, channels, orders, and matches.

## Important Notes

- Openship 4 is a complete platform rewrite with modern architecture
- Uses sophisticated adapter patterns for flexible integrations
- Provides comprehensive order orchestration capabilities
- Includes real-time automation and webhook processing
- Supports multi-user environments with proper data isolation

This platform enables businesses to automate order fulfillment across multiple channels while maintaining centralized control and visibility.