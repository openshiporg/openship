import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { TestDataFactory } from '../fixtures/factories'
import { mockPlatformAdapters } from '../mocks/platform-adapters'

// Example component test for order processing UI
// This demonstrates how to test React components that interact with the platform features

// Mock the platform actions
vi.mock('@/features/platform/orders/actions/orders', () => ({
  addMatchToCart: vi.fn(),
  matchOrder: vi.fn(),
  placeOrders: vi.fn(),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Example Button Component for Order Processing
const OrderProcessingButton = ({ 
  orderId, 
  action, 
  children,
  disabled = false 
}: {
  orderId: string
  action: 'getMatch' | 'saveMatch' | 'placeOrder'
  children: React.ReactNode
  disabled?: boolean
}) => {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)

  const handleClick = async () => {
    setLoading(true)
    setError(null)
    
    try {
      switch (action) {
        case 'getMatch':
          await import('@/features/platform/orders/actions/orders').then(m => 
            m.addMatchToCart(orderId)
          )
          break
        case 'saveMatch':
          await import('@/features/platform/orders/actions/orders').then(m => 
            m.matchOrder(orderId)
          )
          break
        case 'placeOrder':
          await import('@/features/platform/orders/actions/orders').then(m => 
            m.placeOrders([orderId])
          )
          break
      }
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        data-testid={`${action}-button`}
        className={`
          px-4 py-2 rounded 
          ${loading ? 'bg-gray-300' : 'bg-blue-500 hover:bg-blue-600'} 
          ${success ? 'bg-green-500' : ''} 
          ${error ? 'bg-red-500' : ''} 
          text-white disabled:opacity-50
        `}
      >
        {loading ? 'Processing...' : children}
      </button>
      
      {error && (
        <div data-testid="error-message" className="text-red-500 mt-2">
          {error}
        </div>
      )}
      
      {success && (
        <div data-testid="success-message" className="text-green-500 mt-2">
          Success!
        </div>
      )}
    </div>
  )
}

describe('OrderProcessingButton Component', () => {
  let mockActions: any
  let mockAdapters: ReturnType<typeof mockPlatformAdapters>

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()
    
    // Set up platform adapter mocks
    mockAdapters = mockPlatformAdapters()
    
    // Get mocked actions
    mockActions = vi.mocked(await import('@/features/platform/orders/actions/orders'))
  })

  describe('GET MATCH Button', () => {
    it('should successfully call addMatchToCart action', async () => {
      // Arrange: Mock successful response
      mockActions.addMatchToCart.mockResolvedValue({
        success: true,
        order: { id: 'test-order-1', status: 'PENDING' }
      })

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch">
          GET MATCH
        </OrderProcessingButton>
      )

      const button = screen.getByTestId('getMatch-button')
      fireEvent.click(button)

      // Assert: Verify loading state
      expect(button).toHaveTextContent('Processing...')
      expect(button).toBeDisabled()

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
      })

      // Verify action was called
      expect(mockActions.addMatchToCart).toHaveBeenCalledWith('test-order-1')
      expect(button).toHaveTextContent('GET MATCH')
      expect(button).not.toBeDisabled()
    })

    it('should handle errors from addMatchToCart action', async () => {
      // Arrange: Mock error response
      mockActions.addMatchToCart.mockRejectedValue(new Error('No matches found'))

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch">
          GET MATCH
        </OrderProcessingButton>
      )

      fireEvent.click(screen.getByTestId('getMatch-button'))

      // Assert: Verify error handling
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('No matches found')
      })

      expect(mockActions.addMatchToCart).toHaveBeenCalledWith('test-order-1')
    })

    it('should be disabled when disabled prop is true', () => {
      // Act: Render with disabled prop
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch" disabled>
          GET MATCH
        </OrderProcessingButton>
      )

      // Assert: Button should be disabled
      const button = screen.getByTestId('getMatch-button')
      expect(button).toBeDisabled()
    })
  })

  describe('SAVE MATCH Button', () => {
    it('should successfully call matchOrder action', async () => {
      // Arrange: Mock successful response
      mockActions.matchOrder.mockResolvedValue({
        success: true,
        match: { id: 'new-match-1' }
      })

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="saveMatch">
          SAVE MATCH
        </OrderProcessingButton>
      )

      fireEvent.click(screen.getByTestId('saveMatch-button'))

      // Assert: Verify success
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
      })

      expect(mockActions.matchOrder).toHaveBeenCalledWith('test-order-1')
    })

    it('should handle authentication errors', async () => {
      // Arrange: Mock auth error
      mockActions.matchOrder.mockRejectedValue(new Error('You must be logged in to do this!'))

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="saveMatch">
          SAVE MATCH
        </OrderProcessingButton>
      )

      fireEvent.click(screen.getByTestId('saveMatch-button'))

      // Assert: Verify error display
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('You must be logged in to do this!')
      })
    })
  })

  describe('PLACE ORDER Button', () => {
    it('should successfully call placeOrders action', async () => {
      // Arrange: Mock successful response
      mockActions.placeOrders.mockResolvedValue({
        success: true,
        processedOrders: [{ id: 'test-order-1', status: 'AWAITING' }]
      })

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="placeOrder">
          PLACE ORDER
        </OrderProcessingButton>
      )

      fireEvent.click(screen.getByTestId('placeOrder-button'))

      // Assert: Verify success
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
      })

      expect(mockActions.placeOrders).toHaveBeenCalledWith(['test-order-1'])
    })

    it('should handle platform adapter failures', async () => {
      // Arrange: Mock platform failure
      mockActions.placeOrders.mockRejectedValue(new Error('Platform API unavailable'))

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="placeOrder">
          PLACE ORDER
        </OrderProcessingButton>
      )

      fireEvent.click(screen.getByTestId('placeOrder-button'))

      // Assert: Verify error handling
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Platform API unavailable')
      })
    })
  })

  describe('Visual States', () => {
    it('should show loading state during action execution', async () => {
      // Arrange: Mock slow response
      mockActions.addMatchToCart.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch">
          GET MATCH
        </OrderProcessingButton>
      )

      const button = screen.getByTestId('getMatch-button')
      fireEvent.click(button)

      // Assert: Verify loading state
      expect(button).toHaveTextContent('Processing...')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('bg-gray-300')

      // Wait for completion
      await waitFor(() => {
        expect(button).toHaveTextContent('GET MATCH')
      })
    })

    it('should show success state after successful action', async () => {
      // Arrange: Mock successful response
      mockActions.addMatchToCart.mockResolvedValue({ success: true })

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch">
          GET MATCH
        </OrderProcessingButton>
      )

      fireEvent.click(screen.getByTestId('getMatch-button'))

      // Assert: Verify success state
      await waitFor(() => {
        const button = screen.getByTestId('getMatch-button')
        expect(button).toHaveClass('bg-green-500')
        expect(screen.getByTestId('success-message')).toBeInTheDocument()
      })
    })

    it('should show error state after failed action', async () => {
      // Arrange: Mock error response
      mockActions.addMatchToCart.mockRejectedValue(new Error('Test error'))

      // Act: Render and click button
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch">
          GET MATCH
        </OrderProcessingButton>
      )

      fireEvent.click(screen.getByTestId('getMatch-button'))

      // Assert: Verify error state
      await waitFor(() => {
        const button = screen.getByTestId('getMatch-button')
        expect(button).toHaveClass('bg-red-500')
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      // Act: Render button
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch">
          GET MATCH
        </OrderProcessingButton>
      )

      // Assert: Verify accessibility
      const button = screen.getByTestId('getMatch-button')
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toBeVisible()
    })

    it('should be keyboard accessible', () => {
      // Arrange: Mock action
      mockActions.addMatchToCart.mockResolvedValue({ success: true })

      // Act: Render and use keyboard
      render(
        <OrderProcessingButton orderId="test-order-1" action="getMatch">
          GET MATCH
        </OrderProcessingButton>
      )

      const button = screen.getByTestId('getMatch-button')
      button.focus()
      fireEvent.keyDown(button, { key: 'Enter' })

      // Assert: Action should be triggered
      expect(mockActions.addMatchToCart).toHaveBeenCalled()
    })
  })
})

// Example of testing a more complex component with multiple order actions
describe('OrderProcessingPanel Component', () => {
  const OrderProcessingPanel = ({ orderId }: { orderId: string }) => {
    const [currentStep, setCurrentStep] = React.useState<'match' | 'save' | 'place'>('match')

    return (
      <div data-testid="order-processing-panel">
        <h3>Process Order: {orderId}</h3>
        
        <div className="space-y-4">
          <OrderProcessingButton 
            orderId={orderId} 
            action="getMatch"
            disabled={currentStep !== 'match'}
          >
            Step 1: GET MATCH
          </OrderProcessingButton>
          
          <OrderProcessingButton 
            orderId={orderId} 
            action="saveMatch"
            disabled={currentStep !== 'save'}
          >
            Step 2: SAVE MATCH
          </OrderProcessingButton>
          
          <OrderProcessingButton 
            orderId={orderId} 
            action="placeOrder"
            disabled={currentStep !== 'place'}
          >
            Step 3: PLACE ORDER
          </OrderProcessingButton>
        </div>
        
        <div className="mt-4">
          <button 
            onClick={() => setCurrentStep('save')}
            data-testid="next-step-button"
          >
            Next Step
          </button>
        </div>
      </div>
    )
  }

  it('should manage workflow steps correctly', async () => {
    // Act: Render panel
    render(<OrderProcessingPanel orderId="test-order-1" />)

    // Assert: Initial state
    expect(screen.getByTestId('getMatch-button')).not.toBeDisabled()
    expect(screen.getByTestId('saveMatch-button')).toBeDisabled()
    expect(screen.getByTestId('placeOrder-button')).toBeDisabled()

    // Act: Progress to next step
    fireEvent.click(screen.getByTestId('next-step-button'))

    // Assert: Step progression
    expect(screen.getByTestId('getMatch-button')).toBeDisabled()
    expect(screen.getByTestId('saveMatch-button')).not.toBeDisabled()
    expect(screen.getByTestId('placeOrder-button')).toBeDisabled()
  })
})

// Re-export React for the component definitions above
import React from 'react'