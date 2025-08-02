import { vi } from 'vitest'

// Mock channel platform responses
export const mockChannelResponses = {
  getProduct: {
    success: {
      product: {
        id: 'test-product-1',
        title: 'Test Product',
        price: '29.99',
        image: 'https://example.com/test-product.jpg',
        variants: [
          {
            id: 'test-variant-1',
            price: '29.99',
            available: true,
            title: 'Default Title'
          }
        ]
      }
    },
    priceChange: {
      product: {
        id: 'test-product-1',
        title: 'Test Product',
        price: '35.99', // Changed price
        image: 'https://example.com/test-product.jpg',
        variants: [
          {
            id: 'test-variant-1',
            price: '35.99',
            available: true,
            title: 'Default Title'
          }
        ]
      }
    },
    unavailable: {
      product: {
        id: 'test-product-1',
        title: 'Test Product',
        price: '29.99',
        image: 'https://example.com/test-product.jpg',
        variants: [
          {
            id: 'test-variant-1',
            price: '29.99',
            available: false, // Not available
            title: 'Default Title'
          }
        ]
      }
    }
  },
  
  searchProducts: {
    success: {
      products: [
        {
          id: 'test-product-1',
          title: 'Test Product 1',
          price: '29.99',
          image: 'https://example.com/test-product-1.jpg',
          variants: [
            {
              id: 'test-variant-1',
              price: '29.99',
              available: true,
              title: 'Default Title'
            }
          ]
        },
        {
          id: 'test-product-2',
          title: 'Test Product 2',
          price: '39.99',
          image: 'https://example.com/test-product-2.jpg',
          variants: [
            {
              id: 'test-variant-2',
              price: '39.99',
              available: true,
              title: 'Default Title'
            }
          ]
        }
      ]
    },
    empty: {
      products: []
    }
  },
  
  createPurchase: {
    success: {
      purchaseId: 'test-purchase-123',
      url: 'https://test-channel.com/orders/test-purchase-123',
      success: true
    },
    failure: {
      error: 'Failed to create purchase: Insufficient inventory',
      success: false
    },
    authError: {
      error: 'Authentication failed: Invalid access token',
      success: false
    }
  }
}

// Mock shop platform responses
export const mockShopResponses = {
  searchOrders: {
    success: {
      orders: [
        {
          id: 'test-shop-order-1',
          name: '#TEST-001',
          date: '2024-01-15T10:30:00Z',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1-555-123-4567',
          streetAddress1: '123 Test Street',
          city: 'Test City',
          state: 'CA',
          zip: '90210',
          country: 'US',
          lineItems: [
            {
              productId: 'test-product-1',
              variantId: 'test-variant-1',
              quantity: 2,
              price: '29.99',
              name: 'Test Product',
              image: 'https://example.com/test-product.jpg'
            }
          ]
        }
      ]
    },
    empty: {
      orders: []
    }
  },
  
  addCartToPlatformOrder: {
    success: {
      success: true,
      message: 'Cart items added to platform order successfully'
    },
    failure: {
      success: false,
      error: 'Failed to add cart items to platform order'
    }
  }
}

// Mock the channel adapter executor
export const createMockChannelExecutor = () => {
  return vi.fn(async ({ platform, functionName, args }) => {
    switch (functionName) {
      case 'getProductFunction':
        const { productId, variantId } = args
        // Simulate different scenarios based on product ID
        if (productId === 'unavailable-product') {
          return mockChannelResponses.getProduct.unavailable
        }
        if (productId === 'price-changed-product') {
          return mockChannelResponses.getProduct.priceChange
        }
        return mockChannelResponses.getProduct.success
        
      case 'searchProductsFunction':
        const { searchEntry } = args
        if (searchEntry === 'no-results') {
          return mockChannelResponses.searchProducts.empty
        }
        return mockChannelResponses.searchProducts.success
        
      case 'createPurchaseFunction':
        const { cartItems, shipping } = args
        // Simulate different scenarios based on cart items
        if (cartItems.some(item => item.productId === 'auth-error-product')) {
          return mockChannelResponses.createPurchase.authError
        }
        if (cartItems.some(item => item.productId === 'insufficient-inventory-product')) {
          return mockChannelResponses.createPurchase.failure
        }
        return mockChannelResponses.createPurchase.success
        
      default:
        throw new Error(`Unknown function: ${functionName}`)
    }
  })
}

// Mock the shop adapter functions
export const createMockShopAdapter = () => {
  return {
    searchOrdersFunction: vi.fn(async ({ searchEntry }) => {
      if (searchEntry === 'no-results') {
        return mockShopResponses.searchOrders.empty
      }
      return mockShopResponses.searchOrders.success
    }),
    
    addCartToPlatformOrderFunction: vi.fn(async ({ cartItems, orderId }) => {
      if (orderId === 'failing-order') {
        return mockShopResponses.addCartToPlatformOrder.failure
      }
      return mockShopResponses.addCartToPlatformOrder.success
    })
  }
}

// Mock the entire platform adapter system
export const mockPlatformAdapters = () => {
  const mockChannelExecutor = createMockChannelExecutor()
  const mockShopAdapter = createMockShopAdapter()
  
  // Replace the actual imports with mocks
  vi.mock('@/features/integrations/channel/lib/executor', () => ({
    executeChannelAdapterFunction: mockChannelExecutor,
    searchChannelProducts: vi.fn(async ({ platform, searchEntry, after }) => {
      return mockChannelExecutor({ 
        platform, 
        functionName: 'searchProductsFunction', 
        args: { searchEntry, after } 
      })
    }),
    getChannelProduct: vi.fn(async ({ platform, productId }) => {
      return mockChannelExecutor({ 
        platform, 
        functionName: 'getProductFunction', 
        args: { productId } 
      })
    }),
    createChannelPurchase: vi.fn(async ({ platform, cartItems, shipping, notes }) => {
      return mockChannelExecutor({ 
        platform, 
        functionName: 'createPurchaseFunction', 
        args: { cartItems, shipping, notes } 
      })
    })
  }))
  
  vi.mock('@/features/keystone/utils/channelProviderAdapter', () => ({
    createChannelPurchase: vi.fn(async ({ platform, cartItems, shipping }) => {
      return mockChannelExecutor({ 
        platform, 
        functionName: 'createPurchaseFunction', 
        args: { cartItems, shipping } 
      })
    })
  }))
  
  vi.mock('@/features/keystone/utils/shopProviderAdapter', () => ({
    addCartToPlatformOrder: mockShopAdapter.addCartToPlatformOrderFunction
  }))
  
  return {
    mockChannelExecutor,
    mockShopAdapter
  }
}

// Test scenarios builder
export const createTestScenarios = () => {
  return {
    // Success scenarios
    perfectMatch: {
      description: 'Order with perfect product match and successful processing',
      productId: 'test-product-1',
      variantId: 'test-variant-1',
      expectedPrice: '29.99'
    },
    
    // Price change scenarios
    priceChange: {
      description: 'Order with product price change between match creation and processing',
      productId: 'price-changed-product',
      variantId: 'test-variant-1',
      originalPrice: '29.99',
      newPrice: '35.99'
    },
    
    // Failure scenarios
    unavailableProduct: {
      description: 'Order with product that becomes unavailable',
      productId: 'unavailable-product',
      variantId: 'test-variant-1'
    },
    
    authError: {
      description: 'Order processing with authentication error', 
      productId: 'auth-error-product',
      variantId: 'test-variant-1'
    },
    
    insufficientInventory: {
      description: 'Order processing with insufficient inventory',
      productId: 'insufficient-inventory-product',
      variantId: 'test-variant-1'
    },
    
    // Search scenarios
    noSearchResults: {
      description: 'Search with no matching products',
      searchTerm: 'no-results'
    },
    
    // Platform order scenarios
    platformOrderFailure: {
      description: 'Failure when adding cart to platform order',
      orderId: 'failing-order'
    }
  }
}