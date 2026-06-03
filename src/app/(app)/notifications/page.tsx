'use client'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'

const TYPE_ICON: Record<string, string> = {
  match_starting: '⚽',
  result_published: '📋',
  points_updated: '⭐',
  league_invite: '🏆',
  achievement: '🏅',
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(user?.id)
  const unread = notifications.filter(n => !n.is_read)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">🔔 Notificaciones</h1>
        {unread.length > 0 && (
          <button onClick={markAllAsRead} className="text-sm text-green-400 hover:text-green-300 transition-colors">
            ✅ Marcar todas leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🔔</p>
          <p className="text-gray-400">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <button key={n.id} onClick={() => !n.is_read && markAsRead(n.id)}
              className={cn('w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all',
                n.is_read ? 'bg-gray-900 border-gray-800 opacity-70' : 'bg-gray-800 border-gray-600 shadow-lg'
              )}>
              <span className="text-2xl flex-shrink-0">{TYPE_ICON[n.type] ?? '📢'}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">{n.title}</p>
                <p className="text-gray-400 text-sm mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {new Date(n.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              {!n.is_read && <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
