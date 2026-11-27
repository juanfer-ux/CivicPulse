// Status labels and color tokens for incidents and problems. Kept in a file with no imports so the marker code and its test pages can read them without loading Supabase (CI and test pages have no .env).

/** Incident status groups and the color token each one uses (CSS variable name; the map resolves it with token() because MapLibre needs a literal color). */
export const GROUPS = {
  pending: { label: 'Pending', token: '--map-pending', swatch: '--map-pending', pill: { bg: '--yellow-900', text: '--yellow-500' } },
  reviewing: { label: 'Reviewing', token: '--map-reviewing', swatch: '--map-reviewing', pill: { bg: '--orange-900', text: '--orange-500' } },
  approved: { label: 'Approved', token: '--map-approved', swatch: '--blue-300', pill: { bg: '--blue-900', text: '--blue-300' } }, // the small swatches in menus and lists use blue-300: the map's dark blue is only 2.5:1 on the menu (owner, 2026-11-01)
  rejected: { label: 'Rejected', token: '--map-rejected', swatch: '--map-rejected', pill: { bg: '--red-900', text: '--red-400' } },
} as const
export type Group = keyof typeof GROUPS

/** Lifecycle of a recurrence (decision 0030): its own, separate from the incident statuses. */
export type ProblemStatus = 'active' | 'monitoring' | 'resolved' | 'archived'
export const PROBLEM_STATUSES: ProblemStatus[] = ['active', 'monitoring', 'resolved', 'archived']
/** Label and color token (CSS variable) of each problem status; `outline` is the 600 step of the marker's own inner outline (owner, 2026-11-07; 300 before, then 200 and 400; the rest of the recurrence uses `token`, the 300 step), `pill` is the fill and text of its status pill on the Recurrence Card and Panel (owner's Figma Recurrence Status Pill, 2026-11-25, all four). */
export const PROBLEM_STATUS: Record<ProblemStatus, { label: string; token: string; outline: string; pill: { bg: string; text: string } }> = {
  active: { label: 'Active', token: '--map-problem-active', outline: '--red-600', pill: { bg: '--red-900', text: '--red-400' } },
  monitoring: { label: 'Monitoring', token: '--map-problem-monitoring', outline: '--yellow-600', pill: { bg: '--yellow-900', text: '--yellow-500' } },
  resolved: { label: 'Resolved', token: '--map-problem-resolved', outline: '--blue-600', pill: { bg: '--blue-900', text: '--blue-300' } },
  archived: { label: 'Archived', token: '--map-problem-archived', outline: '--neutral-600', pill: { bg: '--neutral-600', text: '--fg-secondary' } },
}
