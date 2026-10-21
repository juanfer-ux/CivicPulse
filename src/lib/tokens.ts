/** Current value of a CSS color token (e.g. '--warning'), for code that cannot use a CSS variable, such as the map's paint settings. */
export const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
