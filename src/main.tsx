import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthGate } from '@/components/AuthGate'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Gallery } from '@/components/Gallery'
import { AuthProvider } from '@/lib/auth'

// The gallery has no data, so it skips sign-in: open /#components.
const gallery = location.hash === '#components'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {gallery ? (
        <Gallery />
      ) : (
        <AuthProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </AuthProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
)
