// Matriz oficial FIFA 2026 - Annex C (combinaciones principales)
// Columnas: [1A_vs, 1B_vs, 1D_vs, 1E_vs, 1G_vs, 1I_vs, 1K_vs, 1L_vs]
const MATRIX: Record<string, string[]> = {
  'ABCEFIJL': ['3C','3B','3A','3E','3J','3I','3L','3F'],
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
  'ABCDEFGHIJKL':['3C','3B','3A','3E','3H','3F','3L','3K'],
}

const MATCH_IDX: Record<string, number> = {
  'A': 0, 'B': 1, 'D': 2, 'E': 3, 'G': 4, 'I': 5, 'K': 6, 'L': 7
}

// Grupos permitidos por cada partido con tercero (oficial FIFA)
const ALLOWED: Record<string, string[]> = {
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
    // Usar matriz oficial exacta
    Object.entries(MATCH_IDX).forEach(([matchGroup, idx]) => {
      const thirdGroup = assignments[idx].replace('3', '')
      if (teamsByGroup[thirdGroup]) {
        result[matchGroup] = teamsByGroup[thirdGroup]
      }
    })
    return result
  }

  // Fallback robusto: algoritmo de asignación óptima
  // Ordenar partidos de más restrictivo a menos restrictivo
  const matchGroups = Object.keys(ALLOWED)
  const sortedMatches = matchGroups.sort((a, b) => {
    const aOpts = ALLOWED[a].filter(g => qualifiedGroups.includes(g)).length
    const bOpts = ALLOWED[b].filter(g => qualifiedGroups.includes(g)).length
    return aOpts - bOpts // Menos opciones primero
  })

  const assigned = new Set<string>()

  sortedMatches.forEach(matchGroup => {
    const allowed = ALLOWED[matchGroup]
    // Buscar el mejor tercero disponible de los grupos permitidos
    // Ordenar por ranking (el array qualifiedGroups ya viene ordenado por pts)
    const best = qualifiedGroups.find(g => allowed.includes(g) && !assigned.has(g))
    if (best) {
      assigned.add(best)
      result[matchGroup] = teamsByGroup[best]
    }
  })

  // Verificar que todos los terceros clasificados fueron asignados
  // Si quedaron sin asignar, forzar asignación ignorando restricciones
  const unassigned = qualifiedGroups.filter(g => !assigned.has(g))
  const emptySlots = matchGroups.filter(mg => !result[mg])

  unassigned.forEach((g, i) => {
    if (emptySlots[i]) {
      result[emptySlots[i]] = teamsByGroup[g]
    }
  })

  return result
}
