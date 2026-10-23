import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/** Our text styles (src/index.css) are font sizes, not colors: without this, `text-label` is dropped when a `text-primary-foreground` follows it. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'stat', 'heading', 'title', 'subtitle', 'label', 'body', 'meta', 'caption'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** "Juan Fernando Pérez Gómez" → "Juan Pérez": first name plus first surname. ponytail: assumes 4+ words are two given names and two surnames, and 3 words are given name(s) plus one surname (first + last); add a profile field if that guess is wrong often. */
export function shortName(full: string | null | undefined): string {
  const w = (full ?? '').trim().split(/\s+/).filter(Boolean)
  if (w.length < 3) return w.join(' ')
  return `${w[0]} ${w[w.length >= 4 ? 2 : w.length - 1]}`
}

/** Up to two capital letters for an avatar without a photo. */
export function initials(full: string | null | undefined): string {
  return shortName(full)
    .split(' ')
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}
