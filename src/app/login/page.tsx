'use client'

import { useState } from 'react'
import Link from 'next/link'
import { HardHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    window.location.href = '/dashboard'
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-surface">
      <div className="w-full max-w-md space-y-12">
        <div className="text-center space-y-4">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center shadow-architectural">
              <HardHat className="w-8 h-8 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="font-headline text-4xl font-medium tracking-tighter">
            Bem-vindo de volta
          </h1>
          <p className="text-on-surface-variant text-lg">
            Acesse sua conta no ObraSnap
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Senha
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-[12px]" 
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="text-center">
          <span className="text-on-surface-variant">Não tem conta? </span>
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Criar conta
          </Link>
        </div>
      </div>
    </main>
  )
}
