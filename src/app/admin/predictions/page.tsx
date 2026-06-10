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

export default function AdminPredictionsPage() {
  const [users, setUsers] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [allPredictions, setAllPredictions] = useState<any[]>([])
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const supabase = createClient()
    const [{ data: profiles }, { data: matchData }, { data: predData }, { data: teamData }] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, is_spectator').order('display_name'),
      supabase.from('matches').select('*, home_team:teams!home_team_id(*), away_team:teams!away_team_id(*), stage:stages(type, name)').order('match_number'),
      supabase.from('predictions').select('*, pred_home_team:teams!home_team_id(id, short_name, name, flag_url), pred_away_team:teams!away_team_id(id, short_name, name, flag_url)').order('created_at').limit(5000),
      supabase.from('teams').select('*'),
    ])
    setUsers(profiles ?? [])
    setMatches(matchData ?? [])
    setAllPredictions(predData ?? [])
    setAllTeams(teamData ?? [])
    setLoading(false)
  }

  const getTeamById = (id: string) => allTeams.find(t => t.id === id)

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

        // Header usuario
        doc.setFillColor(22, 163, 74)
        doc.rect(margin - 2, y - 6, pageW - (margin - 2) * 2, 13, 'F')
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255)
        doc.text((user.display_name || user.username).toUpperCase(), margin + 2, y + 3)
        doc.setFontSize(9)
        doc.text(`${userPreds.length} pronosticos`, pageW - margin - 2, y + 3, { align: 'right' })
        y += 14

        const printMatch = (homeTeam: any, awayTeam: any, pred: any) => {
          if (!pred) return
          checkPage(7)
          const homeName = homeTeam?.short_name || homeTeam?.name || 'TBD'
          const awayName = awayTeam?.short_name || awayTeam?.name || 'TBD'
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

        for (const stage of STAGES) {
          const stageMatches = matches.filter(m => m.stage?.type === stage.type)
          const stagePreds = userPreds.filter(p => stageMatches.find(m => m.id === p.match_id))
          if (stagePreds.length === 0) continue

          printStageHeader(stage.label)

          if (stage.type === 'group') {
            GROUPS.forEach(group => {
              const gm = stageMatches.filter(m => m.group_name === group)
              const gPreds = stagePreds.filter(p => gm.find(m => m.id === p.match_id))
              if (gPreds.length === 0) return
              checkPage(8); y += 2
              doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74)
              doc.text(`Grupo ${group}`, margin + 3, y); y += 5
              gm.forEach(match => {
                const pred = stagePreds.find(p => p.match_id === match.id)
                if (pred) printMatch(match.home_team, match.away_team, pred)
              })
            })
          } else {
            stageMatches.forEach(match => {
              const pred = stagePreds.find(p => p.match_id === match.id)
              if (!pred) return
              // Usar equipos guardados en predicción primero
              const homeTeam = pred.pred_home_team?.short_name && pred.pred_home_team.short_name !== 'TBD'
                ? pred.pred_home_team
                : match.home_team
              const awayTeam = pred.pred_away_team?.short_name && pred.pred_away_team.short_name !== 'TBD'
                ? pred.pred_away_team
                : match.away_team
              printMatch(homeTeam, awayTeam, pred)
            })
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
