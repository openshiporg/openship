import { Component } from "react";
import { Button } from "@keystone/primitives/default/ui/button";
import { AlertTriangleIcon } from "lucide-react";

export class ErrorBoundary extends Component {
  state = { hasError: false, isReloading: false };
  static getDerivedStateFromError(error) {
    return { error, hasError: true };
  }
  reloadPage = () => {
    this.setState({ isReloading: true });
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangleIcon size="large" />
            <div>Something went wrong.</div>
            <Button
              size="sm"
              isLoading={this.state.isReloading}
              onClick={this.reloadPage}
            >
              reload page
            </Button>
          </div>
        </ErrorContainer>
      );
    }
    return this.props.children;
  }
}

export const ErrorContainer = ({ children }) => {
  return (
    <div className="flex items-center justify-center rounded-md">
      <div className="m-4 p-8 rounded-md">{children}</div>
    </div>
  );
};
