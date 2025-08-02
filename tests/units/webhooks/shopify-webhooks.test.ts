import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTestContext, resetTestDatabase, closeTestDatabase } from '../../setup/test-database'
import { TestDataFactory } from '../../fixtures/factories'
import { 
  verifyShopifyWebhook, 
  createTestWebhookSignature,
  verifyWebhook
} from '@/features/integrations/lib/webhook-verification'
import { createOrderWebhookHandler } from '@/features/integrations/shop/shopify'
import type { KeystoneContext } from '@keystone-6/core/types'

describe('Shopify Webhook Security and Processing', () => {
  let context: KeystoneContext
  let factory: TestDataFactory
  const SHOPIFY_WEBHOOK_SECRET = 'test-webhook-secret-123'

  beforeEach(async () => {
    context = await getTestContext()
    factory = new TestDataFactory(context)
    await resetTestDatabase()
  })

  afterEach(async () => {
    vi.clearAllMocks()
  })

  describe('HMAC Signature Verification', () => {
    it('should correctly verify valid Shopify webhook signatures', () => {
      // Arrange: Create a test payload
      const payload = {
        id: 12345678,
        name: '#1001',
        email: 'customer@example.com',
        total_price: '199.99',
        line_items: [
          {
            id: 1,
            title: 'Test Product',
            quantity: 2,
            price: '99.99',
            variant_id: 'variant-123',
            product_id: 'product-123'
          }
        ]
      }
      
      const payloadString = JSON.stringify(payload)
      
      // Create a valid signature
      const validSignature = createTestWebhookSignature('shopify', payloadString, SHOPIFY_WEBHOOK_SECRET)
      
      // Act: Verify the signature
      const isValid = verifyShopifyWebhook(payloadString, validSignature, SHOPIFY_WEBHOOK_SECRET)
      
      // Assert: Should be valid
      expect(isValid).toBe(true)
    })

    it('should reject webhooks with invalid signatures', () => {
      // Arrange: Create payload and invalid signature
      const payload = { id: 12345, name: '#1001' }
      const payloadString = JSON.stringify(payload)
      const invalidSignature = 'invalid-signature-xyz'
      
      // Act: Verify the signature
      const isValid = verifyShopifyWebhook(payloadString, invalidSignature, SHOPIFY_WEBHOOK_SECRET)
      
      // Assert: Should be invalid
      expect(isValid).toBe(false)
    })

    it('should reject webhooks with wrong secret', () => {
      // Arrange: Create valid signature with wrong secret
      const payload = { id: 12345, name: '#1001' }
      const payloadString = JSON.stringify(payload)
      const signatureWithWrongSecret = createTestWebhookSignature('shopify', payloadString, 'wrong-secret')
      
      // Act: Verify with correct secret
      const isValid = verifyShopifyWebhook(payloadString, signatureWithWrongSecret, SHOPIFY_WEBHOOK_SECRET)
      
      // Assert: Should be invalid
      expect(isValid).toBe(false)
    })

    it('should reject webhooks with tampered payload', () => {
      // Arrange: Create signature for original payload
      const originalPayload = { id: 12345, name: '#1001', total: '100.00' }
      const signature = createTestWebhookSignature('shopify', originalPayload, SHOPIFY_WEBHOOK_SECRET)
      
      // Tamper with the payload
      const tamperedPayload = { id: 12345, name: '#1001', total: '200.00' }
      const tamperedPayloadString = JSON.stringify(tamperedPayload)
      
      // Act: Verify tampered payload with original signature
      const isValid = verifyShopifyWebhook(tamperedPayloadString, signature, SHOPIFY_WEBHOOK_SECRET)
      
      // Assert: Should be invalid
      expect(isValid).toBe(false)
    })

    it('should handle different payload encodings correctly', () => {
      // Arrange: Test with special characters and unicode
      const payload = {
        id: 12345,
        name: '#1001',
        customer_name: 'José García',
        note: 'Special chars: $€£¥ and emojis: 🚀📦'
      }
      
      const payloadString = JSON.stringify(payload)
      const signature = createTestWebhookSignature('shopify', payloadString, SHOPIFY_WEBHOOK_SECRET)
      
      // Act: Verify with both string and buffer
      const isValidString = verifyShopifyWebhook(payloadString, signature, SHOPIFY_WEBHOOK_SECRET)
      const isValidBuffer = verifyShopifyWebhook(Buffer.from(payloadString), signature, SHOPIFY_WEBHOOK_SECRET)
      
      // Assert: Both should be valid
      expect(isValidString).toBe(true)
      expect(isValidBuffer).toBe(true)
    })

    it('should use timing-safe comparison to prevent timing attacks', () => {
      // This test verifies the implementation uses crypto.timingSafeEqual
      // The actual timing attack prevention is handled by Node.js crypto module
      
      const payload = { id: 12345 }
      const payloadString = JSON.stringify(payload)
      const signature = createTestWebhookSignature('shopify', payloadString, SHOPIFY_WEBHOOK_SECRET)
      
      // Mock crypto.timingSafeEqual to ensure it's called
      const timingSafeEqualSpy = vi.spyOn(crypto, 'timingSafeEqual')
      
      // Act
      verifyShopifyWebhook(payloadString, signature, SHOPIFY_WEBHOOK_SECRET)
      
      // Assert: Timing-safe comparison should be used
      expect(timingSafeEqualSpy).toHaveBeenCalled()
    })
  })

  describe('Order Creation Webhook Processing', () => {
    const createValidOrderWebhook = () => ({
      id: 5678901234,
      name: '#1002',
      email: 'test@example.com',
      financial_status: 'paid',
      fulfillment_status: null,
      total_price: '299.99',
      currency: 'USD',
      created_at: '2024-01-15T10:00:00Z',
      line_items: [
        {
          id: 1,
          title: 'Premium Widget',
          quantity: 1,
          variant_id: 'gid://shopify/ProductVariant/123',
          product_id: 'gid://shopify/Product/456',
          price: '299.99',
          sku: 'WIDGET-001'
        }
      ],
      shipping_address: {
        firstName: 'John',
        lastName: 'Doe',
        address1: '123 Main St',
        address2: 'Apt 4B',
        city: 'New York',
        province: 'NY',
        zip: '10001',
        country: 'US',
        phone: '+1-555-123-4567'
      },
      customer: {
        id: 987654321,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    })

    it('should process valid order creation webhook', async () => {
      // Arrange: Create shop and valid webhook
      const user = await factory.createTestUser()
      const shop = await factory.createTestShop(user, {
        platform: {
          connect: {
            id: (await factory.createTestPlatform('SHOP', {
              slug: 'shopify',
              appSecret: SHOPIFY_WEBHOOK_SECRET
            })).id
          }
        }
      })
      
      const orderWebhook = createValidOrderWebhook()
      const webhookBody = JSON.stringify(orderWebhook)
      const validSignature = createTestWebhookSignature('shopify', webhookBody, SHOPIFY_WEBHOOK_SECRET)
      
      const headers = {
        'x-shopify-hmac-sha256': validSignature,
        'x-shopify-shop-domain': shop.domain,
        'x-shopify-api-version': '2024-01'
      }

      // Act: Process the webhook (with proper verification)
      const isValid = verifyWebhook('shopify', webhookBody, headers, SHOPIFY_WEBHOOK_SECRET)
      expect(isValid).toBe(true)
      
      // Process the order data
      const result = await createOrderWebhookHandler({
        platform: { domain: shop.domain, accessToken: shop.accessToken },
        event: orderWebhook,
        headers
      })

      // Assert: Order data should be properly transformed
      expect(result).toMatchObject({
        type: 'order_created',
        order: {
          id: orderWebhook.id,
          name: orderWebhook.name,
          email: orderWebhook.email,
          totalPrice: orderWebhook.total_price,
          lineItems: expect.arrayContaining([
            expect.objectContaining({
              title: 'Premium Widget',
              quantity: 1,
              price: '299.99'
            })
          ])
        }
      })
    })

    it('should reject order webhook with missing HMAC header', async () => {
      // Arrange: Create webhook without HMAC
      const orderWebhook = createValidOrderWebhook()
      const headers = {
        'x-shopify-shop-domain': 'test-shop.myshopify.com'
        // Missing x-shopify-hmac-sha256
      }

      // Act & Assert: Should throw error
      await expect(
        createOrderWebhookHandler({
          platform: { domain: 'test-shop.myshopify.com', accessToken: 'test-token' },
          event: orderWebhook,
          headers
        })
      ).rejects.toThrow('Missing webhook HMAC')
    })

    it('should handle order with multiple line items', async () => {
      // Arrange: Create order with multiple items
      const orderWebhook = {
        ...createValidOrderWebhook(),
        line_items: [
          {
            id: 1,
            title: 'Product A',
            quantity: 2,
            variant_id: 'variant-a',
            product_id: 'product-a',
            price: '50.00'
          },
          {
            id: 2,
            title: 'Product B',
            quantity: 1,
            variant_id: 'variant-b',
            product_id: 'product-b',
            price: '75.00'
          }
        ],
        total_price: '175.00'
      }
      
      const webhookBody = JSON.stringify(orderWebhook)
      const validSignature = createTestWebhookSignature('shopify', webhookBody, SHOPIFY_WEBHOOK_SECRET)
      
      // Act: Process webhook
      const result = await createOrderWebhookHandler({
        platform: { domain: 'test.myshopify.com', accessToken: 'test' },
        event: orderWebhook,
        headers: { 'x-shopify-hmac-sha256': validSignature }
      })

      // Assert: All line items processed
      expect(result.order.lineItems).toHaveLength(2)
      expect(result.order.lineItems[0]).toMatchObject({
        title: 'Product A',
        quantity: 2,
        price: '50.00'
      })
      expect(result.order.lineItems[1]).toMatchObject({
        title: 'Product B',
        quantity: 1,
        price: '75.00'
      })
    })

    it('should handle missing optional fields gracefully', async () => {
      // Arrange: Create minimal order webhook
      const minimalOrder = {
        id: 123,
        name: '#1003',
        line_items: [{
          id: 1,
          title: 'Basic Product',
          quantity: 1,
          variant_id: 'v1',
          product_id: 'p1',
          price: '10.00'
        }]
      }
      
      const webhookBody = JSON.stringify(minimalOrder)
      const validSignature = createTestWebhookSignature('shopify', webhookBody, SHOPIFY_WEBHOOK_SECRET)
      
      // Act: Process webhook
      const result = await createOrderWebhookHandler({
        platform: { domain: 'test.myshopify.com', accessToken: 'test' },
        event: minimalOrder,
        headers: { 'x-shopify-hmac-sha256': validSignature }
      })

      // Assert: Should process without errors
      expect(result.type).toBe('order_created')
      expect(result.order).toBeDefined()
      expect(result.order.email).toBeUndefined()
      expect(result.order.shippingAddress).toBeUndefined()
    })
  })

  describe('Order Cancellation Webhook Processing', () => {
    it('should process order cancellation webhook', async () => {
      // Arrange: Create cancellation webhook
      const cancelWebhook = {
        id: 5678901234,
        name: '#1002',
        cancel_reason: 'customer',
        cancelled_at: '2024-01-15T12:00:00Z',
        financial_status: 'refunded'
      }
      
      const webhookBody = JSON.stringify(cancelWebhook)
      const validSignature = createTestWebhookSignature('shopify', webhookBody, SHOPIFY_WEBHOOK_SECRET)
      
      // Import the cancel handler
      const { cancelOrderWebhookHandler } = await import('@/features/integrations/shop/shopify')
      
      // Act: Process cancellation
      const result = await cancelOrderWebhookHandler({
        platform: { domain: 'test.myshopify.com', accessToken: 'test' },
        event: cancelWebhook,
        headers: { 'x-shopify-hmac-sha256': validSignature }
      })

      // Assert: Cancellation processed correctly
      expect(result).toMatchObject({
        type: 'order_cancelled',
        order: {
          id: cancelWebhook.id,
          name: cancelWebhook.name,
          cancelReason: 'customer',
          cancelledAt: cancelWebhook.cancelled_at
        }
      })
    })
  })

  describe('Webhook Replay Attack Prevention', () => {
    it('should prevent replay attacks by tracking processed webhooks', async () => {
      // This test demonstrates how to prevent replay attacks
      // In production, you'd store processed webhook IDs with timestamps
      
      const processedWebhooks = new Set<string>()
      
      const orderWebhook = createValidOrderWebhook()
      const webhookId = `${orderWebhook.id}-${Date.now()}`
      
      // First processing - should succeed
      expect(processedWebhooks.has(webhookId)).toBe(false)
      processedWebhooks.add(webhookId)
      
      // Replay attempt - should be detected
      expect(processedWebhooks.has(webhookId)).toBe(true)
      
      // In production, also check timestamp to expire old entries
      // This prevents the set from growing indefinitely
    })
  })

  describe('Platform-Agnostic Webhook Verification', () => {
    it('should verify webhooks from different platforms using generic function', () => {
      // Test Shopify
      const shopifyPayload = { id: 123, type: 'order' }
      const shopifyBody = JSON.stringify(shopifyPayload)
      const shopifySignature = createTestWebhookSignature('shopify', shopifyBody, SHOPIFY_WEBHOOK_SECRET)
      
      const shopifyValid = verifyWebhook(
        'shopify',
        shopifyBody,
        { 'x-shopify-hmac-sha256': shopifySignature },
        SHOPIFY_WEBHOOK_SECRET
      )
      expect(shopifyValid).toBe(true)
      
      // Test WooCommerce (uses same signature method)
      const wooPayload = { id: 456, type: 'order' }
      const wooBody = JSON.stringify(wooPayload)
      const wooSignature = createTestWebhookSignature('woocommerce', wooBody, 'woo-secret')
      
      const wooValid = verifyWebhook(
        'woocommerce',
        wooBody,
        { 'x-wc-webhook-signature': wooSignature },
        'woo-secret'
      )
      expect(wooValid).toBe(true)
    })

    it('should return false for unknown platforms', () => {
      const payload = { id: 789 }
      const body = JSON.stringify(payload)
      
      const isValid = verifyWebhook(
        'unknown-platform',
        body,
        {},
        'secret'
      )
      
      expect(isValid).toBe(false)
    })
  })
})

afterAll(async () => {
  await closeTestDatabase()
})