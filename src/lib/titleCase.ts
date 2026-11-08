// Text casing for what the database writes in lowercase (owner, 2026-11-08). No imports, so the tests can load it without Supabase.
const SMALL = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'at', 'by', 'for', 'to', 'and', 'or', 'but', 'de', 'del', 'la', 'las', 'el', 'los', 'con', 'y', 'en', 'al', 'por'])

/** Title Case: every word starts with a capital, short English and Spanish words stay lowercase (except the first). The rest of each word is left as written (Cra, Cl, #62-40, SIMUR). */
export const titleCase = (t: string) => t.replace(/\S+/g, (w, i) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1)))

/** Sentence case for free text: the first letter of every sentence, and of what follows a colon, is a capital. The rest is left as written. */
export const sentenceCase = (t: string) => t.replace(/(^|[.!?:]\s+)(\p{Ll})/gu, (_, a: string, c: string) => a + c.toUpperCase())
