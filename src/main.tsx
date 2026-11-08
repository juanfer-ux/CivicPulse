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
// Font smoothing links (owner, 2026-11-05): /?smoothing=auto|none|antialiased|subpixel-antialiased sets -webkit-font-smoothing on the page, so each option can be compared from its own link. Anything else is ignored. The CSS default (`auto`) applies without the parameter.
const smoothing = new URLSearchParams(location.search).get('smoothing')
if (smoothing && ['auto', 'none', 'antialiased', 'subpixel-antialiased'].includes(smoothing)) document.documentElement.style.setProperty('-webkit-font-smoothing', smoothing)

const App = lazy(() => import('./App.tsx'))
const Gallery = lazy(() => import('@/components/Gallery').then((m) => ({ default: m.Gallery })))
const ChartGallery = lazy(() => import('@/components/ChartGallery').then((m) => ({ default: m.ChartGallery })))
const ScrollGallery = lazy(() => import('@/components/ScrollGallery').then((m) => ({ default: m.ScrollGallery })))
const GlowGallery = lazy(() => import('@/components/GlowGallery').then((m) => ({ default: m.GlowGallery })))
const LocalityGallery = lazy(() => import('@/components/LocalityGallery').then((m) => ({ default: m.LocalityGallery })))
const HistoryGallery = lazy(() => import('@/components/HistoryGallery').then((m) => ({ default: m.HistoryGallery })))
const SidebarListGallery = lazy(() => import('@/components/SidebarListGallery').then((m) => ({ default: m.SidebarListGallery })))
const TimelineGallery = lazy(() => import('@/components/TimelineGallery').then((m) => ({ default: m.TimelineGallery })))

// The gallery has no data, so it skips sign-in: open /#components.
const gallery = location.hash === '#components'
const charts = location.hash === '#charts' // chart options for the agent's answers
const scroll = location.hash === '#scroll' // scrollbar styles on the shadcn ScrollArea
const glow = location.hash === '#glow' // glow options for the map's outlines, markers and dots
const locality = location.hash === '#locality' // locality outlines for the Stat Card
const history = location.hash === '#history' // the rows of the occurrences history as three columns
const sidebarLists = location.hash === '#sidebar' // ways to keep the sidebar's Recurrences and Incidents lists short
const timeline = location.hash === '#timeline' // ways to show a problem's history as a timeline

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Every Phosphor icon is the bold weight (owner, 2026-10-30) unless it asks for another (fill on the map badges, the buttons' sparkle and the bullet). */}
    <IconContext.Provider value={{ weight: 'bold' }}>
      <ErrorBoundary>
        {sidebarLists ? (
          <Suspense fallback={null}>
            <SidebarListGallery />
          </Suspense>
        ) : history ? (
          <Suspense fallback={null}>
            <HistoryGallery />
          </Suspense>
        ) : locality ? (
          <Suspense fallback={null}>
            <LocalityGallery />
          </Suspense>
        ) : glow ? (
          <Suspense fallback={null}>
            <GlowGallery />
          </Suspense>
        ) : scroll ? (
          <Suspense fallback={null}>
            <ScrollGallery />
          </Suspense>
        ) : timeline ? (
          <Suspense fallback={null}>
            <TimelineGallery />
          </Suspense>
        ) : charts ? (
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
