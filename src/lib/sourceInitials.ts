// The two letters on a report source's tile in the Occurrences History (a placeholder until real logos are decided). No imports, so tests can load it.
const SKIP = new Set(['te', 'la', 'en', 'de', 'del', 'el', 'los', 'las', 'yo'])
/** The two letters of a source's logo tile (placeholder until real logos are decided): an acronym gives its first two letters (UAESP is UA), otherwise the first letters of the first two meaningful words (Community reporting channel is CR, Bogotá te Escucha is BE). */
export function initials(source: string) {
  const words = source.split(/[^\p{L}]+/u).filter((w) => w && !SKIP.has(w.toLowerCase()))
  if (!words.length) return '?'
  if (words[0].length > 1 && words[0] === words[0].toUpperCase()) return words[0].slice(0, 2)
  return (words[0][0] + (words[1]?.[0] ?? words[0][1] ?? '')).toUpperCase()
}
