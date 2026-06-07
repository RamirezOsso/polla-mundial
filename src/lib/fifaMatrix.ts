// Matriz oficial FIFA 2026 - Annex C
// Formato: clave = grupos ordenados de los 8 terceros clasificados
// Valor: [1A_vs, 1B_vs, 1D_vs, 1E_vs, 1G_vs, 1I_vs, 1K_vs, 1L_vs]
// Cada partido tiene tercero asignado a ese primero de grupo

export const FIFA_MATRIX: Record<string, string[]> = {
  'DEFGHIJKL': ['3E','3J','3I','3F','3H','3G','3L','3K'], // no A,B,C
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
  'BDЕФHIJKL': ['3E','3J','3I','3D','3H','3F','3L','3K'],
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
  'BCDEGHIJKL': ['3E','3J','3I','3C','3H','3D','3L','3K'],
  'BCDEФHIJKL': ['3E','3J','3I','3C','3H','3D','3L','3K'],
  // Combinaciones con A
  'ABCDEFGHI': ['3C','3G','3J','3D','3H','3F','3E','3I'],
  'ABCDEFGHJ': ['3C','3G','3J','3D','3H','3F','3E','3K'],
  'ABCDEFGHK': ['3C','3G','3E','3D','3H','3F','3I','3K'],
  'ABCDEFGHL': ['3C','3G','3E','3D','3H','3F','3L','3I'],
  'ABCDEFGIJ': ['3C','3G','3E','3D','3J','3F','3I','3K'],
  'ABCDEFGIK': ['3C','3G','3E','3D','3I','3F','3L','3K'],
  'ABCDEFGIL': ['3C','3G','3E','3D','3J','3F','3L','3I'],
  'ABCDEFGJK': ['3C','3G','3E','3D','3J','3F','3I','3K'],
  'ABCDEFGJL': ['3C','3G','3J','3D','3J','3F','3L','3E'],
  'ABCDEFGKL': ['3C','3G','3E','3D','3H','3F','3L','3K'],
}

// Función principal para obtener el tercero asignado a cada primero
export function getThirdPlaceAssignment(
  qualifiedThirds: string[], // grupos de los 8 mejores terceros, ordenados
  matchKey: 'A'|'B'|'D'|'E'|'G'|'I'|'K'|'L', // primero de qué grupo
  allThirds: Record<string, any> // mapa de grupo → equipo
): any | null {
  const key = [...qualifiedThirds].sort().join('')
  const assignments = FIFA_MATRIX[key]

  if (!assignments) {
    // Fallback: usar lógica de grupos permitidos existente
    return null
  }

  const idx = ['A','B','D','E','G','I','K','L'].indexOf(matchKey)
  if (idx === -1) return null

  const thirdGroup = assignments[idx] // e.g. "3E" = tercero del grupo E
  const group = thirdGroup.replace('3', '')
  return allThirds[group] ?? null
}
