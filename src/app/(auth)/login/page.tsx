'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'Admin2026$'
const ADMIN_EMAIL = 'brayanramirezosorio@gmail.com'
const ADMIN_SUPABASE_PASS = '12345678'

export default function LoginPage() {
  const [tab, setTab] = useState<'user' | 'admin'>('user')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showAdminPass, setShowAdminPass] = useState(false)
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    if (adminUser !== ADMIN_USER || adminPass !== ADMIN_PASS) {
      setError('Usuario o contraseña incorrectos')
      setLoading(false)
      return
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_SUPABASE_PASS,
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/admin')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{background:'#030712'}}>
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-gray-950 to-blue-900/20" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">⚽</div>
          <h1 className="text-3xl font-black gradient-text">Polla Mundial</h1>
          <p className="text-gray-400 mt-2">FIFA World Cup 2026</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex gap-1 p-1 bg-gray-800 rounded-xl mb-6">
            <button onClick={() => { setTab('user'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'user' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              👤 Participante
            </button>
            <button onClick={() => { setTab('admin'); setError('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'admin' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              ⚙️ Administrador
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-3 mb-4 text-sm">{error}</div>
          )}

          {tab === 'user' && (
            <form onSubmit={handleUserLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Contraseña</label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors">
                    {showPassword ? '🙈 Ocultar' : '👁️ Ver contraseña'}
                  </button>
                </div>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl disabled:opacity-50">
                {loading ? 'Entrando...' : 'Entrar →'}
              </button>
              <p className="text-center text-sm text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-green-400 hover:text-green-300 font-medium">Regístrate gratis</Link>
              </p>
            </form>
          )}

          {tab === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center mb-2">
                <p className="text-purple-300 text-xs">Acceso exclusivo para administradores</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-300">Usuario</label>
                <input type="text" value={adminUser} onChange={e => setAdminUser(e.target.value)}
                  placeholder="usuario admin" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-300">Contraseña</label>
                  <button type="button" onClick={() => setShowAdminPass(!showAdminPass)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors">
                    {showAdminPass ? '🙈 Ocultar' : '👁️ Ver contraseña'}
                  </button>
                </div>
                <input type={showAdminPass ? 'text' : 'password'} value={adminPass} onChange={e => setAdminPass(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded-xl disabled:opacity-50">
                {loading ? 'Entrando...' : '⚙️ Entrar como Admin'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
