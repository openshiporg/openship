import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTestContext, resetTestDatabase, closeTestDatabase } from '../setup/test-database'
import { TestDataFactory } from '../fixtures/factories'
import { mockPlatformAdapters } from '../mocks/platform-adapters'
import matchOrder from '@/features/keystone/extendGraphqlSchema/mutations/matchOrder'
import type { KeystoneContext } from '@keystone-6/core/types'

describe('matchOrder Mutation', () => {
  let context: KeystoneContext
  let factory: TestDataFactory
  let mockAdapters: ReturnType<typeof mockPlatformAdapters>

  beforeEach(async () => {
    context = await getTestContext()
    factory = new TestDataFactory(context)
    mockAdapters = mockPlatformAdapters()
    await resetTestDatabase()
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  describe('Match Creation', () => {
    it('should successfully create a new match from order line items and cart items', async () => {
      // Arrange: Create order with line items and cart items
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      // Create line item
      const lineItem = await factory.createTestLineItem(order, {
        productId: 'test-product-1',
        variantId: 'test-variant-1',
        quantity: 2,
        price: '25.00'
      })
      
      // Create cart item
      const cartItem = await factory.createTestCartItem(order, channel, user, {
        productId: 'channel-product-1',
        variantId: 'channel-variant-1',
        quantity: 2,
        price: '29.99'
      })

      // Create context with session
      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Act: Call matchOrder mutation
      const result = await matchOrder(null, { orderId: order.id }, contextWithSession)

      // Assert: Verify match was created
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()

      // Verify ShopItem was created
      const shopItems = await context.db.ShopItem.findMany({
        where: { shop: { id: { equals: shop.id } } }
      })
      expect(shopItems).toHaveLength(1)
      expect(shopItems[0]).toMatchObject({
        productId: lineItem.productId,
        variantId: lineItem.variantId,
        quantity: lineItem.quantity
      })

      // Verify ChannelItem was created
      const channelItems = await context.db.ChannelItem.findMany({
        where: { channel: { id: { equals: channel.id } } }
      })
      expect(channelItems).toHaveLength(1)
      expect(channelItems[0]).toMatchObject({
        productId: cartItem.productId,
        variantId: cartItem.variantId,
        quantity: cartItem.quantity,
        price: cartItem.price
      })

      // Verify Match was created with correct relationships
      const matches = await context.db.Match.findMany({
        where: { user: { id: { equals: user.id } } },
        query: `
          id
          input { id productId variantId quantity }
          output { id productId variantId quantity price }
        `
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].input).toHaveLength(1)
      expect(matches[0].output).toHaveLength(1)
    })

    it('should handle multiple line items and cart items', async () => {
      // Arrange: Create order with multiple line items and cart items
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      // Create multiple line items
      const lineItem1 = await factory.createTestLineItem(order, {
        productId: 'shop-product-1',
        variantId: 'shop-variant-1',
        quantity: 1
      })
      const lineItem2 = await factory.createTestLineItem(order, {
        productId: 'shop-product-2',
        variantId: 'shop-variant-2',
        quantity: 3
      })
      
      // Create multiple cart items
      const cartItem1 = await factory.createTestCartItem(order, channel, user, {
        productId: 'channel-product-1',
        variantId: 'channel-variant-1',
        quantity: 1
      })
      const cartItem2 = await factory.createTestCartItem(order, channel, user, {
        productId: 'channel-product-2',
        variantId: 'channel-variant-2',
        quantity: 3
      })

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Act: Call matchOrder mutation
      const result = await matchOrder(null, { orderId: order.id }, contextWithSession)

      // Assert: Verify match was created with multiple input/output items
      expect(result).toBeDefined()

      const matches = await context.db.Match.findMany({
        where: { user: { id: { equals: user.id } } },
        query: `
          id
          input { id productId variantId quantity }
          output { id productId variantId quantity }
        `
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].input).toHaveLength(2)
      expect(matches[0].output).toHaveLength(2)
    })

    it('should reuse existing ShopItems and ChannelItems when they match', async () => {
      // Arrange: Create existing ShopItem and ChannelItem
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      
      // Create existing items
      const existingShopItem = await factory.createTestShopItem(shop, user, {
        productId: 'existing-product',
        variantId: 'existing-variant',
        quantity: 1
      })
      const existingChannelItem = await factory.createTestChannelItem(channel, user, {
        productId: 'existing-channel-product',
        variantId: 'existing-channel-variant',
        quantity: 1,
        price: '19.99'
      })

      // Create order with matching line items and cart items
      const order = await factory.createTestOrder(shop, user)
      await factory.createTestLineItem(order, {
        productId: 'existing-product',
        variantId: 'existing-variant',
        quantity: 1
      })
      await factory.createTestCartItem(order, channel, user, {
        productId: 'existing-channel-product',
        variantId: 'existing-channel-variant',
        quantity: 1,
        price: '19.99'
      })

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Act: Call matchOrder mutation
      const result = await matchOrder(null, { orderId: order.id }, contextWithSession)

      // Assert: Verify existing items were reused (no new items created)
      const shopItems = await context.db.ShopItem.findMany({
        where: { shop: { id: { equals: shop.id } } }
      })
      expect(shopItems).toHaveLength(1)
      expect(shopItems[0].id).toBe(existingShopItem.id)

      const channelItems = await context.db.ChannelItem.findMany({
        where: { channel: { id: { equals: channel.id } } }
      })
      expect(channelItems).toHaveLength(1)
      expect(channelItems[0].id).toBe(existingChannelItem.id)
    })
  })

  describe('Existing Match Handling', () => {
    it('should delete existing match before creating new one', async () => {
      // Arrange: Create existing match
      const { user, shop, channel, order, lineItem, shopItem, channelItem, match } = 
        await factory.createCompleteTestScenario()

      // Create cart item for new match
      await factory.createTestCartItem(order, channel, user, {
        productId: 'new-channel-product',
        variantId: 'new-channel-variant',
        quantity: lineItem.quantity
      })

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Verify existing match exists
      const existingMatches = await context.db.Match.findMany({
        where: { user: { id: { equals: user.id } } }
      })
      expect(existingMatches).toHaveLength(1)

      // Act: Call matchOrder mutation
      const result = await matchOrder(null, { orderId: order.id }, contextWithSession)

      // Assert: Verify old match was deleted and new match created
      const newMatches = await context.db.Match.findMany({
        where: { user: { id: { equals: user.id } } }
      })
      expect(newMatches).toHaveLength(1)
      expect(newMatches[0].id).not.toBe(match.id) // Different match ID
    })

    it('should only delete matches that exactly match the order line items', async () => {
      // Arrange: Create multiple matches, only one should be deleted
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      
      // Create first match that will be replaced
      const order1 = await factory.createTestOrder(shop, user)
      const lineItem1 = await factory.createTestLineItem(order1, {
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 1
      })
      const shopItem1 = await factory.createTestShopItem(shop, user, {
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 1
      })
      const channelItem1 = await factory.createTestChannelItem(channel, user, {
        productId: 'channel-product-1',
        variantId: 'channel-variant-1',
        quantity: 1
      })
      const match1 = await factory.createTestMatch(shopItem1, channelItem1, user)

      // Create second match that should remain
      const shopItem2 = await factory.createTestShopItem(shop, user, {
        productId: 'product-2',
        variantId: 'variant-2',
        quantity: 1
      })
      const channelItem2 = await factory.createTestChannelItem(channel, user, {
        productId: 'channel-product-2',
        variantId: 'channel-variant-2',
        quantity: 1
      })
      const match2 = await factory.createTestMatch(shopItem2, channelItem2, user)

      // Create cart item for new match
      await factory.createTestCartItem(order1, channel, user, {
        productId: 'new-channel-product',
        variantId: 'new-channel-variant',
        quantity: 1
      })

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Act: Call matchOrder mutation
      await matchOrder(null, { orderId: order1.id }, contextWithSession)

      // Assert: Verify only the relevant match was deleted
      const remainingMatches = await context.db.Match.findMany({
        where: { user: { id: { equals: user.id } } }
      })
      expect(remainingMatches).toHaveLength(2) // One new match + one untouched match
      
      // Verify the untouched match still exists
      const untouchedMatch = remainingMatches.find(m => m.id === match2.id)
      expect(untouchedMatch).toBeDefined()
    })
  })

  describe('Data Filtering and Transformation', () => {
    it('should exclude price from ShopItem data', async () => {
      // Arrange: Create order with line item that has price
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestLineItem(order, {
        price: '25.99' // This should be filtered out for ShopItem
      })
      await factory.createTestCartItem(order, channel, user)

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Act: Call matchOrder mutation
      await matchOrder(null, { orderId: order.id }, contextWithSession)

      // Assert: Verify ShopItem doesn't have price field
      const shopItems = await context.db.ShopItem.findMany({
        where: { shop: { id: { equals: shop.id } } }
      })
      expect(shopItems).toHaveLength(1)
      expect(shopItems[0].price).toBeUndefined()
    })

    it('should include price in ChannelItem data', async () => {
      // Arrange: Create order with cart item that has price
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestLineItem(order)
      await factory.createTestCartItem(order, channel, user, {
        price: '29.99'
      })

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Act: Call matchOrder mutation
      await matchOrder(null, { orderId: order.id }, contextWithSession)

      // Assert: Verify ChannelItem has price field
      const channelItems = await context.db.ChannelItem.findMany({
        where: { channel: { id: { equals: channel.id } } }
      })
      expect(channelItems).toHaveLength(1)
      expect(channelItems[0].price).toBe('29.99')
    })

    it('should filter out system fields from item creation', async () => {
      // Arrange: Create order with items containing system fields
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      // These system fields should be filtered out
      await factory.createTestLineItem(order)
      await factory.createTestCartItem(order, channel, user)

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Act: Call matchOrder mutation
      const result = await matchOrder(null, { orderId: order.id }, contextWithSession)

      // Assert: Verify result doesn't contain system fields
      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should throw error when user not logged in', async () => {
      // Arrange: Create context without session
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const order = await factory.createTestOrder(shop, user)

      const contextWithoutSession = {
        ...context,
        session: null
      }

      // Act & Assert: Verify authentication error
      await expect(
        matchOrder(null, { orderId: order.id }, contextWithoutSession)
      ).rejects.toThrow('You must be logged in to do this!')
    })

    it('should throw error when user session is invalid', async () => {
      // Arrange: Create context with invalid session
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const order = await factory.createTestOrder(shop, user)

      const contextWithInvalidSession = {
        ...context,
        session: { itemId: null }
      }

      // Act & Assert: Verify authentication error
      await expect(
        matchOrder(null, { orderId: order.id }, contextWithInvalidSession)
      ).rejects.toThrow('You must be logged in to do this!')
    })

    it('should handle database errors gracefully', async () => {
      // Arrange: Create scenario that will cause database error
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestLineItem(order)
      await factory.createTestCartItem(order, channel, user)

      // Create context with session but mock database to fail
      const contextWithSession = {
        ...context,
        session: { itemId: user.id },
        db: {
          ...context.db,
          Match: {
            ...context.db.Match,
            createOne: vi.fn().mockRejectedValue(new Error('Database connection failed'))
          }
        }
      }

      // Act & Assert: Verify database error is propagated
      await expect(
        matchOrder(null, { orderId: order.id }, contextWithSession)
      ).rejects.toThrow('Database connection failed')
    })
  })
})

afterAll(async () => {
  await closeTestDatabase()
})