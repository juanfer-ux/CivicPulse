import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { IconContext } from '@phosphor-icons/react'
import './index.css'
import { AuthGate } from '@/components/AuthGate'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthProvider } from '@/lib/auth'

// The signed-in app (map, GSAP, the rest) only loads once AuthGate actually renders it, so a
// signed-out visitor's first load — everyone's first load — never pays for it. Same for the two
// dev-only galleries: loaded only when their hash route is opened.
const App = lazy(() => import('./App.tsx'))
const Gallery = lazy(() => import('@/components/Gallery').then((m) => ({ default: m.Gallery })))
const ChartGallery = lazy(() => import('@/components/ChartGallery').then((m) => ({ default: m.ChartGallery })))

// The gallery has no data, so it skips sign-in: open /#components.
const gallery = location.hash === '#components'
const charts = location.hash === '#charts' // chart options for the agent's answers

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Every Phosphor icon is the bold weight (owner, 2026-10-30) unless it asks for another (fill on the map badges, the buttons' sparkle and the bullet). */}
    <IconContext.Provider value={{ weight: 'bold' }}>
      <ErrorBoundary>
        {charts ? (
          <Suspense fallback={null}>
            <ChartGallery />
          </Suspense>
        ) : gallery ? (
          <Suspense fallback={null}>
            <Gallery />
          </Suspense>
        ) : (
          <AuthProvider>
            <AuthGate>
              <App />
            </AuthGate>
          </AuthProvider>
        )}
      </ErrorBoundary>
    </IconContext.Provider>
  </StrictMode>,
)
