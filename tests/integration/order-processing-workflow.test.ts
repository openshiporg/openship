import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTestContext, resetTestDatabase, closeTestDatabase } from '../setup/test-database'
import { TestDataFactory } from '../fixtures/factories'
import { mockPlatformAdapters, createTestScenarios } from '../mocks/platform-adapters'
import { getMatches } from '@/features/keystone/extendGraphqlSchema/mutations/addMatchToCart'
import matchOrder from '@/features/keystone/extendGraphqlSchema/mutations/matchOrder'
import { placeMultipleOrders } from '@/features/keystone/lib/placeMultipleOrders'
import type { KeystoneContext } from '@keystone-6/core/types'

describe('Complete Order Processing Workflow Integration Tests', () => {
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

  describe('Perfect Order Processing Flow', () => {
    it('should complete the entire workflow: GET MATCH → SAVE MATCH → PLACE ORDER', async () => {
      // Arrange: Create a complete test scenario
      const { user, shop, channel, order, lineItem, match } = await factory.createCompleteTestScenario()

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Step 1: GET MATCH - Find existing matches and create cart items
      console.log('Step 1: GET MATCH')
      const getMatchResult = await getMatches({ orderId: order.id, context })
      
      expect(getMatchResult).toBeDefined()
      
      // Verify cart items were created
      let cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      expect(cartItems).toHaveLength(1)
      expect(cartItems[0]).toMatchObject({
        productId: lineItem.productId,
        variantId: lineItem.variantId,
        quantity: lineItem.quantity,
        price: '29.99' // From mock response
      })

      // Step 2: SAVE MATCH - Create new match relationship
      console.log('Step 2: SAVE MATCH')
      const saveMatchResult = await matchOrder(null, { orderId: order.id }, contextWithSession)
      
      expect(saveMatchResult).toBeDefined()
      
      // Verify new match was created (old one deleted, new one created)
      const matches = await context.db.Match.findMany({
        where: { user: { id: { equals: user.id } } }
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].id).not.toBe(match.id) // Different match ID

      // Step 3: PLACE ORDER - Process the order through channel platform
      console.log('Step 3: PLACE ORDER')
      const placeOrderResult = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })
      
      expect(placeOrderResult).toHaveLength(1)
      expect(placeOrderResult[0]).toMatchObject({
        orderId: order.orderId,
        status: 'AWAITING'
      })

      // Verify final state - cart items should have purchase information
      cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      expect(cartItems[0]).toMatchObject({
        purchaseId: expect.stringMatching(/test-purchase-\d+/),
        url: expect.stringMatching(/https:\/\/test-channel\.com\/orders\/test-purchase-\d+/),
        error: null
      })

      // Verify all platform adapters were called in correct sequence
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledTimes(2) // getProduct + createPurchase
      expect(mockAdapters.mockShopAdapter.addCartToPlatformOrderFunction).toHaveBeenCalledTimes(1)

      console.log('✅ Complete workflow successful')
    })

    it('should handle multi-item orders through complete workflow', async () => {
      // Arrange: Create order with multiple line items and matches
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      const order = await factory.createTestOrder(shop, user)

      // Create multiple line items
      const lineItem1 = await factory.createTestLineItem(order, {
        productId: 'multi-product-1',
        variantId: 'multi-variant-1',
        quantity: 2
      })
      const lineItem2 = await factory.createTestLineItem(order, {
        productId: 'multi-product-2', 
        variantId: 'multi-variant-2',
        quantity: 1
      })

      // Create matches for each line item
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
      const match1 = await factory.createTestMatch(shopItem1, channelItem1, user)

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
      const match2 = await factory.createTestMatch(shopItem2, channelItem2, user)

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Execute complete workflow
      const getMatchResult = await getMatches({ orderId: order.id, context })
      expect(getMatchResult).toBeDefined()

      const saveMatchResult = await matchOrder(null, { orderId: order.id }, contextWithSession)
      expect(saveMatchResult).toBeDefined()

      const placeOrderResult = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })
      expect(placeOrderResult[0].status).toBe('AWAITING')

      // Verify all items processed
      const finalCartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      expect(finalCartItems).toHaveLength(2)
      finalCartItems.forEach(item => {
        expect(item.purchaseId).toMatch(/test-purchase-\d+/)
        expect(item.error).toBeNull()
      })

      console.log('✅ Multi-item workflow successful')
    })
  })

  describe('Error Recovery Workflows', () => {
    it('should handle price changes detected during GET MATCH step', async () => {
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

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Execute workflow with price change detection
      const getMatchResult = await getMatches({ orderId: order.id, context })
      expect(getMatchResult).toBeDefined()

      // Verify price change was detected
      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      expect(cartItems[0].error).toContain('Price changed')

      // Continue workflow despite price change
      const saveMatchResult = await matchOrder(null, { orderId: order.id }, contextWithSession)
      expect(saveMatchResult).toBeDefined()

      const placeOrderResult = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })
      
      // Should still process successfully with new price
      expect(placeOrderResult[0].status).toBe('AWAITING')

      console.log('✅ Price change workflow handled successfully')
    })

    it('should handle partial failures during PLACE ORDER step', async () => {
      // Arrange: Create scenario with mix of success and failure products
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const successChannel = await factory.createTestChannel(user, { name: 'Success Channel' })
      const failChannel = await factory.createTestChannel(user, { name: 'Fail Channel' })
      const order = await factory.createTestOrder(shop, user)

      // Success item
      const successLineItem = await factory.createTestLineItem(order, {
        productId: testScenarios.perfectMatch.productId,
        variantId: testScenarios.perfectMatch.variantId
      })
      const successShopItem = await factory.createTestShopItem(shop, user, {
        productId: successLineItem.productId,
        variantId: successLineItem.variantId,
        quantity: successLineItem.quantity
      })
      const successChannelItem = await factory.createTestChannelItem(successChannel, user, {
        productId: successLineItem.productId,
        variantId: successLineItem.variantId,
        quantity: successLineItem.quantity
      })
      await factory.createTestMatch(successShopItem, successChannelItem, user)

      // Failure item
      const failLineItem = await factory.createTestLineItem(order, {
        productId: testScenarios.insufficientInventory.productId,
        variantId: testScenarios.insufficientInventory.variantId
      })
      const failShopItem = await factory.createTestShopItem(shop, user, {
        productId: failLineItem.productId,
        variantId: failLineItem.variantId,
        quantity: failLineItem.quantity
      })
      const failChannelItem = await factory.createTestChannelItem(failChannel, user, {
        productId: failLineItem.productId,
        variantId: failLineItem.variantId,
        quantity: failLineItem.quantity
      })
      await factory.createTestMatch(failShopItem, failChannelItem, user)

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Execute complete workflow
      const getMatchResult = await getMatches({ orderId: order.id, context })
      expect(getMatchResult).toBeDefined()

      const saveMatchResult = await matchOrder(null, { orderId: order.id }, contextWithSession)
      expect(saveMatchResult).toBeDefined()

      const placeOrderResult = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      // Should be PENDING due to partial failure
      expect(placeOrderResult[0].status).toBe('PENDING')

      // Verify partial success handling
      const finalCartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      
      const successItem = finalCartItems.find(item => item.productId === testScenarios.perfectMatch.productId)
      expect(successItem.purchaseId).toMatch(/test-purchase-\d+/)
      expect(successItem.error).toBeNull()

      const failItem = finalCartItems.find(item => item.productId === testScenarios.insufficientInventory.productId)
      expect(failItem.error).toContain('Insufficient inventory')
      expect(failItem.purchaseId).toBe('')

      console.log('✅ Partial failure workflow handled correctly')
    })

    it('should handle orders with no matches found', async () => {
      // Arrange: Create order without any matches
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const order = await factory.createTestOrder(shop, user)
      await factory.createTestLineItem(order, {
        productId: 'unmatched-product',
        variantId: 'unmatched-variant'
      })

      // Execute workflow with no matches
      const getMatchResult = await getMatches({ orderId: order.id, context })
      expect(getMatchResult).toBeUndefined()

      // Verify order error was set
      const updatedOrder = await context.db.Order.findOne({
        where: { id: order.id }
      })
      expect(updatedOrder.orderError).toBe('No matches found')

      // Workflow should stop here - no cart items to process
      const cartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      expect(cartItems).toHaveLength(0)

      console.log('✅ No matches workflow handled correctly')
    })
  })

  describe('Multi-Channel Workflows', () => {
    it('should process orders across multiple channels independently', async () => {
      // Arrange: Create order with items from different channels
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel1 = await factory.createTestChannel(user, { 
        name: 'Channel 1',
        domain: 'channel1.example.com'
      })
      const channel2 = await factory.createTestChannel(user, { 
        name: 'Channel 2',
        domain: 'channel2.example.com'
      })
      const order = await factory.createTestOrder(shop, user)

      // Create items for each channel
      const lineItem1 = await factory.createTestLineItem(order, {
        productId: 'channel1-product',
        variantId: 'channel1-variant'
      })
      const shopItem1 = await factory.createTestShopItem(shop, user, {
        productId: lineItem1.productId,
        variantId: lineItem1.variantId,
        quantity: lineItem1.quantity
      })
      const channelItem1 = await factory.createTestChannelItem(channel1, user, {
        productId: lineItem1.productId,
        variantId: lineItem1.variantId,
        quantity: lineItem1.quantity
      })
      await factory.createTestMatch(shopItem1, channelItem1, user)

      const lineItem2 = await factory.createTestLineItem(order, {
        productId: 'channel2-product',
        variantId: 'channel2-variant'
      })
      const shopItem2 = await factory.createTestShopItem(shop, user, {
        productId: lineItem2.productId,
        variantId: lineItem2.variantId,
        quantity: lineItem2.quantity
      })
      const channelItem2 = await factory.createTestChannelItem(channel2, user, {
        productId: lineItem2.productId,
        variantId: lineItem2.variantId,
        quantity: lineItem2.quantity
      })
      await factory.createTestMatch(shopItem2, channelItem2, user)

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Execute complete workflow
      const getMatchResult = await getMatches({ orderId: order.id, context })
      const saveMatchResult = await matchOrder(null, { orderId: order.id }, contextWithSession)
      const placeOrderResult = await placeMultipleOrders({ 
        ids: [order.id], 
        query: context.query 
      })

      expect(placeOrderResult[0].status).toBe('AWAITING')

      // Verify both channels were called
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledTimes(4) // 2 getProduct + 2 createPurchase

      // Verify items from both channels processed
      const finalCartItems = await context.db.CartItem.findMany({
        where: { order: { id: { equals: order.id } } }
      })
      expect(finalCartItems).toHaveLength(2)
      finalCartItems.forEach(item => {
        expect(item.purchaseId).toMatch(/test-purchase-\d+/)
      })

      console.log('✅ Multi-channel workflow successful')
    })
  })

  describe('Bulk Order Processing', () => {
    it('should process multiple orders simultaneously', async () => {
      // Arrange: Create multiple complete orders
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user)
      const channel = await factory.createTestChannel(user)
      
      const orders = []
      for (let i = 1; i <= 3; i++) {
        const order = await factory.createTestOrder(shop, user, { 
          orderName: `#BULK-00${i}` 
        })
        const lineItem = await factory.createTestLineItem(order, {
          productId: `bulk-product-${i}`,
          variantId: `bulk-variant-${i}`
        })
        const shopItem = await factory.createTestShopItem(shop, user, {
          productId: lineItem.productId,
          variantId: lineItem.variantId,
          quantity: lineItem.quantity
        })
        const channelItem = await factory.createTestChannelItem(channel, user, {
          productId: lineItem.productId,
          variantId: lineItem.variantId,
          quantity: lineItem.quantity
        })
        await factory.createTestMatch(shopItem, channelItem, user)
        orders.push(order)
      }

      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Process all orders
      for (const order of orders) {
        await getMatches({ orderId: order.id, context })
        await matchOrder(null, { orderId: order.id }, contextWithSession)
      }

      const placeOrderResult = await placeMultipleOrders({ 
        ids: orders.map(o => o.id), 
        query: context.query 
      })

      // Verify all orders processed
      expect(placeOrderResult).toHaveLength(3)
      placeOrderResult.forEach(result => {
        expect(result.status).toBe('AWAITING')
        expect(result.orderName).toMatch(/#BULK-00\d/)
      })

      // Verify platform adapters called for each order
      expect(mockAdapters.mockChannelExecutor).toHaveBeenCalledTimes(6) // 3 getProduct + 3 createPurchase

      console.log('✅ Bulk processing workflow successful')
    })
  })

  describe('Data Consistency Validation', () => {
    it('should maintain data consistency throughout complete workflow', async () => {
      // Arrange: Create complete test scenario
      const { user, shop, channel, order, lineItem, match } = await factory.createCompleteTestScenario()
      
      const contextWithSession = {
        ...context,
        session: { itemId: user.id }
      }

      // Execute complete workflow and validate data at each step
      
      // Initial state validation
      let orderData = await context.db.Order.findOne({
        where: { id: order.id },
        query: `
          id status orderError
          lineItems { id productId variantId quantity }
          cartItems { id productId variantId quantity }
        `
      })
      expect(orderData.status).toBe('PENDING')
      expect(orderData.lineItems).toHaveLength(1)
      expect(orderData.cartItems).toHaveLength(0)

      // After GET MATCH
      await getMatches({ orderId: order.id, context })
      
      orderData = await context.db.Order.findOne({
        where: { id: order.id },
        query: `
          id status orderError
          lineItems { id productId variantId quantity }
          cartItems { id productId variantId quantity price }
        `
      })
      expect(orderData.cartItems).toHaveLength(1)
      expect(orderData.cartItems[0]).toMatchObject({
        productId: lineItem.productId,
        variantId: lineItem.variantId,
        quantity: lineItem.quantity
      })

      // After SAVE MATCH
      await matchOrder(null, { orderId: order.id }, contextWithSession)
      
      const matchData = await context.db.Match.findMany({
        where: { user: { id: { equals: user.id } } },
        query: `
          id
          input { id productId variantId quantity }
          output { id productId variantId quantity }
        `
      })
      expect(matchData).toHaveLength(1)
      expect(matchData[0].input).toHaveLength(1)
      expect(matchData[0].output).toHaveLength(1)

      // After PLACE ORDER
      await placeMultipleOrders({ ids: [order.id], query: context.query })
      
      orderData = await context.db.Order.findOne({
        where: { id: order.id },
        query: `
          id status
          cartItems { id purchaseId url error }
        `
      })
      expect(orderData.status).toBe('AWAITING')
      expect(orderData.cartItems[0]).toMatchObject({
        purchaseId: expect.stringMatching(/test-purchase-\d+/),
        url: expect.stringMatching(/https:\/\/test-channel\.com/),
        error: null
      })

      console.log('✅ Data consistency maintained throughout workflow')
    })
  })
})

afterAll(async () => {
  await closeTestDatabase()
})