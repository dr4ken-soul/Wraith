'use client'

import {Component, type ErrorInfo, type ReactNode} from 'react'

type ErrorBoundaryProps = {children: ReactNode}
type ErrorBoundaryState = {hasError: boolean}

/** Prevents provider or route failures from becoming an unbranded blank page. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {hasError: false}

  /** Records a render failure for the branded recovery state. */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true}
  }

  /** Logs diagnostics only in development. */
  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') console.error(error, info)
  }

  /** Clears the error boundary state. */
  handleRetry = (): void => this.setState({hasError: false})

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main className="relative z-10 flex min-h-[100dvh] items-center justify-center px-6 text-center">
        <div className="double-bezel max-w-lg">
          <div className="double-bezel-core p-8">
            <span className="material-icons text-[var(--accent)]" aria-hidden="true">error_outline</span>
            <h1 className="mt-4 font-display text-4xl uppercase text-[var(--text-primary)]">Wraith needs a reset</h1>
            <p className="mt-3 font-body text-sm leading-relaxed text-[var(--text-secondary)]">The page hit a runtime problem. Retry the interface or return to the landing page.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={this.handleRetry} className="button-primary">Retry interface</button>
              <a href="/" className="button-secondary">Return home</a>
            </div>
          </div>
        </div>
      </main>
    )
  }
}

