import { Component, type ReactNode } from 'react'

/** Last line of defence: show the error instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="grid min-h-svh place-items-center p-4">
        <div className="max-w-md rounded-lg border bg-card p-4 text-body">
          <p className="mb-2 font-medium">Something went wrong</p>
          <p className="mb-3 text-muted-foreground">{this.state.error.message}</p>
          <button className="underline" onClick={() => location.reload()}>
            Reload
          </button>
        </div>
      </main>
    )
  }
}
