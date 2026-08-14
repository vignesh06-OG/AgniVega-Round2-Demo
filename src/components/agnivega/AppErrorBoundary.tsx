import { Component, type ErrorInfo, type ReactNode } from "react";

import { captureError } from "@/lib/monitoring/error-monitor";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level boundary so render/effect crashes (including React's
 * "Maximum update depth exceeded") show a recovery UI instead of a blank page.
 */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    try {
      captureError(error, {
        boundary: "app_error_boundary",
        componentStack: info.componentStack ?? "",
      });
    } catch {
      /* monitoring must never mask the original error */
    }
  }

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const loop = /Maximum update depth/i.test(error.message);

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {loop ? "This screen got stuck in a loop" : "Something went wrong"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {loop
              ? "We stopped the render loop before it froze the app. Recovering usually fixes it."
              : "An unexpected error interrupted this page."}
          </p>
          <p className="mt-2 break-words text-xs text-muted-foreground/80">{error.message}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Try again
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
