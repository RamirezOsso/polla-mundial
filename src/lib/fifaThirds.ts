// Matriz oficial FIFA 2026 - Annex C
// Fuente: Wikipedia - 2026 FIFA World Cup knockout stage
// Columnas: [1A_vs, 1B_vs, 1D_vs, 1E_vs, 1G_vs, 1I_vs, 1K_vs, 1L_vs]

const MATRIX: Record<string, string[]> = {
  'DEFGHIJKL': ['3E','3J','3I','3F','3H','3G','3L','3K'],
  'CEFGHIJKL': ['3E','3J','3I','3C','3H','3G','3L','3K'],
  'CDFGHIJKL': ['3H','3G','3I','3C','3J','3F','3L','3K'],
  'CDEGHIJKL': ['3E','3J','3I','3C','3H','3G','3L','3K'],
  'CDEFHIJKL': ['3E','3J','3I','3C','3H','3F','3L','3K'],
  'CDEFGIJKL': ['3E','3G','3I','3C','3J','3F','3L','3K'],
  'CDEFGHJKL': ['3E','3G','3J','3C','3H','3F','3L','3K'],
  'CDEFGHIKL': ['3E','3G','3I','3C','3H','3F','3L','3K'],
  'CDEFGHIJL': ['3E','3G','3J','3C','3H','3F','3L','3I'],
  'CDEFGHIJK': ['3E','3G','3J','3C','3H','3F','3I','3K'],
  'BEFGHIJKL': ['3H','3J','3B','3F','3I','3G','3L','3K'],
  'BDFGHIJKL': ['3H','3G','3I','3D','3J','3F','3L','3K'],
  'BDEGHIJKL': ['3E','3J','3I','3B','3H','3G','3L','3K'],
  'BDEFHIJKL': ['3E','3J','3I','3D','3H','3F','3L','3K'],
  'BDEFGIJKL': ['3E','3G','3I','3D','3J','3F','3L','3K'],
  'BDEFGHJKL': ['3E','3G','3J','3D','3H','3F','3L','3K'],
  'BDEFGHIKL': ['3E','3G','3I','3D','3H','3F','3L','3K'],
  'BDEFGHIJL': ['3E','3G','3J','3D','3H','3F','3L','3I'],
  'BDEFGHIJK': ['3E','3G','3J','3D','3H','3F','3I','3K'],
  'BCFGHIJKL': ['3H','3J','3B','3C','3I','3G','3L','3K'],
  'BCDGHIJKL': ['3H','3G','3I','3C','3J','3D','3L','3K'],
  'BCDFHIJKL': ['3C','3J','3B','3D','3H','3F','3L','3K'],
  'BCDFGIJKL': ['3C','3G','3B','3D','3J','3F','3L','3K'],
  'BCDFGHJKL': ['3C','3G','3B','3D','3J','3F','3L','3K'],
  'BCDFGHIKL': ['3C','3G','3B','3D','3I','3F','3L','3K'],
  'BCDFGHIJL': ['3C','3G','3B','3D','3J','3F','3L','3I'],
  'BCDFGHIJK': ['3C','3G','3J','3D','3H','3F','3E','3K'],
  'BCEFHIJKL': ['3E','3J','3B','3C','3I','3H','3L','3K'],
  'BCEFGIJKL': ['3E','3J','3B','3C','3I','3G','3L','3K'],
  'BCEFGHJKL': ['3E','3J','3B','3C','3H','3G','3L','3K'],
  'BCEFGHIKL': ['3E','3G','3B','3C','3I','3H','3L','3K'],
  'BCEFGHIJL': ['3E','3J','3B','3C','3H','3G','3L','3I'],
  'BCEFGHIJK': ['3E','3J','3B','3C','3H','3G','3I','3K'],
  'BCDEHIJKL': ['3E','3J','3B','3C','3I','3D','3L','3K'],
  'BCDEGHIJKL':['3E','3J','3I','3C','3H','3D','3L','3K'],
  'BCDEFIJKL': ['3C','3J','3E','3D','3I','3F','3L','3K'],
  'BCDEFHJKL': ['3C','3J','3E','3D','3H','3F','3L','3K'],
  'BCDEFHIKL': ['3C','3E','3I','3D','3H','3F','3L','3K'],
  'BCDEFHIJL': ['3C','3J','3E','3D','3H','3F','3L','3I'],
  'BCDEFHIJK': ['3C','3J','3E','3D','3H','3F','3I','3K'],
  'BCDEFGJKL': ['3C','3G','3E','3D','3J','3F','3L','3K'],
  'BCDEFGIKL': ['3C','3G','3E','3D','3I','3F','3L','3K'],
  'BCDEFGIJL': ['3C','3G','3E','3D','3J','3F','3L','3I'],
  'BCDEFGIJK': ['3C','3G','3E','3D','3J','3F','3I','3K'],
  'BCDEFGHKL': ['3C','3G','3E','3D','3H','3F','3L','3K'],
  'BCDEFGHJL': ['3C','3G','3J','3D','3H','3F','3L','3E'],
  'BCDEFGHJK': ['3C','3G','3J','3D','3H','3F','3E','3K'],
  'BCDEFGHIL': ['3C','3G','3E','3D','3H','3F','3L','3I'],
  'BCDEFGHIK': ['3C','3G','3E','3D','3H','3F','3I','3K'],
  'BCDEFGHIJ': ['3C','3G','3J','3D','3H','3F','3E','3I'],
  'ACFGHIJKL': ['3H','3C','3A','3F','3I','3G','3L','3K'],
  'ACDFHIJKL': ['3C','3A','3D','3F','3H','3I','3L','3K'],
  'ACDFGIJKL': ['3C','3A','3D','3F','3J','3G','3L','3K'],
  'ACDFGHJKL': ['3C','3A','3D','3F','3J','3G','3L','3K'],
  'ACDFGHIKL': ['3C','3A','3D','3F','3I','3G','3L','3K'],
  'ACDFGHIJL': ['3C','3A','3D','3F','3J','3G','3L','3I'],
  'ACDFGHIJK': ['3C','3A','3D','3F','3J','3G','3I','3K'],
  'ACEFHIJKL': ['3E','3A','3C','3F','3I','3H','3L','3K'],
  'ACEFGIJKL': ['3E','3A','3C','3F','3I','3G','3L','3K'],
  'ACEFGHJKL': ['3E','3A','3C','3F','3H','3G','3L','3K'],
  'ACEFGHIKL': ['3E','3A','3C','3F','3I','3H','3L','3K'],
  'ACEFGHIJL': ['3E','3A','3C','3F','3H','3G','3L','3I'],
  'ACEFGHIJK': ['3E','3A','3C','3F','3H','3G','3I','3K'],
  'ACDEHIJKL': ['3E','3A','3C','3D','3I','3H','3L','3K'],
  'ACDEGHIJKL':['3E','3A','3C','3D','3H','3G','3L','3K'],
  'ACDEFIJKL': ['3C','3A','3E','3D','3I','3F','3L','3K'],
  'ACDEFHJKL': ['3C','3A','3E','3D','3H','3F','3L','3K'],
  'ACDEFHIKL': ['3C','3A','3E','3D','3H','3F','3L','3K'],
  'ACDEFHIJL': ['3C','3A','3E','3D','3H','3F','3L','3I'],
  'ACDEFHIJK': ['3C','3A','3E','3D','3H','3F','3I','3K'],
  'ACDEFGJKL': ['3C','3A','3E','3D','3J','3F','3L','3K'],
  'ACDEFGIKL': ['3C','3A','3E','3D','3I','3F','3L','3K'],
  'ACDEFGIJL': ['3C','3A','3E','3D','3J','3F','3L','3I'],
  'ACDEFGIJK': ['3C','3A','3E','3D','3J','3F','3I','3K'],
  'ACDEFGHKL': ['3C','3A','3E','3D','3H','3F','3L','3K'],
  'ACDEFGHJL': ['3C','3A','3J','3D','3H','3F','3L','3E'],
  'ACDEFGHJK': ['3C','3A','3J','3D','3H','3F','3E','3K'],
  'ACDEFGHIL': ['3C','3A','3E','3D','3H','3F','3L','3I'],
  'ACDEFGHIK': ['3C','3A','3E','3D','3H','3F','3I','3K'],
  'ACDEFGHIJ': ['3C','3A','3J','3D','3H','3F','3E','3I'],
  'ABCGHIJKL': ['3H','3B','3A','3C','3I','3G','3L','3K'],
  'ABCFHIJKL': ['3H','3B','3A','3C','3I','3F','3L','3K'],
  'ABCFGIJKL': ['3I','3B','3A','3C','3J','3F','3L','3K'],
  'ABCFGHJKL': ['3H','3B','3A','3C','3J','3F','3L','3K'],
  'ABCFGHIKL': ['3H','3B','3A','3C','3I','3F','3L','3K'],
  'ABCFGHIJL': ['3H','3B','3A','3C','3J','3F','3L','3I'],
  'ABCFGHIJK': ['3H','3B','3A','3C','3J','3F','3I','3K'],
  'ABCEHIJKL': ['3E','3B','3A','3C','3I','3H','3L','3K'],
  'ABCEGIJKL': ['3E','3B','3A','3C','3I','3G','3L','3K'],
  'ABCEGHJKL': ['3E','3B','3A','3C','3H','3G','3L','3K'],
  'ABCEGHIKL': ['3E','3B','3A','3C','3I','3H','3L','3K'],
  'ABCEGHIJL': ['3E','3B','3A','3C','3H','3G','3L','3I'],
  'ABCEGHIJK': ['3E','3B','3A','3C','3H','3G','3I','3K'],
  'ABCDHIJKL': ['3H','3B','3A','3C','3I','3D','3L','3K'],
  'ABCDGHIJKL':['3H','3B','3A','3C','3J','3D','3L','3K'],
  'ABCDFIJKL': ['3C','3B','3A','3D','3I','3F','3L','3K'],
  'ABCDFHJKL': ['3C','3B','3A','3D','3H','3F','3L','3K'],
  'ABCDFHIKL': ['3C','3B','3A','3D','3H','3F','3L','3K'],
  'ABCDFHIJL': ['3C','3B','3A','3D','3H','3F','3L','3I'],
  'ABCDFHIJK': ['3C','3B','3A','3D','3H','3F','3I','3K'],
  'ABCDFGJKL': ['3C','3B','3A','3D','3J','3F','3L','3K'],
  'ABCDFGIKL': ['3C','3B','3A','3D','3I','3F','3L','3K'],
  'ABCDFGIJL': ['3C','3B','3A','3D','3J','3F','3L','3I'],
  'ABCDFGIJK': ['3C','3B','3A','3D','3J','3F','3I','3K'],
  'ABCDFGHKL': ['3C','3B','3A','3D','3H','3F','3L','3K'],
  'ABCDFGHJL': ['3C','3B','3A','3D','3J','3F','3L','3E'],
  'ABCDFGHJK': ['3C','3B','3A','3D','3J','3F','3E','3K'],
  'ABCDFGHIL': ['3C','3B','3A','3D','3H','3F','3L','3I'],
  'ABCDFGHIK': ['3C','3B','3A','3D','3H','3F','3I','3K'],
  'ABCDFGHIJ': ['3C','3B','3A','3D','3J','3F','3E','3I'],
  'ABCDEIJKL': ['3E','3B','3A','3C','3I','3D','3L','3K'],
  'ABCDEGHIJKL':['3E','3B','3A','3C','3H','3D','3L','3K'],
  'ABCDEFIJKL':['3C','3B','3A','3E','3I','3F','3L','3K'],
  'ABCDEFHJKL':['3C','3B','3A','3E','3H','3F','3L','3K'],
  'ABCDEFHIKL':['3C','3B','3A','3E','3H','3F','3L','3K'],
  'ABCDEFHIJL':['3C','3B','3A','3E','3H','3F','3L','3I'],
  'ABCDEFHIJK':['3C','3B','3A','3E','3H','3F','3I','3K'],
  'ABCDEFGJKL':['3C','3B','3A','3E','3J','3F','3L','3K'],
  'ABCDEFGIKL':['3C','3B','3A','3E','3I','3F','3L','3K'],
  'ABCDEFGIJL':['3C','3B','3A','3E','3J','3F','3L','3I'],
  'ABCDEFGIJK':['3C','3B','3A','3E','3J','3F','3I','3K'],
  'ABCDEFGHKL':['3C','3B','3A','3E','3H','3F','3L','3K'],
  'ABCDEFGHJL':['3H','3B','3A','3E','3J','3F','3L','3C'],
  'ABCDEFGHJK':['3H','3B','3A','3E','3J','3F','3C','3K'],
  'ABCDEFGHIL':['3C','3B','3A','3E','3H','3F','3L','3I'],
  'ABCDEFGHIK':['3C','3B','3A','3E','3H','3F','3I','3K'],
  'ABCDEFGHIJ':['3H','3B','3A','3E','3J','3F','3C','3I'],
  'ABCDEFGHIJKL':['3C','3B','3A','3E','3H','3F','3L','3K'],
}

const MATCH_IDX: Record<string, number> = {
  'A': 0, 'B': 1, 'D': 2, 'E': 3, 'G': 4, 'I': 5, 'K': 6, 'L': 7
}

export function assignThirdsOfficially(
  qualifiedGroups: string[],
  teamsByGroup: Record<string, any>
): Record<string, any> {
  const key = [...qualifiedGroups].sort().join('')
  const assignments = MATRIX[key]
  const result: Record<string, any> = {}

  if (assignments) {
    Object.entries(MATCH_IDX).forEach(([matchGroup, idx]) => {
      const thirdCode = assignments[idx]
      const thirdGroup = thirdCode.replace('3', '')
      if (teamsByGroup[thirdGroup]) {
        result[matchGroup] = teamsByGroup[thirdGroup]
      }
    })
  } else {
    // Fallback por grupos permitidos
    const FALLBACK: Record<string, string[]> = {
      'E': ['A','B','C','D','F'],
      'I': ['C','D','F','G','H'],
      'A': ['C','E','F','H','I'],
      'L': ['E','H','I','J','K'],
      'G': ['A','E','H','I','J'],
      'D': ['B','E','F','I','J'],
      'B': ['E','F','G','I','J'],
      'K': ['D','E','I','J','L'],
    }
    const assigned = new Set<string>()
    Object.keys(FALLBACK)
      .sort((a, b) => FALLBACK[a].length - FALLBACK[b].length)
      .forEach(matchGroup => {
        const best = qualifiedGroups.find(g => FALLBACK[matchGroup].includes(g) && !assigned.has(g))
        if (best) {
          assigned.add(best)
          result[matchGroup] = teamsByGroup[best]
        }
      })
  }

  return result
}
