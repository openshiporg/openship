/**
 * ErrorBoundary component - Error handling for Dashboard 2
 * Provides graceful error recovery with ShadCN styling
 */

'use client'

import { safeErrorSummary } from '@/features/dashboard/lib/security';
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard ErrorBoundary caught an error:', safeErrorSummary(error))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription className="mt-2">
                An unexpected error occurred in the dashboard. Please try refreshing the page.
              </AlertDescription>
            </Alert>
            
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Refresh Page
              </Button>
              <Button 
                onClick={() => this.setState({ hasError: false, error: undefined })}
                variant="default"
              >
                Try Again
              </Button>
            </div>
            
            
          </div>
        </div>
      )
    }

    return this.props.children
  }
}