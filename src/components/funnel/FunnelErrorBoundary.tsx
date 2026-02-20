"use client";

import React from "react";

interface Props {
  pageName: string;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class FunnelErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.warn(
      `[GenFunnel] Page "${this.props.pageName}" crashed:`,
      error.message
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white text-center px-4">
          <div className="text-4xl">⚠</div>
          <p className="text-lg text-red-500 font-medium">
            This page encountered an error
          </p>
          <p className="text-sm text-gray-500 max-w-md break-words">
            {this.state.error}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 text-sm bg-leaf-400 text-white rounded-lg hover:bg-leaf-400/90 transition-colors cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
