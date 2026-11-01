// Status labels and color tokens for incidents and problems. Kept in a file with no imports so the marker code and its test pages can read them without loading Supabase (CI and test pages have no .env).

/** Incident status groups and the color token each one uses (CSS variable name; the map resolves it with token() because MapLibre needs a literal color). */
export const GROUPS = {
  pending: { label: 'Pending', token: '--map-pending' },
  reviewing: { label: 'Reviewing', token: '--map-reviewing' },
  approved: { label: 'Approved', token: '--map-approved' },
  rejected: { label: 'Rejected', token: '--map-rejected' },
} as const
export type Group = keyof typeof GROUPS

/** Lifecycle of a persistent problem (decision 0030): its own, separate from the incident statuses. */
export type ProblemStatus = 'active' | 'monitoring' | 'resolved' | 'archived'
export const PROBLEM_STATUSES: ProblemStatus[] = ['active', 'monitoring', 'resolved', 'archived']
/** Label and color token (CSS variable) of each problem status. */
export const PROBLEM_STATUS: Record<ProblemStatus, { label: string; token: string }> = {
  active: { label: 'Active', token: '--map-problem-active' },
  monitoring: { label: 'Monitoring', token: '--map-problem-monitoring' },
  resolved: { label: 'Resolved', token: '--map-problem-resolved' },
  archived: { label: 'Archived', token: '--map-problem-archived' },
}
