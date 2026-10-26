/** Current value of a CSS color token (e.g. '--warning'), for code that cannot use a CSS variable, such as the map's paint settings. */
export const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

/** Mixes two '#rrggbb' colors: `t` of `a`, the rest of `b`. Used to tone a color down toward the map's land color without losing its hue. */
export const mix = (a: string, b: string, t: number) => {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + 2 * i, 3 + 2 * i), 16)
  return '#' + [0, 1, 2].map((i) => Math.round(ch(a, i) * t + ch(b, i) * (1 - t)).toString(16).padStart(2, '0')).join('')
}

/** How much of its own color a toned-down (not selected) incident keeps. */
export const KEEP = 0.55
