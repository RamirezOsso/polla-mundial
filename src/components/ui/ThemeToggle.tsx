'use client'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-xl border border-gray-700 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
      title="Cambiar tema"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
