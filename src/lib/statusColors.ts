// Status labels and color tokens for incidents and problems. Kept in a file with no imports so the marker code and its test pages can read them without loading Supabase (CI and test pages have no .env).

/** Incident status groups and the color token each one uses (CSS variable name; the map resolves it with token() because MapLibre needs a literal color). */
export const GROUPS = {
  pending: { label: 'Pending', token: '--map-pending', swatch: '--map-pending' },
  reviewing: { label: 'Reviewing', token: '--map-reviewing', swatch: '--map-reviewing' },
  approved: { label: 'Approved', token: '--map-approved', swatch: '--blue-300' }, // the small swatches in menus and lists use blue-300: the map's dark blue is only 2.5:1 on the menu (owner, 2026-11-01)
  rejected: { label: 'Rejected', token: '--map-rejected', swatch: '--map-rejected' },
} as const
export type Group = keyof typeof GROUPS

/** Lifecycle of a recurrence (decision 0030): its own, separate from the incident statuses. */
export type ProblemStatus = 'active' | 'monitoring' | 'resolved' | 'archived'
export const PROBLEM_STATUSES: ProblemStatus[] = ['active', 'monitoring', 'resolved', 'archived']
/** Label and color token (CSS variable) of each problem status; `outline` is the 400 step of the marker's own inner outline (owner, 2026-11-07, it was the 200 step for a while; the rest of the recurrence uses `token`, the 300 step), `pill` is the fill and text of its status pill on the Recurrence Card and Panel (Figma draws only Active: red-900 and red-200; the others follow the same pattern, owner to confirm). */
export const PROBLEM_STATUS: Record<ProblemStatus, { label: string; token: string; outline: string; pill: { bg: string; text: string } }> = {
  active: { label: 'Active', token: '--map-problem-active', outline: '--red-400', pill: { bg: '--red-900', text: '--red-200' } },
  monitoring: { label: 'Monitoring', token: '--map-problem-monitoring', outline: '--yellow-400', pill: { bg: '--yellow-900', text: '--yellow-200' } },
  resolved: { label: 'Resolved', token: '--map-problem-resolved', outline: '--indigo-400', pill: { bg: '--indigo-900', text: '--indigo-200' } },
  archived: { label: 'Archived', token: '--map-problem-archived', outline: '--neutral-400', pill: { bg: '--neutral-600', text: '--neutral-100' } },
}
