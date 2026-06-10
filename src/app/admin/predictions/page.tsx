'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const STAGES = [
  { type: 'group', label: 'Fase de Grupos' },
  { type: 'round_of_32', label: 'Ronda de 32' },
  { type: 'round_of_16', label: 'Octavos de Final' },
  { type: 'quarter_final', label: 'Cuartos de Final' },
  { type: 'semi_final', label: 'Semifinales' },
  { type: 'third_place', label: 'Tercer Lugar' },
  { type: 'final', label: 'Final' },
]

const GROUPS = 'ABCDEFGHIJKL'.split('')

const R32_STRUCTURE = [
  { mn: 101, home: {g:'A',r:2}, away: {g:'B',r:2}, label:'2°A vs 2°B' },
  { mn: 102, home: {g:'C',r:1}, away: {g:'F',r:2}, label:'1°C vs 2°F' },
  { mn: 103, home: {g:'E',r:1}, away: {thirds:'ABCDF'}, label:'1°E vs 3°(ABCDF)' },
  { mn: 104, home: {g:'F',r:1}, away: {g:'C',r:2}, label:'1°F vs 2°C' },
  { mn: 105, home: {g:'E',r:2}, away: {g:'I',r:2}, label:'2°E vs 2°I' },
  { mn: 106, home: {g:'I',r:1}, away: {thirds:'CDFGH'}, label:'1°I vs 3°(CDFGH)' },
  { mn: 107, home: {g:'A',r:1}, away: {thirds:'CEFHI'}, label:'1°A vs 3°(CEFHI)' },
  { mn: 108, home: {g:'L',r:1}, away: {thirds:'EHIJK'}, label:'1°L vs 3°(EHIJK)' },
  { mn: 109, home: {g:'G',r:1}, away: {thirds:'AEHIJ'}, label:'1°G vs 3°(AEHIJ)' },
  { mn: 110, home: {g:'D',r:1}, away: {thirds:'BEFIJ'}, label:'1°D vs 3°(BEFIJ)' },
  { mn: 111, home: {g:'H',r:1}, away: {g:'J',r:2}, label:'1°H vs 2°J' },
  { mn: 112, home: {g:'K',r:2}, away: {g:'L',r:2}, label:'2°K vs 2°L' },
  { mn: 113, home: {g:'B',r:1}, away: {thirds:'DEIJL'}, label:'1°B vs 3°(DEIJL)' },
  { mn: 114, home: {g:'D',r:2}, away: {g:'G',r:2}, label:'2°D vs 2°G' },
  { mn: 115, home: {g:'J',r:1}, away: {g:'H',r:2}, label:'1°J vs 2°H' },
  { mn: 116, home: {g:'K',r:1}, away: {thirds:'DEIJL'}, label:'1°K vs 3°(DEIJL)' },
]

function calcStandings(groupMatches: any[], predMap: Map<string, any>, group: string) {
  const teams: Record<string, any> = {}
  groupMatches.filter(m => m.group_name === group).forEach((m: any) => {
    if (!teams[m.home_team_id]) teams[m.home_team_id] = { ...m.home_team, pts: 0, gd: 0, gf: 0 }
    if (!teams[m.away_team_id]) teams[m.away_team_id] = { ...m.away_team, pts: 0, gd: 0, gf: 0 }
    const pred = predMap.get(m.id)
    if (!pred) return
    const h = pred.home_score, a = pred.away_score
    teams[m.home_team_id].gf += h; teams[m.away_team_id].gf += a
    teams[m.home_team_id].gd += h - a; teams[m.away_team_id].gd += a - h
    if (h > a) teams[m.home_team_id].pts += 3
    else if (h < a) teams[m.away_team_id].pts += 3
    else { teams[m.home_team_id].pts += 1; teams[m.away_team_id].pts += 1 }
  })
  return Object.values(teams).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf)
}

function getWinner(pred: any, homeTeam: any, awayTeam: any) {
  if (!pred || !homeTeam || !awayTeam) return null
  if (Number(pred.home_score) === Number(pred.away_score)) return null
  return Number(pred.home_score) > Number(pred.away_score) ? homeTeam : awayTeam
}

function getLoser(pred: any, homeTeam: any, awayTeam: any) {
  const winner = getWinner(pred, homeTeam, awayTeam)
  if (!winner) return null
  return winner.id === homeTeam?.id ? awayTeam : homeTeam
}

export default function AdminPredictionsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [allPredictions, setAllPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: profiles }, { data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, is_spectator').order('display_name'),
      supabase.from('matches').select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(type, name)').order('match_number'),
      supabase.from('predictions').select('*').order('created_at'),
    ])
    setUsers(profiles ?? [])
    setMatches(matchData ?? [])
    setAllPredictions(predData ?? [])
    setLoading(false)
  }

  const resolveTeamsForUser = (userPreds: any[]) => {
    const predMap = new Map(userPreds.map(p => [p.match_id, p]))
    const groupMatches = matches.filter(m => m.stage?.type === 'group')

    // Standings por grupo
    const standings: Record<string, any[]> = {}
    GROUPS.forEach(g => { standings[g] = calcStandings(groupMatches, predMap, g) })

    // Mejores terceros
    const thirds = GROUPS.map(g => standings[g]?.[2] ? { ...standings[g][2], group: g } : null)
      .filter(Boolean).sort((a: any, b: any) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf) as any[]

    const assigned = new Set<string>()
    const assignedThirds: Record<string, any> = {}
    R32_STRUCTURE.forEach(slot => {
      const away = slot.away as any
      if (away.thirds) {
        const best = thirds.find(t => away.thirds.includes(t.group) && !assigned.has(t.id))
        if (best) { assigned.add(best.id); assignedThirds[`${slot.mn}_away`] = best }
      }
    })

    // R32 equipos
    const r32Matches = matches.filter(m => m.stage?.type === 'round_of_32').sort((a, b) => a.match_number - b.match_number)
    const r32WithTeams = R32_STRUCTURE.map((slot, i) => {
      const match = r32Matches[i]
      const homeSpec = slot.home as any
      const awaySpec = slot.away as any
      const homeTeam = homeSpec.g ? standings[homeSpec.g]?.[homeSpec.r - 1] ?? null : null
      const awayTeam = awaySpec.g ? standings[awaySpec.g]?.[awaySpec.r - 1] ?? null : assignedThirds[`${slot.mn}_away`] ?? null
      return { match, homeTeam, awayTeam, label: slot.label }
    })

    // R32 ganadores
    const r32Winners = r32WithTeams.map(s => getWinner(predMap.get(s.match?.id), s.homeTeam, s.awayTeam))

    // Octavos
    const r16Matches = matches.filter(m => m.stage?.type === 'round_of_16').sort((a, b) => a.match_number - b.match_number)
    const r16WithTeams = r16Matches.map((match, i) => ({
      match, homeTeam: r32Winners[i * 2] ?? null, awayTeam: r32Winners[i * 2 + 1] ?? null
    }))
    const r16Winners = r16WithTeams.map(s => getWinner(predMap.get(s.match?.id), s.homeTeam, s.awayTeam))

    // Cuartos
    const qfMatches = matches.filter(m => m.stage?.type === 'quarter_final').sort((a, b) => a.match_number - b.match_number)
    const qfWithTeams = qfMatches.map((match, i) => ({
      match, homeTeam: r16Winners[i * 2] ?? null, awayTeam: r16Winners[i * 2 + 1] ?? null
    }))
    const qfWinners = qfWithTeams.map(s => getWinner(predMap.get(s.match?.id), s.homeTeam, s.awayTeam))

    // Semis
    const sfMatches = matches.filter(m => m.stage?.type === 'semi_final').sort((a, b) => a.match_number - b.match_number)
    const sfWithTeams = sfMatches.map((match, i) => ({
      match, homeTeam: qfWinners[i * 2] ?? null, awayTeam: qfWinners[i * 2 + 1] ?? null
    }))
    const sfWinners = sfWithTeams.map(s => getWinner(predMap.get(s.match?.id), s.homeTeam, s.awayTeam))
    const sfLosers = sfWithTeams.map(s => getLoser(predMap.get(s.match?.id), s.homeTeam, s.awayTeam))

    // Tercer lugar y final
    const tpMatch = matches.find(m => m.stage?.type === 'third_place')
    const finalMatch = matches.find(m => m.stage?.type === 'final')

    return {
      predMap,
      groupMatches,
      standings,
      r32WithTeams,
      r16WithTeams,
      qfWithTeams,
      sfWithTeams,
      tpHome: sfLosers[0],
      tpAway: sfLosers[1],
      finalHome: sfWinners[0],
      finalAway: sfWinners[1],
      tpMatch,
      finalMatch,
    }
  }

  const generatePDF = async (userId: string | 'all') => {
    setGenerating(userId)
    try {
      const { jsPDF } = await import('jspdf')
      const usersToExport = userId === 'all' ? users : users.filter(u => u.id === userId)
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 15
      let y = 20
      let isFirstUser = true

      const checkPage = (needed = 10) => {
        if (y + needed > 275) { doc.addPage(); y = 20 }
      }

      // Portada
      doc.setFillColor(22, 163, 74)
      doc.rect(0, 0, 210, 60, 'F')
      doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
      doc.text('POLLA MUNDIAL 2026', pageW / 2, 28, { align: 'center' })
      doc.setFontSize(12); doc.setFont('helvetica', 'normal')
      doc.text('Backup de Pronosticos', pageW / 2, 40, { align: 'center' })
      doc.text(`Generado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`, pageW / 2, 50, { align: 'center' })
      doc.setFontSize(10); doc.setTextColor(200, 255, 200)
      doc.text(`${usersToExport.length} participantes | ${allPredictions.length} pronosticos`, pageW / 2, 57, { align: 'center' })

      for (const user of usersToExport) {
        const userPreds = allPredictions.filter(p => p.user_id === user.id)
        if (userPreds.length === 0) continue
        if (!isFirstUser) { doc.addPage(); y = 20 }
        else { y = 75 }
        isFirstUser = false

        const resolved = resolveTeamsForUser(userPreds)

        // Header usuario
        doc.setFillColor(22, 163, 74)
        doc.rect(margin - 2, y - 6, pageW - (margin - 2) * 2, 13, 'F')
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
        doc.text((user.display_name || user.username).toUpperCase(), margin + 2, y + 3)
        doc.setFontSize(9)
        doc.text(`${userPreds.length} pronosticos`, pageW - margin - 2, y + 3, { align: 'right' })
        y += 14

        const printMatch = (home: any, away: any, pred: any) => {
          if (!pred) return
          checkPage(7)
          const homeName = home?.short_name || home?.name || 'TBD'
          const awayName = away?.short_name || away?.name || 'TBD'
          const score = `${pred.home_score} - ${pred.away_score}`
          const fecha = new Date(pred.updated_at || pred.created_at).toLocaleString('es-CO', {
            timeZone: 'America/Bogota', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
          })
          doc.setFontSize(8.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(40, 40, 40)
          doc.text(`${homeName} vs ${awayName}`, margin + 6, y)
          doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74)
          doc.text(score, 118, y)
          doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130); doc.setFontSize(7.5)
          doc.text(fecha, 133, y)
          y += 6
          doc.setDrawColor(230, 230, 230)
          doc.line(margin + 5, y - 1, pageW - margin, y - 1)
        }

        const printStageHeader = (label: string) => {
          checkPage(12)
          y += 4
          doc.setFillColor(245, 245, 245)
          doc.rect(margin - 2, y - 5, pageW - (margin - 2) * 2, 8, 'F')
          doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(60, 60, 60)
          doc.text(label.toUpperCase(), margin + 2, y)
          y += 6
        }

        // Función para obtener equipo desde predicción o cálculo
        const getTeam = (pred: any, side: 'home' | 'away', calcTeam: any) => {
          const teamId = side === 'home' ? pred?.home_team_id : pred?.away_team_id
          if (teamId) {
            // Buscar en todos los matches el equipo guardado
            for (const m of matches) {
              if (m.home_team_id === teamId && m.home_team?.short_name !== 'TBD') return m.home_team
              if (m.away_team_id === teamId && m.away_team?.short_name !== 'TBD') return m.away_team
            }
          }
          return calcTeam
        }

        // GRUPOS
        printStageHeader('Fase de Grupos')
        const groupMatches = matches.filter(m => m.stage?.type === 'group')
        GROUPS.forEach(group => {
          const gm = groupMatches.filter(m => m.group_name === group)
          const gPreds = gm.filter(m => resolved.predMap.get(m.id))
          if (gPreds.length === 0) return
          checkPage(8); y += 2
          doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74)
          doc.text(`Grupo ${group}`, margin + 3, y); y += 5
          gm.forEach(match => {
            const pred = resolved.predMap.get(match.id)
            if (pred) printMatch(match.home_team, match.away_team, pred)
          })
        })

        // R32
        printStageHeader('Ronda de 32')
        resolved.r32WithTeams.forEach(({ match, homeTeam, awayTeam }) => {
          const pred = resolved.predMap.get(match?.id)
          if (pred) printMatch(getTeam(pred,'home',homeTeam), getTeam(pred,'away',awayTeam), pred)
        })

        // OCTAVOS
        printStageHeader('Octavos de Final')
        resolved.r16WithTeams.forEach(({ match, homeTeam, awayTeam }) => {
          const pred = resolved.predMap.get(match?.id)
          if (pred) printMatch(getTeam(pred,'home',homeTeam), getTeam(pred,'away',awayTeam), pred)
        })

        // CUARTOS
        printStageHeader('Cuartos de Final')
        resolved.qfWithTeams.forEach(({ match, homeTeam, awayTeam }) => {
          const pred = resolved.predMap.get(match?.id)
          if (pred) printMatch(getTeam(pred,'home',homeTeam), getTeam(pred,'away',awayTeam), pred)
        })

        // SEMIS
        printStageHeader('Semifinales')
        resolved.sfWithTeams.forEach(({ match, homeTeam, awayTeam }) => {
          const pred = resolved.predMap.get(match?.id)
          if (pred) printMatch(getTeam(pred,'home',homeTeam), getTeam(pred,'away',awayTeam), pred)
        })

        // TERCER LUGAR
        if (resolved.tpMatch) {
          const pred = resolved.predMap.get(resolved.tpMatch.id)
          if (pred) {
            printStageHeader('Tercer Lugar')
            printMatch(getTeam(pred,'home',resolved.tpHome), getTeam(pred,'away',resolved.tpAway), pred)
          }
        }

        // FINAL
        if (resolved.finalMatch) {
          const pred = resolved.predMap.get(resolved.finalMatch.id)
          if (pred) {
            printStageHeader('Final')
            printMatch(getTeam(pred,'home',resolved.finalHome), getTeam(pred,'away',resolved.finalAway), pred)
          }
        }
      }

      const filename = userId === 'all'
        ? `polla-mundial-backup-${new Date().toISOString().split('T')[0]}.pdf`
        : `polla-${users.find(u => u.id === userId)?.username}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(filename)
    } catch (e) {
      console.error(e)
      alert('Error generando PDF')
    }
    setGenerating(null)
  }

  if (loading) return <div className="text-gray-500 text-center py-8">Cargando...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white">📄 Backup de Pronósticos</h1>
        <p className="text-gray-500 text-sm mt-1">PDF con todos los pronósticos incluyendo equipos calculados</p>
      </div>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Usuarios', value: users.length, color: 'text-green-600' },
            { label: 'Partidos', value: matches.length, color: 'text-blue-600' },
            { label: 'Pronósticos', value: allPredictions.length, color: 'text-purple-600' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        <button onClick={() => generatePDF('all')} disabled={!!generating}
          className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-black rounded-2xl disabled:opacity-50 transition-all active:scale-95">
          {generating === 'all' ? '⏳ Generando PDF...' : '📥 Descargar PDF — Todos los usuarios'}
        </button>
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Exportar por usuario:</p>
          <div className="grid grid-cols-2 gap-2">
            {users.map(user => {
              const count = allPredictions.filter(p => p.user_id === user.id).length
              return (
                <button key={user.id} onClick={() => generatePDF(user.id)} disabled={!!generating}
                  className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-500/10 border border-gray-200 dark:border-gray-700 hover:border-green-300 rounded-xl transition-all disabled:opacity-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.display_name || user.username}</span>
                    {user.is_spectator && <span className="text-xs text-orange-500">👀</span>}
                  </div>
                  <span className={`text-xs flex-shrink-0 ml-2 px-2 py-0.5 rounded-full ${count > 0 ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                    {generating === user.id ? '⏳' : count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
