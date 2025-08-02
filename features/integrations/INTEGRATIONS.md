# OpenShip 4 Integration System

## Overview

OpenShip 4 uses a sophisticated adapter-based integration system that allows connecting to various shops (order sources) and channels (fulfillment providers) through standardized function interfaces. This system enables order orchestration across multiple platforms while maintaining consistent APIs and workflows.

## Architecture

### Two-Tier Integration System

#### Platform Level (Templates)
- **ShopPlatform**: Defines integration capabilities for shop types (Shopify, WooCommerce, etc.)
- **ChannelPlatform**: Defines integration capabilities for fulfillment providers (Amazon, 3PL, etc.)

#### Instance Level (Connections)
- **Shop**: Actual shop connections using platform templates with specific credentials
- **Channel**: Actual fulfillment connections using platform templates with specific credentials

### Adapter Pattern

The adapter pattern provides a consistent interface for all integrations, regardless of the underlying platform:

```typescript
// Shop adapter execution
const result = await executeShopAdapterFunction({
  platform: {
    domain: shop.domain,
    accessToken: shop.accessToken,
    searchOrdersFunction: platform.searchOrdersFunction
  },
  functionName: 'searchOrdersFunction',
  args: { status: 'fulfilled', limit: 50 }
});

// Channel adapter execution
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

## Shop Integrations

### Shop Platform Functions

Each ShopPlatform must implement these standardized functions:

#### Required Functions
- `searchProductsFunction` - Search shop's product catalog
- `getProductFunction` - Get specific product details
- `searchOrdersFunction` - Search shop's order history
- `updateProductFunction` - Update product information
- `createWebhookFunction` - Create webhook subscriptions
- `deleteWebhookFunction` - Remove webhook subscriptions
- `getWebhooksFunction` - List existing webhooks

#### Optional Functions
- `oAuthFunction` - Initiate OAuth flow
- `oAuthCallbackFunction` - Handle OAuth callback
- `createOrderWebhookHandler` - Process new order webhooks
- `cancelOrderWebhookHandler` - Process order cancellation webhooks

### Shopify Shop Integration

OpenShip 4 includes a complete Shopify shop integration:

#### Function Implementations
```typescript
// Product search with pagination
export async function searchProductsFunction({ platform, searchEntry, after }) {
  // GraphQL query to Shopify Admin API
  // Returns formatted product list with pagination
}

// Order search with comprehensive data
export async function searchOrdersFunction({ platform, searchEntry, after }) {
  // GraphQL query for orders with line items and shipping
  // Returns formatted order data for OpenShip processing
}

// Product inventory and price updates
export async function updateProductFunction({ platform, productId, variantId, inventory, price }) {
  // Updates product variant information via GraphQL
  // Handles both inventory adjustments and price changes
}

// Webhook management
export async function createWebhookFunction({ platform, endpoint, events }) {
  // Creates Shopify webhook subscriptions
  // Maps OpenShip events to Shopify topics
}
```

#### Webhook Processing
```typescript
// New order webhook handler
export async function createOrderWebhookHandler({ platform, event, headers }) {
  // Verifies webhook authenticity
  // Formats order data for OpenShip Order creation
  // Returns Keystone-ready order object
}

// Order cancellation webhook handler
export async function cancelOrderWebhookHandler({ platform, event, headers }) {
  // Processes order cancellation events
  // Updates order status in OpenShip
}
```

#### OAuth Flow
```typescript
// OAuth initiation
export async function oAuthFunction({ platform, callbackUrl }) {
  // Generates Shopify OAuth authorization URL
  // Returns auth URL for user redirection
}

// OAuth callback processing
export async function oAuthCallbackFunction({ platform, code, shop, state }) {
  // Exchanges OAuth code for access token
  // Returns credentials for shop connection
}
```

## Channel Integrations

### Channel Platform Functions

Each ChannelPlatform must implement these standardized functions:

#### Required Functions
- `searchProductsFunction` - Search channel's product catalog
- `getProductFunction` - Get specific product details
- `createPurchaseFunction` - Create purchase orders
- `searchOrdersFunction` - Search channel's order history
- `createWebhookFunction` - Create webhook subscriptions
- `deleteWebhookFunction` - Remove webhook subscriptions
- `getWebhooksFunction` - List existing webhooks

#### Optional Functions
- `cancelPurchaseFunction` - Cancel purchase orders
- `updatePurchaseFunction` - Update purchase information
- `oAuthFunction` - Initiate OAuth flow
- `oAuthCallbackFunction` - Handle OAuth callback
- `createTrackingWebhookHandler` - Process fulfillment webhooks
- `cancelPurchaseWebhookHandler` - Process cancellation webhooks

### Shopify Channel Integration

OpenShip 4 includes a Shopify channel integration for fulfillment:

#### Function Implementations
```typescript
// Product search for fulfillment
export async function searchProductsFunction({ platform, searchEntry, after }) {
  // Search channel's available products
  // Returns products suitable for fulfillment
}

// Purchase order creation
export async function createPurchaseFunction({ platform, cartItems, shipping, notes }) {
  // Creates draft order in Shopify
  // Completes order for processing
  // Returns purchase confirmation
}

// Webhook processing for tracking
export async function createTrackingWebhookHandler({ platform, event, headers }) {
  // Processes fulfillment events
  // Extracts tracking information
  // Returns tracking data for order updates
}
```

## Integration Configuration

### Platform Setup

#### ShopPlatform Configuration
```typescript
{
  name: "Shopify",
  description: "Shopify e-commerce platform",
  
  // Function name mappings
  searchProductsFunction: "searchProductsFunction",
  getProductFunction: "getProductFunction", 
  searchOrdersFunction: "searchOrdersFunction",
  updateProductFunction: "updateProductFunction",
  createWebhookFunction: "createWebhookFunction",
  deleteWebhookFunction: "deleteWebhookFunction",
  getWebhooksFunction: "getWebhooksFunction",
  
  // OAuth configuration
  oAuthFunction: "oAuthFunction",
  oAuthCallbackFunction: "oAuthCallbackFunction",
  
  // Webhook handlers
  createOrderWebhookHandler: "createOrderWebhookHandler",
  cancelOrderWebhookHandler: "cancelOrderWebhookHandler"
}
```

#### ChannelPlatform Configuration
```typescript
{
  name: "Shopify Fulfillment",
  description: "Shopify as fulfillment provider",
  
  // Function name mappings
  searchProductsFunction: "searchProductsFunction",
  getProductFunction: "getProductFunction",
  createPurchaseFunction: "createPurchaseFunction",
  searchOrdersFunction: "searchOrdersFunction",
  createWebhookFunction: "createWebhookFunction",
  deleteWebhookFunction: "deleteWebhookFunction",
  getWebhooksFunction: "getWebhooksFunction",
  
  // Webhook handlers
  createTrackingWebhookHandler: "createTrackingWebhookHandler",
  cancelPurchaseWebhookHandler: "cancelPurchaseWebhookHandler"
}
```

### Instance Configuration

#### Shop Instance
```typescript
{
  name: "My Shopify Store",
  domain: "mystore.myshopify.com",
  accessToken: "shpat_...",
  platform: → ShopPlatform,
  linkMode: "sequential", // or "simultaneous"
  metadata: {
    // Shop-specific configuration
    webhookSecret: "...",
    appId: "...",
    scopes: ["read_orders", "write_orders"]
  }
}
```

#### Channel Instance
```typescript
{
  name: "Amazon FBA",
  domain: "sellercentral.amazon.com",
  accessToken: "amzn_...",
  platform: → ChannelPlatform,
  metadata: {
    // Channel-specific configuration
    sellerId: "...",
    marketplaceId: "...",
    region: "us-east-1"
  }
}
```

## Webhook System

### Webhook Flow

1. **Registration**: Platforms register webhooks with external services
2. **Reception**: OpenShip receives webhook events at API endpoints
3. **Verification**: Webhook signatures verified using platform-specific methods
4. **Processing**: Events processed through platform webhook handlers
5. **Integration**: Results integrated into OpenShip data models

### Webhook Endpoints

OpenShip provides standardized webhook endpoints:

- `/api/handlers/shop/create-order/{shopId}` - New order from shop
- `/api/handlers/shop/cancel-order/{shopId}` - Order cancellation from shop
- `/api/handlers/channel/cancel-purchase/{channelId}` - Purchase cancellation from channel
- `/api/handlers/channel/create-tracking/{channelId}` - Tracking from channel

### Event Mapping

OpenShip events map to platform-specific webhook topics:

#### Shop Events
- `ORDER_CREATED` → Shopify: `ORDERS_CREATE`
- `ORDER_CANCELLED` → Shopify: `ORDERS_CANCELLED`
- `ORDER_CHARGEBACKED` → Shopify: `DISPUTES_CREATE`

#### Channel Events
- `TRACKING_CREATED` → Shopify: `FULFILLMENTS_CREATE`
- `ORDER_CANCELLED` → Shopify: `ORDERS_CANCELLED`

## Error Handling

### Graceful Degradation
- Platform unavailability doesn't break core functionality
- Fallback to manual processing when integrations fail
- Comprehensive error logging and reporting

### Retry Logic
- Automatic retries for transient errors
- Exponential backoff for rate limiting
- Dead letter queues for failed operations

### Error Types
- **Authentication Errors**: Invalid credentials or expired tokens
- **Rate Limiting**: API quota exceeded
- **Data Validation**: Invalid or missing required fields
- **Network Errors**: Connectivity or timeout issues
- **Platform Errors**: External service failures

## Development Guidelines

### Adding New Integrations

#### 1. Create Platform Adapter
```typescript
// features/integrations/shop/woocommerce.ts
export async function searchProductsFunction({ platform, searchEntry, after }) {
  // Implementation specific to WooCommerce REST API
}

export async function searchOrdersFunction({ platform, searchEntry, after }) {
  // Implementation specific to WooCommerce REST API
}

// ... other required functions
```

#### 2. Register Platform
Create ShopPlatform or ChannelPlatform record with function mappings.

#### 3. Test Integration
- Unit tests for adapter functions
- Integration tests with sandbox/test environments
- End-to-end tests for complete workflows

#### 4. Document Integration
- API requirements and limitations
- Setup and configuration instructions
- Troubleshooting guide

### Best Practices

#### Function Implementation
- Always validate input parameters
- Handle errors gracefully with descriptive messages
- Return consistent data structures
- Use proper TypeScript types
- Include comprehensive logging

#### Data Transformation
- Normalize external data to OpenShip formats
- Handle missing or optional fields appropriately
- Maintain data integrity across transformations
- Preserve original data in metadata when possible

#### Security
- Validate webhook signatures
- Sanitize external input data
- Store credentials securely
- Use environment variables for sensitive configuration
- Implement proper access controls

## Testing Strategy

### Unit Tests
Test individual adapter functions in isolation:
```typescript
describe('Shopify Shop Adapter', () => {
  it('should search products with pagination', async () => {
    const result = await searchProductsFunction({
      platform: mockPlatform,
      searchEntry: 'test product',
      after: null
    });
    
    expect(result.products).toBeDefined();
    expect(result.pageInfo).toBeDefined();
  });
});
```

### Integration Tests
Test with actual platform APIs using test accounts:
```typescript
describe('Shopify Integration', () => {
  it('should create and retrieve webhooks', async () => {
    const createResult = await createWebhookFunction({
      platform: testPlatform,
      endpoint: 'https://test.example.com/webhook',
      events: ['ORDER_CREATED']
    });
    
    const listResult = await getWebhooksFunction({
      platform: testPlatform
    });
    
    expect(listResult.webhooks).toContainEqual(
      expect.objectContaining({
        topic: 'ORDER_CREATED'
      })
    );
  });
});
```

### End-to-End Tests
Test complete workflows from order creation to fulfillment:
```typescript
describe('Order Orchestration', () => {
  it('should process order from shop to channel', async () => {
    // 1. Create order in shop
    // 2. Verify order imported to OpenShip
    // 3. Match products to channel
    // 4. Create purchase in channel
    // 5. Verify fulfillment tracking
  });
});
```

## Performance Considerations

### Caching
- Cache platform function results when appropriate
- Implement cache invalidation strategies
- Use Redis or similar for distributed caching

### Rate Limiting
- Respect platform API rate limits
- Implement request queuing and throttling
- Monitor and alert on rate limit usage

### Batch Operations
- Process multiple items in single API calls when supported
- Use bulk operations for large data sets
- Implement efficient pagination strategies

## Monitoring and Observability

### Metrics
- Integration success/failure rates
- Response times and performance
- Error rates by integration type
- Webhook processing statistics

### Logging
- Structured logging for all integration activities
- Include correlation IDs for request tracing
- Log both successful operations and errors
- Maintain audit trails for compliance

### Alerting
- Platform connectivity issues
- High error rates or failures
- Webhook processing delays
- Rate limit threshold alerts

This integration system provides a flexible, scalable foundation for connecting OpenShip to any external platform while maintaining consistency and reliability across all integrations.