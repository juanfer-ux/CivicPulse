/** Exactly one sidebar row is active at a time (owner, 2026-11-12), and it is the latest thing the person did: a row they clicked in the sidebar (Explore, an investigation, the "New recurrence" row) while the open recurrence or incident has not changed since, else the open recurrence or incident, else Explore (an empty investigation), else the open investigation. */
export type Pick = { kind: 'explore' } | { kind: 'chat' | 'case'; id: number }
export type Active = { kind: 'recurrence' | 'incident'; id: string } | Pick

export const activeRow = (s: { selected?: { kind: 'recurrence' | 'incident'; id: string } | null; pick?: Pick | null; exploring: boolean; activeId: number }): Active =>
  s.pick ?? s.selected ?? (s.exploring ? { kind: 'explore' } : { kind: 'chat', id: s.activeId })
