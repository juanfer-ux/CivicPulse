// Plain TS, no Deno-specific APIs, so both the edge function (Deno) and the Vitest suite (Node) can
// import it directly — the regression test exercises the exact code that runs in production.
//
// The invitation email's link goes wherever this points, so it can't be trusted as-is from the
// client: a raw request (e.g. a stolen Super Admin token) could set it to a phishing domain.
// Only the deployed app's own origin, or localhost during development, is allowed through.
// The live address (renamed 2026-10-30) and the old one, which now redirects to it.
const APP_ORIGINS = ['https://civicpulse-bogota.vercel.app', 'https://civic-pulse-oct-8.vercel.app']

export const isAllowedRedirect = (value: string): boolean => {
  try {
    const origin = new URL(value).origin
    return APP_ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  } catch {
    return false
  }
}
