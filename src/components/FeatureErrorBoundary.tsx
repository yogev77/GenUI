"use client";

import React from "react";

interface Props {
  name: string;
  children: React.ReactNode;
  onCrash: (name: string) => void;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class FeatureErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.warn(`[GenUI] Feature "${this.props.name}" crashed:`, error.message);
    this.props.onCrash(this.props.name);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <div className="text-2xl">⚠</div>
          <p className="text-sm text-red-400 font-medium">This feature crashed</p>
          <p className="text-xs text-gray-500 max-w-[200px] break-words">
            {this.state.error}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-xs text-leaf-400 hover:text-leaf-200 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
