import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getRankBadge(rank: number | null) {
  if (!rank) return `?`
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export function getMatchStatusLabel(status: string) {
  switch (status) {
    case 'live': return '🔴 En vivo'
    case 'finished': return 'Finalizado'
    case 'cancelled': return 'Cancelado'
    default: return 'Programado'
  }
}
