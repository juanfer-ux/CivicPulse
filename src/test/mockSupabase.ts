import { vi } from 'vitest'

export type QueryResult = { data: unknown; error: unknown }

/**
 * A chainable stand-in for a Supabase query builder: every method returns itself, and the
 * object is thenable, resolving to a fixed `{ data, error }` once awaited — regardless of which
 * chain of .select()/.eq()/.order()/etc. led there. Good enough for code that only ever reads
 * the final `{ data, error }`, which is every call site in this app.
 */
export function makeQueryBuilder(result: QueryResult) {
  const builder = {
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    is: vi.fn(() => builder),
    update: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: (r: QueryResult) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  }
  return builder
}

const ok = (data: unknown = null): QueryResult => ({ data, error: null })

/** A fresh mock Supabase client. `responses[table]` configures what `.from(table)` resolves to; anything
 * else falls back to `fallback` (default: `{ data: [], error: null }`, i.e. "table exists, empty"). */
export function makeSupabaseMock(responses: Record<string, QueryResult> = {}, fallback: QueryResult = ok([])) {
  return {
    from: vi.fn((table: string) => makeQueryBuilder(responses[table] ?? fallback)),
    functions: { invoke: vi.fn(async () => ok({ id: 'new-user-id' })) },
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null } })),
      signInWithPassword: vi.fn(async () => ok()),
      signUp: vi.fn(async () => ok()),
      resetPasswordForEmail: vi.fn(async () => ok()),
    },
    rpc: vi.fn(async () => ok()),
  }
}
