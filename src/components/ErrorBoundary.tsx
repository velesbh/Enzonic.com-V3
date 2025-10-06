import React, { Component, ReactNode } from 'react';
import { EnzonicError } from '@/components/ui/enzonic-error';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // You can log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <EnzonicError
          title="Application Error"
          description="Something went wrong with the application. Please refresh the page or try again later."
          error={this.state.error}
          variant="page"
          onRetry={() => {
            this.setState({ hasError: false, error: undefined });
            window.location.reload();
          }}
          onGoHome={() => {
            window.location.href = '/';
          }}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;