# OpenShip 4 Testing Framework

## Overview

This testing framework provides comprehensive coverage for OpenShip 4's platform features without requiring external services like Shopify or WooCommerce. It uses mock adapters to simulate real platform interactions while testing the complete order processing workflow.

## Quick Start

### Prerequisites

1. **Test Database**: Set up a separate PostgreSQL database for testing
   ```bash
   createdb openship_test
   ```

2. **Environment Variables**: Create `.env.test` or add to your `.env`:
   ```
   TEST_DATABASE_URL=postgresql://localhost:5432/openship_test
   ```

### Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run with UI (great for debugging)
npm run test:ui

# Run only unit tests
npm run test:units

# Run only integration tests  
npm run test:integration

# Run tests in watch mode (development)
npm run test:watch
```

## Test Structure

```
tests/
├── setup/                 # Test configuration and database setup
│   ├── vitest.setup.ts    # Global test setup
│   └── test-database.ts   # Database utilities and context
├── fixtures/              # Test data factories
│   └── factories.ts       # Data creation utilities
├── mocks/                 # Platform adapter mocks
│   └── platform-adapters.ts  # Mock Shopify, WooCommerce, etc.
├── units/                 # Unit tests for individual functions
│   ├── addMatchToCart.test.ts
│   ├── matchOrder.test.ts
│   └── placeOrders.test.ts
├── integration/           # End-to-end workflow tests
│   └── order-processing-workflow.test.ts
└── components/            # React component tests (future)
```

## Key Features

### 🎯 **Complete Workflow Testing**
Test the entire order processing flow without external dependencies:

1. **GET MATCH**: Find existing matches and create cart items
2. **SAVE MATCH**: Create new match relationships  
3. **PLACE ORDER**: Process orders through channel platforms

### 🔄 **Mock Platform Adapters**
Realistic mock responses for all platform operations:

- ✅ **Channel Operations**: Product search, price retrieval, order placement
- ✅ **Shop Operations**: Order search, cart integration
- ✅ **Error Scenarios**: Auth failures, inventory issues, price changes
- ✅ **Success Scenarios**: Perfect matches, multi-item orders, bulk processing

### 📊 **Test Scenarios**
Pre-built test scenarios cover all edge cases:

```typescript
import { createTestScenarios } from '../mocks/platform-adapters'

const scenarios = createTestScenarios()

// Perfect match scenario
scenarios.perfectMatch.productId // 'test-product-1'
scenarios.perfectMatch.expectedPrice // '29.99'

// Price change scenario  
scenarios.priceChange.originalPrice // '29.99'
scenarios.priceChange.newPrice // '35.99'

// Error scenarios
scenarios.authError.productId // Will trigger auth error
scenarios.insufficientInventory.productId // Will trigger inventory error
```

### 🏭 **Test Data Factories**
Easy test data creation with realistic relationships:

```typescript
import { TestDataFactory } from '../fixtures/factories'

const factory = new TestDataFactory(context)

// Create complete test scenario
const { user, shop, channel, order, lineItem, match } = 
  await factory.createCompleteTestScenario()

// Create individual entities
const user = await factory.createTestUser()
const shop = await factory.createTestShop(user)
const order = await factory.createTestOrder(shop, user)
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { getTestContext, resetTestDatabase } from '../setup/test-database'
import { TestDataFactory } from '../fixtures/factories'
import { mockPlatformAdapters } from '../mocks/platform-adapters'

describe('My Feature', () => {
  let context, factory, mockAdapters

  beforeEach(async () => {
    context = await getTestContext()
    factory = new TestDataFactory(context)
    mockAdapters = mockPlatformAdapters()
    await resetTestDatabase()
  })

  it('should process order successfully', async () => {
    // Arrange
    const { order, user } = await factory.createCompleteTestScenario()

    // Act
    const result = await myFunction(order.id, context)

    // Assert
    expect(result).toBeDefined()
    expect(mockAdapters.mockChannelExecutor).toHaveBeenCalled()
  })
})
```

### Integration Test Example

```typescript
it('should complete entire workflow', async () => {
  const { order, user } = await factory.createCompleteTestScenario()
  
  // Step 1: GET MATCH
  const matches = await getMatches({ orderId: order.id, context })
  expect(matches).toBeDefined()
  
  // Step 2: SAVE MATCH  
  const newMatch = await matchOrder(null, { orderId: order.id }, contextWithSession)
  expect(newMatch).toBeDefined()
  
  // Step 3: PLACE ORDER
  const result = await placeMultipleOrders({ ids: [order.id], query: context.query })
  expect(result[0].status).toBe('AWAITING')
})
```

## Test Scenarios Covered

### ✅ **Success Flows**
- Perfect product matches with successful order placement
- Multi-item orders with complex matching logic
- Bulk order processing across multiple channels
- Price validation and inventory checking

### ⚠️ **Error Handling** 
- Product price changes between match and placement
- Authentication failures with channel platforms
- Insufficient inventory during order placement
- Network timeouts and platform unavailability
- Partial order failures with mixed success/error states

### 🔄 **Edge Cases**
- Orders with no available matches
- Mixed channel success/failure scenarios  
- Existing match replacement logic
- Data consistency throughout workflow
- Platform adapter error recovery

## Mock Platform Behaviors

### Channel Platform Mocks
```typescript
// Success response
mockChannelResponses.getProduct.success
mockChannelResponses.createPurchase.success

// Error responses  
mockChannelResponses.getProduct.priceChange
mockChannelResponses.createPurchase.authError
mockChannelResponses.createPurchase.failure
```

### Shop Platform Mocks
```typescript
// Order search responses
mockShopResponses.searchOrders.success
mockShopResponses.addCartToPlatformOrder.success
```

## Benefits

### 🚀 **Development Speed**
- No external API setup required
- Fast test execution (sub-second)
- Immediate feedback on code changes
- Parallel test execution

### 🛡️ **Reliability** 
- Predictable test outcomes
- No external API dependencies
- Controlled error scenarios
- Comprehensive edge case coverage

### 🔧 **Debugging**
- Clear test failure messages
- Isolated test scenarios
- Mock call verification
- Data state inspection

### 📈 **CI/CD Ready**
- Runs in any environment
- No external API keys needed
- Consistent test results
- Fast build times

## Advanced Usage

### Custom Mock Scenarios
```typescript
// Create custom mock response
mockAdapters.mockChannelExecutor.mockResolvedValueOnce({
  product: { 
    id: 'custom-product',
    price: '99.99',
    available: true 
  }
})
```

### Database State Inspection
```typescript
// Verify database state at any point
const cartItems = await context.db.CartItem.findMany({
  where: { order: { id: { equals: order.id } } }
})
expect(cartItems).toHaveLength(2)
```

### Platform Adapter Verification
```typescript
// Verify correct platform calls
expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledWith({
  platform: expect.objectContaining({
    domain: 'test-channel.com',
    accessToken: 'test-token'
  }),
  functionName: 'createPurchaseFunction',
  args: expect.objectContaining({
    cartItems: expect.any(Array),
    shipping: expect.any(Object)
  })
})
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure TEST_DATABASE_URL is set correctly
2. **Mock Import Errors**: Check that all mock modules are properly imported
3. **Test Isolation**: Each test should call `resetTestDatabase()` in beforeEach
4. **Platform Adapter Mocks**: Verify mocks are set up before running tests

### Debug Mode
```bash
# Run with debugging output
DEBUG=true npm test

# Run single test file
npm test -- addMatchToCart.test.ts

# Run with coverage
npm run test:coverage
```

This testing framework ensures that your order processing logic works correctly across all scenarios without the complexity of managing external platform integrations.