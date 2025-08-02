import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTestContext, resetTestDatabase, closeTestDatabase } from '../setup/test-database'
import { TestDataFactory } from '../fixtures/factories'
import { mockPlatformAdapters, createTestScenarios } from '../mocks/platform-adapters'
import { getMatches } from '@/features/keystone/extendGraphqlSchema/mutations/addMatchToCart'
import type { KeystoneContext } from '@keystone-6/core/types'

describe('addMatchToCart Mutation', () => {
  let context: KeystoneContext
  let factory: TestDataFactory
  let mockAdapters: ReturnType<typeof mockPlatformAdapters>
  let testScenarios = createTestScenarios()

  beforeEach(async () => {
    context = await getTestContext()
    factory = new TestDataFactory(context)
    mockAdapters = mockPlatformAdapters()
    await resetTestDatabase()
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  describe('Perfect Match Scenarios', () => {
    it('should successfully find and create cart items for perfect match', async () => {
      // Arrange: Create a complete test scenario with matching products
      const { user, shop, channel, order, lineItem, match } = await factory.createCompleteTestScenario()

      // Act: Call getMatches to find existing matches
      const result = await getMatches({ orderId: order.id, context })

      // Assert: Verify cart item was created successfully
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()

      // Verify the cart item was created with correct data
      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })

      expect(cartItems).toHaveLength(1)
      expect(cartItems[0]).toMatchObject({
        productId: lineItem.productId,
        variantId: lineItem.variantId,
        quantity: lineItem.quantity,
        price: '29.99', // From mock response
        name: 'Test Product', // From mock response
      })

      // Verify mock was called correctly
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledWith({
        platform: expect.objectContaining({
          domain: channel.domain,
          accessToken: channel.accessToken,
        }),
        functionName: 'getProductFunction',
        args: {
          productId: lineItem.productId,
          variantId: lineItem.variantId
        }
      })
    })

    it('should handle multiple line items with individual matches', async () => {
      // Arrange: Create order with multiple line items
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)

      // Create multiple line items
      const lineItem1 = await factory.createTestLineItem(order, {
        productId: 'test-product-1',
        variantId: 'test-variant-1',
        quantity: 1
      })
      const lineItem2 = await factory.createTestLineItem(order, {
        productId: 'test-product-2',
        variantId: 'test-variant-2',
        quantity: 2
      })

      // Create individual matches for each line item
      const shopItem1 = await factory.createTestShopItem(shop, user, {
        productId: lineItem1.productId,
        variantId: lineItem1.variantId,
        quantity: lineItem1.quantity
      })
      const channelItem1 = await factory.createTestChannelItem(channel, user, {
        productId: lineItem1.productId,
        variantId: lineItem1.variantId,
        quantity: lineItem1.quantity
      })
      await factory.createTestMatch(shopItem1, channelItem1, user)

      const shopItem2 = await factory.createTestShopItem(shop, user, {
        productId: lineItem2.productId,
        variantId: lineItem2.variantId,
        quantity: lineItem2.quantity
      })
      const channelItem2 = await factory.createTestChannelItem(channel, user, {
        productId: lineItem2.productId,
        variantId: lineItem2.variantId,
        quantity: lineItem2.quantity
      })
      await factory.createTestMatch(shopItem2, channelItem2, user)

      // Act: Call getMatches
      const result = await getMatches({ orderId: order.id, context })

      // Assert: Verify cart items were created for both products
      expect(result).toBeDefined()

      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })

      expect(cartItems).toHaveLength(2)
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledTimes(2)
    })
  })

  describe('Price Change Detection', () => {
    it('should detect price changes and add error message to cart item', async () => {
      // Arrange: Create scenario with price-changed product
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      const lineItem = await factory.createTestLineItem(order, {
        productId: testScenarios.priceChange.productId,
        variantId: testScenarios.priceChange.variantId
      })

      // Create match with original price
      const shopItem = await factory.createTestShopItem(shop, user, {
        productId: lineItem.productId,
        variantId: lineItem.variantId,
        quantity: lineItem.quantity
      })
      const channelItem = await factory.createTestChannelItem(channel, user, {
        productId: lineItem.productId,
        variantId: lineItem.variantId,
        quantity: lineItem.quantity,
        price: testScenarios.priceChange.originalPrice
      })
      await factory.createTestMatch(shopItem, channelItem, user)

      // Act: Call getMatches
      const result = await getMatches({ orderId: order.id, context })

      // Assert: Verify price change was detected and error added
      expect(result).toBeDefined()

      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })

      expect(cartItems).toHaveLength(1)
      expect(cartItems[0]).toMatchObject({
        price: testScenarios.priceChange.newPrice,
        error: `Price changed: ${testScenarios.priceChange.originalPrice} → ${testScenarios.priceChange.newPrice}. Verify before placing order.`
      })
    })

    it('should not add error when price remains the same', async () => {
      // Arrange: Create scenario with unchanged price
      const { user, shop, channel, order, lineItem, match } = await factory.createCompleteTestScenario()

      // Act: Call getMatches
      const result = await getMatches({ orderId: order.id, context })

      // Assert: Verify no error was added
      expect(result).toBeDefined()

      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })

      expect(cartItems).toHaveLength(1)
      expect(cartItems[0].error).toBeNull()
    })
  })

  describe('No Match Scenarios', () => {
    it('should set order error when no matches found for single item', async () => {
      // Arrange: Create order without any matches
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const order = await factory.createTestOrder(shop, user)
      await factory.createTestLineItem(order)

      // Act: Call getMatches
      const result = await getMatches({ orderId: order.id, context })

      // Assert: Verify no result and order error set
      expect(result).toBeUndefined()

      const updatedOrder = await context.db.Order.findOne({
        where: { id: order.id }
      })

      expect(updatedOrder.orderError).toBe('No matches found')
    })

    it('should set order error when some line items not matched', async () => {
      // Arrange: Create order with multiple line items, only one matched
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)

      // Create first line item with match
      const lineItem1 = await factory.createTestLineItem(order, {
        productId: 'matched-product',
        variantId: 'matched-variant'
      })
      const shopItem1 = await factory.createTestShopItem(shop, user, {
        productId: lineItem1.productId,
        variantId: lineItem1.variantId,
        quantity: lineItem1.quantity
      })
      const channelItem1 = await factory.createTestChannelItem(channel, user, {
        productId: lineItem1.productId,
        variantId: lineItem1.variantId,
        quantity: lineItem1.quantity
      })
      await factory.createTestMatch(shopItem1, channelItem1, user)

      // Create second line item without match
      await factory.createTestLineItem(order, {
        productId: 'unmatched-product',
        variantId: 'unmatched-variant'
      })

      // Act: Call getMatches
      const result = await getMatches({ orderId: order.id, context })

      // Assert: Verify partial matches handled and order error set
      expect(result).toBeDefined() // Should return something for the matched item

      const updatedOrder = await context.db.Order.findOne({
        where: { id: order.id }
      })

      expect(updatedOrder.orderError).toBe('Some lineItems not matched')
      expect(updatedOrder.status).toBe('PENDING')
    })
  })

  describe('Error Handling', () => {
    it('should throw error when order not found', async () => {
      // Act & Assert: Call getMatches with non-existent order ID
      await expect(
        getMatches({ orderId: 'non-existent-order', context })
      ).rejects.toThrow('Order not found')
    })

    it('should handle platform adapter errors gracefully', async () => {
      // Arrange: Create scenario that will trigger adapter error
      const { user, shop, channel, order, lineItem, match } = await factory.createCompleteTestScenario()

      // Mock adapter to throw error
      mockAdapters.mockChannelExecutor.mockRejectedValueOnce(
        new Error('Platform API unavailable')
      )

      // Act & Assert: Verify error is propagated
      await expect(
        getMatches({ orderId: order.id, context })
      ).rejects.toThrow('Platform API unavailable')
    })
  })

  describe('Authentication', () => {
    it('should require valid session for addMatchToCart mutation', async () => {
      // This would test the actual GraphQL mutation which requires session
      // The getMatches helper function doesn't check session, but the mutation does
      const { user, shop, channel, order } = await factory.createCompleteTestScenario()

      // Create context without session
      const contextWithoutSession = {
        ...context,
        session: null
      }

      // Import the actual mutation
      const addMatchToCart = (await import('@/features/keystone/extendGraphqlSchema/mutations/addMatchToCart')).default

      // Act & Assert: Verify authentication error
      await expect(
        addMatchToCart(null, { orderId: order.id }, contextWithoutSession)
      ).rejects.toThrow('You must be logged in to do this!')
    })
  })
})

afterAll(async () => {
  await closeTestDatabase()
})