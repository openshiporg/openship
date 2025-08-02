import type { KeystoneContext } from '@keystone-6/core/types'

export interface TestUser {
  id: string
  email: string
  name: string
  role: {
    id: string
    name: string
  }
}

export interface TestPlatform {
  id: string
  name: string
  slug: string
  type: 'CHANNEL' | 'SHOP'
}

export interface TestShop {
  id: string
  name: string
  domain: string
  accessToken: string
  platform: TestPlatform
  user: TestUser
}

export interface TestChannel {
  id: string
  name: string
  domain: string
  accessToken: string
  platform: TestPlatform
  user: TestUser
}

export interface TestOrder {
  id: string
  orderName: string
  orderId: string
  firstName: string
  lastName: string
  streetAddress1: string
  city: string
  state: string
  zip: string
  country: string
  phoneNumber: string
  email: string
  shop: TestShop
  user: TestUser
  status: string
}

// Test data factories
export class TestDataFactory {
  constructor(private context: KeystoneContext) {}

  async createTestRole(overrides: Partial<any> = {}) {
    return await this.context.db.Role.createOne({
      data: {
        name: 'Test Role',
        canAccessDashboard: true,
        canManageOrders: true,
        canProcessOrders: true,
        canManageShops: true,
        canCreateShops: true,
        canManageChannels: true,
        canCreateChannels: true,
        canManageMatches: true,
        canCreateMatches: true,
        ...overrides,
      },
    })
  }

  async createTestUser(overrides: Partial<any> = {}): Promise<TestUser> {
    const role = await this.createTestRole()
    
    return await this.context.db.User.createOne({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        password: 'testpassword123',
        role: { connect: { id: role.id } },
        ...overrides,
      },
    })
  }

  async createTestPlatform(type: 'CHANNEL' | 'SHOP', overrides: Partial<any> = {}): Promise<TestPlatform> {
    const platformName = type === 'CHANNEL' ? 'Test Channel Platform' : 'Test Shop Platform'
    const platformSlug = type === 'CHANNEL' ? 'test-channel' : 'test-shop'
    
    return await this.context.db.Platform.createOne({
      data: {
        name: platformName,
        slug: platformSlug,
        type,
        // Add mock functions for the platform
        ...(type === 'CHANNEL' ? {
          getProductFunction: `
            async function getProduct({ productId, variantId }) {
              return {
                product: {
                  id: productId,
                  title: 'Test Product',
                  price: '29.99',
                  image: 'https://example.com/test-product.jpg',
                  variants: [{ id: variantId, price: '29.99', available: true }]
                }
              }
            }
          `,
          searchProductsFunction: `
            async function searchProducts({ searchTerm }) {
              return {
                products: [
                  {
                    id: 'test-product-1',
                    title: 'Test Product 1',
                    price: '29.99',
                    image: 'https://example.com/test-product-1.jpg',
                    variants: [{ id: 'test-variant-1', price: '29.99', available: true }]
                  }
                ]
              }
            }
          `,
          createPurchaseFunction: `
            async function createPurchase({ cartItems, shipping, notes }) {
              return {
                purchaseId: 'test-purchase-' + Date.now(),
                url: 'https://test-channel.com/orders/test-purchase-' + Date.now(),
                success: true
              }
            }
          `
        } : {
          searchOrdersFunction: `
            async function searchOrders({ searchTerm }) {
              return {
                orders: [
                  {
                    id: 'test-shop-order-1',
                    name: '#TEST-001',
                    date: new Date().toISOString(),
                    firstName: 'John',
                    lastName: 'Doe',
                    lineItems: [
                      {
                        productId: 'test-product-1',
                        variantId: 'test-variant-1',
                        quantity: 1,
                        price: '29.99',
                        name: 'Test Product'
                      }
                    ]
                  }
                ]
              }
            }
          `,
          addCartToPlatformOrderFunction: `
            async function addCartToPlatformOrder({ cartItems, orderId }) {
              return { success: true }
            }
          `
        }),
        ...overrides,
      },
    })
  }

  async createTestShop(user: TestUser, overrides: Partial<any> = {}): Promise<TestShop> {
    const platform = await this.createTestPlatform('SHOP')
    
    return await this.context.db.Shop.createOne({
      data: {
        name: 'Test Shop',
        domain: 'test-shop.myshopify.com',
        accessToken: 'test-access-token-shop',
        platform: { connect: { id: platform.id } },
        user: { connect: { id: user.id } },
        ...overrides,
      },
    })
  }

  async createTestChannel(user: TestUser, overrides: Partial<any> = {}): Promise<TestChannel> {
    const platform = await this.createTestPlatform('CHANNEL')
    
    return await this.context.db.Channel.createOne({
      data: {
        name: 'Test Channel',
        domain: 'test-channel.myshopify.com',
        accessToken: 'test-access-token-channel',
        platform: { connect: { id: platform.id } },
        user: { connect: { id: user.id } },
        ...overrides,
      },
    })
  }

  async createTestOrder(shop: TestShop, user: TestUser, overrides: Partial<any> = {}): Promise<TestOrder> {
    return await this.context.db.Order.createOne({
      data: {
        orderName: '#TEST-001',
        orderId: 'test-order-' + Date.now(),
        firstName: 'John',
        lastName: 'Doe',
        streetAddress1: '123 Test Street',
        city: 'Test City',
        state: 'CA',
        zip: '90210',
        country: 'US',
        phoneNumber: '+1-555-123-4567',
        email: user.email,
        shop: { connect: { id: shop.id } },
        user: { connect: { id: user.id } },
        status: 'PENDING',
        ...overrides,
      },
    })
  }

  async createTestLineItem(order: TestOrder, overrides: Partial<any> = {}) {
    return await this.context.db.LineItem.createOne({
      data: {
        name: 'Test Product',
        image: 'https://example.com/test-product.jpg',
        price: '29.99',
        quantity: 1,
        productId: 'test-product-1',
        variantId: 'test-variant-1',
        lineItemId: 'test-line-item-1',
        order: { connect: { id: order.id } },
        ...overrides,
      },
    })
  }

  async createTestCartItem(order: TestOrder, channel: TestChannel, user: TestUser, overrides: Partial<any> = {}) {
    return await this.context.db.CartItem.createOne({
      data: {
        name: 'Test Product',
        image: 'https://example.com/test-product.jpg',
        price: '29.99',
        quantity: 1,
        productId: 'test-product-1',
        variantId: 'test-variant-1',
        order: { connect: { id: order.id } },
        channel: { connect: { id: channel.id } },
        user: { connect: { id: user.id } },
        ...overrides,
      },
    })
  }

  async createTestShopItem(shop: TestShop, user: TestUser, overrides: Partial<any> = {}) {
    return await this.context.db.ShopItem.createOne({
      data: {
        quantity: 1,
        productId: 'test-product-1',
        variantId: 'test-variant-1',
        shop: { connect: { id: shop.id } },
        user: { connect: { id: user.id } },
        ...overrides,
      },
    })
  }

  async createTestChannelItem(channel: TestChannel, user: TestUser, overrides: Partial<any> = {}) {
    return await this.context.db.ChannelItem.createOne({
      data: {
        quantity: 1,
        productId: 'test-product-1',
        variantId: 'test-variant-1',
        price: '29.99',
        channel: { connect: { id: channel.id } },
        user: { connect: { id: user.id } },
        ...overrides,
      },
    })
  }

  async createTestMatch(shopItem: any, channelItem: any, user: TestUser, overrides: Partial<any> = {}) {
    return await this.context.db.Match.createOne({
      data: {
        input: { connect: [{ id: shopItem.id }] },
        output: { connect: [{ id: channelItem.id }] },
        user: { connect: { id: user.id } },
        ...overrides,
      },
    })
  }

  // Convenience method to create a complete test scenario
  async createCompleteTestScenario() {
    const user = await this.createTestUser()
    const shop = await this.createTestShop(user)
    const channel = await this.createTestChannel(user)
    const order = await this.createTestOrder(shop, user)
    const lineItem = await this.createTestLineItem(order)
    const shopItem = await this.createTestShopItem(shop, user, {
      productId: lineItem.productId,
      variantId: lineItem.variantId,
      quantity: lineItem.quantity,
    })
    const channelItem = await this.createTestChannelItem(channel, user, {
      productId: lineItem.productId,
      variantId: lineItem.variantId,
      quantity: lineItem.quantity,
    })
    const match = await this.createTestMatch(shopItem, channelItem, user)

    return {
      user,
      shop,
      channel,
      order,
      lineItem,
      shopItem,
      channelItem,
      match,
    }
  }
}