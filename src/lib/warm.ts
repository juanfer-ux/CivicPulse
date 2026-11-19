/** Data requests started early (owner's speed check, 2026-11-17): the dashboard's reads used to start only after the profile, the permissions and the app chunk had loaded, one after the other. `warm` starts one as soon as the person is signed in; the screen's own call then `take`s the answer that is already on its way (once: a later refresh asks again). The latest `warm` of a key wins, so a different user never receives the previous one's data. */
const slots = new Map<string, Promise<unknown>>()

export function warm<T>(key: string, load: () => Promise<T>): void {
  const p = load()
  p.catch(() => {}) // the screen's own call reports the error when it takes this promise
  slots.set(key, p)
}

export function take<T>(key: string, load: () => Promise<T>): Promise<T> {
  const p = slots.get(key) as Promise<T> | undefined
  slots.delete(key)
  return p ?? load()
}
