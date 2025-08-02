/**
 * Mock webhook payloads for testing various e-commerce platforms
 * Based on real webhook structures from Shopify, WooCommerce, etc.
 */

export const webhookPayloads = {
  shopify: {
    orderCreation: {
      minimal: {
        id: 5123456789,
        name: '#1001',
        created_at: '2024-01-15T10:00:00-05:00',
        line_items: [{
          id: 1234567890,
          title: 'Basic T-Shirt',
          quantity: 1,
          price: '19.99',
          product_id: 7890123456,
          variant_id: 9876543210
        }]
      },
      
      complete: {
        id: 5123456789,
        admin_graphql_api_id: 'gid://shopify/Order/5123456789',
        name: '#1001',
        email: 'john.doe@example.com',
        created_at: '2024-01-15T10:00:00-05:00',
        updated_at: '2024-01-15T10:00:00-05:00',
        currency: 'USD',
        total_price: '154.98',
        subtotal_price: '139.98',
        total_tax: '10.00',
        total_shipping_price_set: {
          shop_money: { amount: '5.00', currency_code: 'USD' },
          presentment_money: { amount: '5.00', currency_code: 'USD' }
        },
        total_discounts: '0.00',
        financial_status: 'paid',
        fulfillment_status: null,
        order_status_url: 'https://example.myshopify.com/123456/orders/abc123/authenticate?key=xyz',
        
        line_items: [
          {
            id: 1234567890,
            variant_id: 9876543210,
            product_id: 7890123456,
            title: 'Premium Widget',
            variant_title: 'Large / Blue',
            quantity: 2,
            price: '49.99',
            total_discount: '0.00',
            sku: 'WIDGET-LG-BLUE',
            vendor: 'Acme Corp',
            product_exists: true,
            fulfillable_quantity: 2,
            grams: 500,
            properties: [],
            tax_lines: [{
              title: 'State Tax',
              price: '5.00',
              rate: 0.05
            }]
          },
          {
            id: 2345678901,
            variant_id: 8765432109,
            product_id: 6789012345,
            title: 'Basic Gadget',
            variant_title: 'Standard',
            quantity: 1,
            price: '40.00',
            total_discount: '0.00',
            sku: 'GADGET-STD',
            vendor: 'TechCo',
            product_exists: true,
            fulfillable_quantity: 1,
            grams: 200
          }
        ],
        
        shipping_address: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main Street',
          address2: 'Apt 4B',
          phone: '+1-555-123-4567',
          city: 'New York',
          zip: '10001',
          province: 'NY',
          country: 'US',
          province_code: 'NY',
          country_code: 'US'
        },
        
        billing_address: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main Street',
          address2: 'Apt 4B',
          phone: '+1-555-123-4567',
          city: 'New York',
          zip: '10001',
          province: 'NY',
          country: 'US',
          province_code: 'NY',
          country_code: 'US'
        },
        
        customer: {
          id: 6543210987,
          email: 'john.doe@example.com',
          accepts_marketing: false,
          created_at: '2023-01-01T00:00:00-05:00',
          updated_at: '2024-01-15T10:00:00-05:00',
          firstName: 'John',
          lastName: 'Doe',
          orders_count: 5,
          state: 'enabled',
          total_spent: '599.95',
          last_order_id: 5123456789,
          verified_email: true,
          tax_exempt: false,
          phone: '+1-555-123-4567',
          tags: 'VIP, Returning Customer',
          currency: 'USD',
          accepts_marketing_updated_at: '2023-01-01T00:00:00-05:00'
        },
        
        shipping_lines: [{
          id: 3456789012,
          title: 'Standard Shipping',
          price: '5.00',
          code: 'STANDARD',
          source: 'shopify',
          carrier_identifier: null,
          requested_fulfillment_service_id: null
        }],
        
        note: 'Please leave package at front door',
        tags: 'urgent, wholesale',
        
        payment_details: {
          credit_card_bin: '424242',
          avs_result_code: 'Y',
          cvv_result_code: 'M',
          credit_card_number: '•••• •••• •••• 4242',
          credit_card_company: 'Visa'
        }
      },
      
      withDiscount: {
        id: 5555555555,
        name: '#1002',
        total_price: '89.99',
        subtotal_price: '99.99',
        total_discounts: '10.00',
        discount_codes: [{
          code: 'SAVE10',
          amount: '10.00',
          type: 'fixed_amount'
        }],
        line_items: [{
          id: 1111111111,
          title: 'Sale Item',
          quantity: 1,
          price: '99.99',
          total_discount: '10.00',
          product_id: 2222222222,
          variant_id: 3333333333
        }]
      },
      
      international: {
        id: 7777777777,
        name: '#1003',
        currency: 'EUR',
        total_price: '125.50',
        presentment_currency: 'EUR',
        shipping_address: {
          firstName: 'Pierre',
          lastName: 'Dupont',
          address1: '123 Rue de la Paix',
          city: 'Paris',
          zip: '75001',
          province: 'Île-de-France',
          country: 'FR',
          country_code: 'FR',
          phone: '+33-1-23-45-67-89'
        },
        line_items: [{
          id: 8888888888,
          title: 'Produit International',
          quantity: 1,
          price: '125.50',
          product_id: 9999999999,
          variant_id: 1010101010
        }]
      }
    },
    
    orderCancellation: {
      standard: {
        id: 5123456789,
        name: '#1001',
        email: 'john.doe@example.com',
        created_at: '2024-01-15T10:00:00-05:00',
        cancelled_at: '2024-01-15T14:30:00-05:00',
        cancel_reason: 'customer',
        financial_status: 'refunded',
        closed_at: '2024-01-15T14:30:00-05:00',
        tags: 'cancelled'
      },
      
      fraud: {
        id: 6666666666,
        name: '#1004',
        cancelled_at: '2024-01-15T11:00:00-05:00',
        cancel_reason: 'fraud',
        financial_status: 'voided'
      },
      
      inventory: {
        id: 4444444444,
        name: '#1005',
        cancelled_at: '2024-01-15T12:00:00-05:00',
        cancel_reason: 'inventory',
        financial_status: 'pending'
      }
    },
    
    fulfillmentCreation: {
      complete: {
        id: 987654321,
        order_id: 5123456789,
        status: 'success',
        created_at: '2024-01-16T09:00:00-05:00',
        tracking_company: 'UPS',
        tracking_number: '1Z999AA1234567890',
        tracking_url: 'https://www.ups.com/track?tracknum=1Z999AA1234567890',
        tracking_numbers: ['1Z999AA1234567890'],
        tracking_urls: ['https://www.ups.com/track?tracknum=1Z999AA1234567890'],
        line_items: [{
          id: 1234567890,
          quantity: 2,
          fulfillment_status: 'fulfilled'
        }],
        shipment_status: 'delivered',
        destination: {
          firstName: 'John',
          lastName: 'Doe',
          address1: '123 Main Street',
          city: 'New York',
          zip: '10001',
          province: 'NY',
          country: 'US'
        }
      },
      
      partial: {
        id: 876543210,
        order_id: 5123456789,
        status: 'success',
        tracking_company: 'FedEx',
        tracking_number: '123456789012',
        line_items: [{
          id: 1234567890,
          quantity: 1,
          fulfillment_status: 'partial'
        }]
      }
    },
    
    productUpdate: {
      standard: {
        id: 7890123456,
        title: 'Updated Product',
        vendor: 'Acme Corp',
        product_type: 'Widget',
        handle: 'updated-product',
        published_at: '2024-01-01T00:00:00-05:00',
        updated_at: '2024-01-15T15:00:00-05:00',
        variants: [{
          id: 9876543210,
          product_id: 7890123456,
          title: 'Large / Blue',
          price: '59.99',
          sku: 'WIDGET-LG-BLUE-V2',
          inventory_quantity: 150,
          old_inventory_quantity: 200
        }]
      }
    },
    
    disputeCreation: {
      chargeback: {
        id: 111222333,
        order_id: 5123456789,
        type: 'chargeback',
        amount: '154.98',
        currency: 'USD',
        reason: 'fraudulent',
        status: 'under_review',
        evidence_due_by: '2024-01-25T23:59:59-05:00'
      }
    }
  },
  
  woocommerce: {
    orderCreation: {
      standard: {
        id: 123,
        parent_id: 0,
        number: '123',
        order_key: 'wc_order_abc123',
        created_via: 'checkout',
        version: '8.5.0',
        status: 'processing',
        currency: 'USD',
        date_created: '2024-01-15T10:00:00',
        date_modified: '2024-01-15T10:00:00',
        discount_total: '0.00',
        shipping_total: '5.00',
        total: '104.99',
        total_tax: '10.00',
        customer_id: 1,
        billing: {
          firstName: 'John',
          lastName: 'Doe',
          address_1: '123 Main St',
          address_2: '',
          city: 'New York',
          state: 'NY',
          postcode: '10001',
          country: 'US',
          email: 'john@example.com',
          phone: '555-123-4567'
        },
        shipping: {
          firstName: 'John',
          lastName: 'Doe',
          address_1: '123 Main St',
          address_2: '',
          city: 'New York',
          state: 'NY',
          postcode: '10001',
          country: 'US'
        },
        payment_method: 'stripe',
        payment_method_title: 'Credit Card',
        line_items: [{
          id: 1,
          name: 'WooCommerce Product',
          product_id: 456,
          variation_id: 0,
          quantity: 2,
          tax_class: '',
          subtotal: '89.98',
          total: '89.98',
          sku: 'WOO-PRODUCT-001',
          price: 44.99
        }],
        shipping_lines: [{
          id: 2,
          method_title: 'Flat Rate',
          method_id: 'flat_rate',
          total: '5.00'
        }]
      }
    }
  }
}

/**
 * Generate webhook headers for different platforms
 */
export function generateWebhookHeaders(
  platform: string,
  signature: string,
  additionalHeaders: Record<string, string> = {}
): Record<string, string> {
  const baseHeaders = {
    'content-type': 'application/json',
    'user-agent': `${platform}-webhook/1.0`
  }

  switch (platform.toLowerCase()) {
    case 'shopify':
      return {
        ...baseHeaders,
        'x-shopify-hmac-sha256': signature,
        'x-shopify-topic': 'orders/create',
        'x-shopify-shop-domain': 'test-shop.myshopify.com',
        'x-shopify-api-version': '2024-01',
        'x-shopify-webhook-id': 'test-webhook-id',
        ...additionalHeaders
      }
    
    case 'woocommerce':
      return {
        ...baseHeaders,
        'x-wc-webhook-signature': signature,
        'x-wc-webhook-topic': 'order.created',
        'x-wc-webhook-resource': 'order',
        'x-wc-webhook-event': 'created',
        'x-wc-webhook-id': '123',
        'x-wc-webhook-delivery-id': 'abc123',
        ...additionalHeaders
      }
    
    default:
      return {
        ...baseHeaders,
        'x-webhook-signature': signature,
        ...additionalHeaders
      }
  }
}

/**
 * Test data for webhook error scenarios
 */
export const webhookErrorScenarios = {
  malformedJson: '{"invalid": json""}',
  
  missingRequiredFields: {
    id: 123
    // Missing required fields like line_items
  },
  
  invalidDataTypes: {
    id: 'not-a-number',
    name: 123, // Should be string
    line_items: 'not-an-array'
  },
  
  emptyPayload: {},
  
  oversizedPayload: {
    id: 123,
    name: '#HUGE',
    // Generate large payload that might exceed limits
    description: 'x'.repeat(1000000)
  }
}

/**
 * Generate a series of webhook payloads for testing idempotency
 */
export function generateWebhookSeries(baseId: number, count: number = 5) {
  return Array.from({ length: count }, (_, index) => ({
    ...webhookPayloads.shopify.orderCreation.minimal,
    id: baseId + index,
    name: `#${1000 + index}`,
    created_at: new Date(Date.now() + index * 60000).toISOString()
  }))
}

/**
 * Generate webhook payload for specific test scenarios
 */
export function generateTestWebhook(scenario: 'priceChange' | 'outOfStock' | 'addressValidation' | 'customFields') {
  const base = { ...webhookPayloads.shopify.orderCreation.complete }
  
  switch (scenario) {
    case 'priceChange':
      return {
        ...base,
        note: 'Price changed after order placed',
        line_items: base.line_items.map(item => ({
          ...item,
          price: String(parseFloat(item.price) * 1.1) // 10% price increase
        }))
      }
    
    case 'outOfStock':
      return {
        ...base,
        line_items: base.line_items.map(item => ({
          ...item,
          fulfillable_quantity: 0,
          properties: [{ name: 'stock_status', value: 'out_of_stock' }]
        }))
      }
    
    case 'addressValidation':
      return {
        ...base,
        shipping_address: {
          ...base.shipping_address,
          address1: '123 Fake Street That Does Not Exist',
          city: 'InvalidCity',
          province_code: 'XX'
        }
      }
    
    case 'customFields':
      return {
        ...base,
        note_attributes: [
          { name: 'gift_message', value: 'Happy Birthday!' },
          { name: 'delivery_date', value: '2024-01-20' }
        ],
        line_items: base.line_items.map(item => ({
          ...item,
          properties: [
            { name: 'personalization', value: 'John Doe' },
            { name: 'gift_wrap', value: 'true' }
          ]
        }))
      }
  }
}