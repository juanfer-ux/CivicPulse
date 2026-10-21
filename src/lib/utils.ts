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
