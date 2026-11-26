/** The shades of a donut's slices, biggest first, used by the slice and its legend dot alike (owner, 2026-11-26): Today's top localities and the answer donut. Slices past the fifth take the last shade. */
const TONES = [['--cobalt-200', 1], ['--cobalt-200', 0.85], ['--cobalt-300', 0.7], ['--cobalt-400', 0.55], ['--cobalt-400', 0.4]] as const
export const donutTone = (i: number) => {
  const [token, opacity] = TONES[Math.min(i, TONES.length - 1)]
  return { color: `var(${token})`, opacity }
}
