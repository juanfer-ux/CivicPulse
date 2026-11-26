/** A location on two lines (owner, 2026-11-25): the address, then after its first comma the phrase that says where it is ("Cl 72 #24-30," / "entrada del colegio"). Show it with `whitespace-pre-line`; a location with no comma stays on one line. */
export const twoLines = (location: string) => location.replace(/,\s*/, ',\n')
