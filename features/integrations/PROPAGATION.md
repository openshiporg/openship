# Integration Parameter Propagation Guide

This document explains how parameters flow through the integration system for both shop and channel product fetching. **READ THIS BEFORE BREAKING SHIT AGAIN.**

## Shop Product Integration Flow

### 1. GraphQL Query Entry Point
```typescript
// /features/keystone/extendGraphqlSchema/index.ts
getShopProduct(shopId: ID!, productId: String, variantId: String): ShopProduct
```

### 2. Query Handler
```typescript
// /features/keystone/extendGraphqlSchema/queries/getShopProduct.ts
async function getShopProductQuery(
  root: any,
  { shopId, productId, variantId }: { shopId: string; productId: string; variantId?: string },
  context: any
)
```
**CRITICAL:** Must pass BOTH `productId` and `variantId` to adapter

### 3. Shop Provider Adapter
```typescript
// /features/keystone/utils/shopProviderAdapter.ts
export async function getShopProduct({ platform, productId, variantId }) {
  return executeShopAdapterFunction({
    platform,
    functionName: "getProductFunction",
    args: { productId, variantId }, // ⚠️ BOTH REQUIRED
  });
}
```
**CRITICAL:** The `args` object MUST include BOTH parameters or the integration will get `undefined`

### 4. Adapter Function Executor
```typescript
// /features/keystone/utils/shopProviderAdapter.ts
export async function executeShopAdapterFunction({ platform, functionName, args }) {
  // Calls: await fn({ platform, ...args });
  // Results in: fn({ platform, productId, variantId })
}
```

### 5. Shopify Integration
```typescript
// /features/integrations/shop/shopify.ts
export async function getProductFunction({
  platform,
  productId,
  variantId,
}: {
  platform: ShopifyPlatform;
  productId: string;
  variantId?: string;
}) {
  const fullVariantId = `gid://shopify/ProductVariant/${variantId}`;
  // ⚠️ If variantId is undefined, this becomes "gid://shopify/ProductVariant/undefined"
}
```

## Channel Product Integration Flow

### 1. GraphQL Query Entry Point
```typescript
// /features/keystone/extendGraphqlSchema/index.ts
getChannelProduct(channelId: ID!, productId: String, variantId: String): ChannelProduct
```

### 2. Query Handler
```typescript
// /features/keystone/extendGraphqlSchema/queries/getChannelProduct.ts
async function getChannelProduct(
  root: any,
  { channelId, productId, variantId }: {
    channelId: string;
    productId?: string;
    variantId?: string;
  },
  context: any
)
```
**CRITICAL:** Must pass BOTH `productId` and `variantId` to adapter

### 3. Channel Provider Adapter
```typescript
// /features/keystone/utils/channelProviderAdapter.ts
export async function getChannelProduct({
  platform,
  productId,
  variantId,
}: {
  platform: Platform;
  productId: string;
  variantId?: string;
}) {
  return executeChannelAdapterFunction({
    platform,
    functionName: 'getProductFunction',
    args: { productId, variantId }, // ⚠️ BOTH REQUIRED
  });
}
```
**CRITICAL:** The `args` object MUST include BOTH parameters

### 4. Adapter Function Executor
```typescript
// /features/keystone/utils/channelProviderAdapter.ts
export async function executeChannelAdapterFunction({ platform, functionName, args }) {
  // Calls: await fn({ platform, ...args });
  // Results in: fn({ platform, productId, variantId })
}
```

### 5. Shopify Integration
```typescript
// /features/integrations/channel/shopify.ts
export async function getProductFunction({
  platform,
  productId,
  variantId,
}: {
  platform: ShopifyPlatform;
  productId: string;
  variantId?: string;
}) {
  const fullVariantId = `gid://shopify/ProductVariant/${variantId}`;
  // ⚠️ If variantId is undefined, this becomes "gid://shopify/ProductVariant/undefined"
}
```

## Platform Configuration Propagation

### Critical Platform Config Requirements

Both shop and channel queries must merge the platform configuration properly:

```typescript
// ✅ CORRECT - Merge domain/accessToken into platform config
const platformConfig = {
  domain: shop.domain,
  accessToken: shop.accessToken,
  getProductFunction: shop.platform.getProductFunction,
  ...shop.metadata,
};

// ❌ WRONG - Pass platform object directly (missing domain/accessToken)
platform: channel.platform
```

## Common Failure Points

### 1. Missing Parameters in Adapter Functions
**Symptom:** `variantId` is `undefined` in integration
**Cause:** Adapter function not including parameter in `args` object
**Fix:** Ensure all required parameters are in the `args` object

### 2. Platform Configuration Missing Domain/AccessToken
**Symptom:** `https://undefined/admin/api/graphql.json` errors
**Cause:** Not merging shop/channel domain and accessToken into platform config
**Fix:** Create proper `platformConfig` object with merged values

### 3. Invalid GID Construction
**Symptom:** `Product not found` errors
**Cause:** Constructing GID with `undefined` values
**Fix:** Ensure parameters are properly propagated through all layers

## Testing Integration Propagation

To test if parameters are propagating correctly, add logging at each layer:

```typescript
// In query handler
console.log("Query handler received:", { shopId, productId, variantId });

// In adapter function
console.log("Adapter function called with:", { productId, variantId });

// In integration
console.log("Integration called with:", { platform: platform.domain, productId, variantId });
```

## Key Takeaways

1. **ALWAYS** pass ALL required parameters through EVERY layer
2. **ALWAYS** merge domain/accessToken into platform configuration
3. **NEVER** use hacky fallbacks like `variantId || productId`
4. **TEST** the full propagation chain when making changes
5. **LOG** parameters at each layer when debugging

**Remember: If you break this again, you're a fucking dumbass who didn't read this document.**