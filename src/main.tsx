import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthGate } from '@/components/AuthGate'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Gallery } from '@/components/Gallery'
import { AuthProvider } from '@/lib/auth'

// Loaded only when opened, so the chart library never weighs on the app itself.
const ChartGallery = lazy(() => import('@/components/ChartGallery').then((m) => ({ default: m.ChartGallery })))

// The gallery has no data, so it skips sign-in: open /#components.
const gallery = location.hash === '#components'
const charts = location.hash === '#charts' // chart options for the agent's answers

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {charts ? (
        <Suspense fallback={null}>
          <ChartGallery />
        </Suspense>
      ) : gallery ? (
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
