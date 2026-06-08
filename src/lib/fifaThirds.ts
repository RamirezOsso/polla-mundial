// Matriz oficial FIFA 2026 - Annex C (combinaciones más comunes)
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
  'ABCEFIJL':  ['3C','3B','3A','3E','3J','3I','3L','3F'],
  'ABCEFIJK':  ['3C','3B','3A','3E','3J','3I','3F','3K'],
  'ABCEFIJKL': ['3C','3B','3A','3E','3J','3I','3L','3F'],
  'ABCEFIJL':  ['3C','3B','3A','3E','3J','3I','3L','3F'],
  'ABCEFIJKL': ['3C','3B','3A','3E','3J','3F','3L','3I'],
  'ABCEIJL':   ['3C','3B','3A','3E','3J','3I','3L','3F'],
}

const MATCH_IDX: Record<string, number> = {
  'A': 0, 'B': 1, 'D': 2, 'E': 3, 'G': 4, 'I': 5, 'K': 6, 'L': 7
}

// Grupos permitidos por partido (fallback oficial)
const ALLOWED_GROUPS: Record<string, string[]> = {
  'E': ['A','B','C','D','F'],
  'I': ['C','D','F','G','H'],
  'A': ['C','E','F','H','I'],
  'L': ['E','H','I','J','K'],
  'G': ['A','E','H','I','J'],
  'D': ['B','E','F','I','J'],
  'B': ['E','F','G','I','J'],
  'K': ['D','E','I','J','L'],
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
    // Fallback: asignar por grupos permitidos respetando que
    // ningún tercero se enfrente a un equipo de su propio grupo
    const assigned = new Set<string>()

    // Ordenar partidos por cantidad de opciones (menos primero = más restrictivo)
    const sortedMatches = Object.keys(ALLOWED_GROUPS).sort((a, b) => {
      const aOpts = ALLOWED_GROUPS[a].filter(g => qualifiedGroups.includes(g)).length
      const bOpts = ALLOWED_GROUPS[b].filter(g => qualifiedGroups.includes(g)).length
      return aOpts - bOpts
    })

    sortedMatches.forEach(matchGroup => {
      const allowed = ALLOWED_GROUPS[matchGroup]
      const best = qualifiedGroups.find(g => allowed.includes(g) && !assigned.has(g))
      if (best) {
        assigned.add(best)
        result[matchGroup] = teamsByGroup[best]
      }
    })
  }

  return result
}
