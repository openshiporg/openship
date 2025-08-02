import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTestContext, resetTestDatabase, closeTestDatabase } from '../setup/test-database'
import { TestDataFactory } from '../fixtures/factories'
import { mockPlatformAdapters, createTestScenarios } from '../mocks/platform-adapters'
import { placeMultipleOrders } from '@/features/keystone/lib/placeMultipleOrders'
import type { KeystoneContext } from '@keystone-6/core/types'

describe('placeOrders Mutation', () => {
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

  describe('Successful Order Processing', () => {
    it('should successfully process a single order with cart items', async () => {
      // Arrange: Create complete order scenario with cart items
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      // Create cart items ready for processing
      const cartItem1 = await factory.createTestCartItem(order, channel, user, {
        productId: testScenarios.perfectMatch.productId,
        variantId: testScenarios.perfectMatch.variantId,
        quantity: 2,
        price: '29.99',
        purchaseId: '', // Empty indicates not processed yet
        url: ''
      })
      const cartItem2 = await factory.createTestCartItem(order, channel, user, {
        productId: 'test-product-2',
        variantId: 'test-variant-2',
        quantity: 1,
        price: '39.99',
        purchaseId: '',
        url: ''
      })

      // Act: Process the orders
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify successful processing
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        orderId: order.orderId,
        status: 'AWAITING' // Should be AWAITING after successful processing
      })

      // Verify cart items were updated with purchase information
      const updatedCartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      
      expect(updatedCartItems).toHaveLength(2)
      updatedCartItems.forEach(item => {
        expect(item.purchaseId).toMatch(/test-purchase-\d+/)
        expect(item.url).toMatch(/https:\/\/test-channel\.com\/orders\/test-purchase-\d+/)
        expect(item.error).toBeNull()
      })

      // Verify platform adapter was called correctly
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledWith({
        platform: expect.objectContaining({
          createPurchaseFunction: expect.any(String)
        }),
        functionName: 'createPurchaseFunction',
        args: {
          cartItems: expect.arrayContaining([
            expect.objectContaining({
              productId: cartItem1.productId,
              quantity: cartItem1.quantity
            })
          ]),
          shipping: expect.objectContaining({
            firstName: order.firstName,
            lastName: order.lastName,
            email: user.email
          }),
          notes: order.note
        }
      })
    })

    it('should process multiple orders independently', async () => {
      // Arrange: Create multiple orders
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      
      const order1 = await factory.createTestOrder(shop, user, { orderName: '#TEST-001' })
      const order2 = await factory.createTestOrder(shop, user, { orderName: '#TEST-002' })
      
      await factory.createTestCartItem(order1, channel, user, { 
        productId: 'product-1',
        purchaseId: '',
        url: ''
      })
      await factory.createTestCartItem(order2, channel, user, { 
        productId: 'product-2',
        purchaseId: '',
        url: ''
      })

      // Act: Process both orders
      const result = await placeMultipleOrders({ 
        ids: [order1.id, order2.id], 
        query: context.query 
      })

      // Assert: Verify both orders processed
      expect(result).toHaveLength(2)
      expect(result.map(r => r.orderName)).toContain('#TEST-001')
      expect(result.map(r => r.orderName)).toContain('#TEST-002')
      
      // Verify platform adapter called for each order
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledTimes(2)
    })

    it('should handle orders with multiple channels', async () => {
      // Arrange: Create order with cart items from different channels
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel1 = await factory.createTestChannel(user, { name: 'Channel 1' })
      const channel2 = await factory.createTestChannel(user, { name: 'Channel 2' })
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestCartItem(order, channel1, user, {
        productId: 'channel1-product',
        purchaseId: '',
        url: ''
      })
      await factory.createTestCartItem(order, channel2, user, {
        productId: 'channel2-product', 
        purchaseId: '',
        url: ''
      })

      // Act: Process the order
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify processing across multiple channels
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('AWAITING')
      
      // Verify platform adapter called for each channel
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledTimes(2)
    })
  })

  describe('Error Handling', () => {
    it('should handle channel purchase failures', async () => {
      // Arrange: Create order with product that will cause purchase failure
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestCartItem(order, channel, user, {
        productId: testScenarios.insufficientInventory.productId,
        variantId: testScenarios.insufficientInventory.variantId,
        purchaseId: '',
        url: ''
      })

      // Act: Process the order
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify error handling
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('PENDING') // Should remain PENDING on failure

      // Verify cart items have error messages
      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      
      expect(cartItems[0].error).toBe('Failed to create purchase: Insufficient inventory')
      expect(cartItems[0].purchaseId).toBe('')
      expect(cartItems[0].url).toBe('')
    })

    it('should handle authentication errors', async () => {
      // Arrange: Create order with product that will cause auth error
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestCartItem(order, channel, user, {
        productId: testScenarios.authError.productId,
        variantId: testScenarios.authError.variantId,
        purchaseId: '',
        url: ''
      })

      // Act: Process the order
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify auth error handling
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('PENDING')

      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      
      expect(cartItems[0].error).toBe('Authentication failed: Invalid access token')
    })

    it('should handle platform adapter exceptions', async () => {
      // Arrange: Create order and mock adapter to throw exception
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestCartItem(order, channel, user, {
        purchaseId: '',
        url: ''
      })

      // Mock adapter to throw exception
      mockAdapters.mockChannelExecutor.mockRejectedValueOnce(
        new Error('Network timeout')
      )

      // Act: Process the order
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify exception handling
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('PENDING')

      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      
      expect(cartItems[0].error).toBe('Network timeout')
    })
  })

  describe('Partial Success Scenarios', () => {
    it('should handle mixed success and failure across channels', async () => {
      // Arrange: Create order with items from different channels, one will fail
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const successChannel = await factory.createTestChannel(user, { name: 'Success Channel' })
      const failChannel = await factory.createTestChannel(user, { name: 'Fail Channel' })
      const order = await factory.createTestOrder(shop, user)
      
      // Success item
      await factory.createTestCartItem(order, successChannel, user, {
        productId: testScenarios.perfectMatch.productId,
        purchaseId: '',
        url: ''
      })
      
      // Failure item
      await factory.createTestCartItem(order, failChannel, user, {
        productId: testScenarios.insufficientInventory.productId,
        purchaseId: '',
        url: ''
      })

      // Act: Process the order
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify partial success handling
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('PENDING') // Should be PENDING if any items failed

      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      
      // Success item should have purchase info
      const successItem = cartItems.find(item => item.productId === testScenarios.perfectMatch.productId)
      expect(successItem.purchaseId).toMatch(/test-purchase-\d+/)
      expect(successItem.error).toBeNull()
      
      // Failure item should have error
      const failItem = cartItems.find(item => item.productId === testScenarios.insufficientInventory.productId)
      expect(failItem.error).toBeTruthy()
      expect(failItem.purchaseId).toBe('')
    })
  })

  describe('Shop Platform Integration', () => {
    it('should call shop platform addCartToPlatformOrder on successful completion', async () => {
      // Arrange: Create successful order scenario
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      await factory.createTestCartItem(order, channel, user, {
        productId: testScenarios.perfectMatch.productId,
        purchaseId: '',
        url: ''
      })

      // Act: Process the order
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify shop platform function was called
      expect(result[0].status).toBe('AWAITING')
      expect(mockAdapters.mockShopAdapter.addCartToPlatformOrderFunction).toHaveBeenCalledWith({
        platform: expect.objectContaining({
          addCartToPlatformOrderFunction: expect.any(String)
        }),
        cartItems: expect.arrayContaining([
          expect.objectContaining({
            productId: testScenarios.perfectMatch.productId,
            purchaseId: expect.stringMatching(/test-purchase-\d+/)
          })
        ]),
        orderId: order.orderId
      })
    })

    it('should handle shop platform errors gracefully', async () => {
      // Arrange: Create order and mock shop platform to fail
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user, { 
        orderId: testScenarios.platformOrderFailure.orderId 
      })
      
      await factory.createTestCartItem(order, channel, user, {
        productId: testScenarios.perfectMatch.productId,
        purchaseId: '',
        url: ''
      })

      // Act: Process the order (shop platform will fail but shouldn't break flow)
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify order still processed despite shop platform failure
      expect(result[0].status).toBe('AWAITING') // Order should still be AWAITING
      
      // Verify shop platform was called but failed gracefully
      expect(mockAdapters.mockShopAdapter.addCartToPlatformOrderFunction).toHaveBeenCalled()
    })
  })

  describe('Data Validation', () => {
    it('should only process cart items without existing purchaseId or url', async () => {
      // Arrange: Create order with mix of processed and unprocessed cart items
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)
      
      // Already processed item (should be skipped)
      await factory.createTestCartItem(order, channel, user, {
        productId: 'already-processed',
        purchaseId: 'existing-purchase-123',
        url: 'https://existing.com/order'
      })
      
      // Unprocessed item (should be processed)
      await factory.createTestCartItem(order, channel, user, {
        productId: 'needs-processing',
        purchaseId: '',
        url: ''
      })

      // Act: Process the order
      const result = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify only unprocessed items were included
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledTimes(1)
      
      const callArgs = mockAdapters.mockChannelExecutor.mock.calls[0][0]
      expect(callArgs.args.cartItems).toHaveLength(1)
      expect(callArgs.args.cartItems[0].productId).toBe('needs-processing')
    })

    it('should include all required shipping and order information', async () => {
      // Arrange: Create order with complete shipping info
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user, {
        firstName: 'John',
        lastName: 'Doe',
        streetAddress1: '123 Main St',
        streetAddress2: 'Apt 4B',
        city: 'Anytown',
        state: 'CA',
        zip: '12345',
        country: 'US',
        phoneNumber: '+1-555-123-4567',
        note: 'Please handle with care',
        shippingMethod: 'standard'
      })
      
      await factory.createTestCartItem(order, channel, user, {
        purchaseId: '',
        url: ''
      })

      // Act: Process the order
      await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Assert: Verify all shipping info was included
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledWith({
        platform: expect.any(Object),
        functionName: 'createPurchaseFunction',
        args: {
          cartItems: expect.any(Array),
          shipping: {
            firstName: 'John',
            lastName: 'Doe',
            streetAddress1: '123 Main St',
            streetAddress2: 'Apt 4B',
            city: 'Anytown',
            state: 'CA',
            zip: '12345',
            country: 'US',
            phoneNumber: '+1-555-123-4567',
            email: user.email,
            shippingMethod: 'standard'
          },
          notes: 'Please handle with care'
        }
      })
    })
  })
})

afterAll(async () => {
  await closeTestDatabase()
})