import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center p-8">
          <div className="w-full h-32 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
            <span className="text-sm text-muted-foreground">Preview unavailable</span>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
