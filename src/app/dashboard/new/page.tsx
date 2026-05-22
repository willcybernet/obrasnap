'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { DEFAULT_STAGES } from '@/lib/types'

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [useTemplate, setUseTemplate] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        throw new Error('Erro de autenticação: ' + authError.message)
      }

      if (!user) {
        router.push('/login')
        return
      }

      console.log('Criando projeto para usuário:', user.id)

      const timestamp = Date.now().toString(36)
      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + timestamp

      console.log('Inserindo projeto:', { name, address, user_id: user.id, slug })

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          address,
          client_name: clientName || null,
          client_email: clientEmail || null,
          start_date: startDate || null,
          end_date: endDate || null,
          public_slug: slug,
        })
        .select()
        .single()

      if (projectError) {
        console.error('Erro ao criar projeto:', projectError)
        throw new Error(projectError.message)
      }

      console.log('Projeto criado com sucesso:', project)

      if (project && useTemplate) {
        const stagesData = DEFAULT_STAGES.map(stage => ({
          project_id: project.id,
          name: stage.name,
          order_index: stage.order,
          is_completed: false,
        }))

        const { error: stagesError } = await supabase.from('stages').insert(stagesData)
        
        if (stagesError) {
          console.error('Erro ao criar etapas:', stagesError)
          throw new Error('Projeto criado, mas erro ao adicionar etapas: ' + stagesError.message)
        }
        
        console.log('Etapas criadas com sucesso')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      console.error('Erro geral:', err)
      setError(err.message || 'Erro desconhecido ao criar projeto')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
        <h2 className="font-headline text-2xl lg:text-3xl font-bold text-on-background mb-2">Projeto criado com sucesso!</h2>
        <p className="text-on-surface-variant text-center max-w-md mb-6">Seu projeto já está disponível no dashboard. Redirecionando...</p>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 lg:mb-12">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-outline hover:text-on-surface transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-label text-[10px] uppercase tracking-widest">Voltar</span>
        </Link>
      </div>

      <div className="max-w-2xl">
        <div className="mb-8 lg:mb-12">
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Novo Projeto</span>
          <h2 className="font-headline text-3xl lg:text-5xl font-medium tracking-tighter text-on-background mt-2">
            Criar Projeto
          </h2>
          <p className="font-body text-base lg:text-lg text-on-surface-variant mt-2 lg:mt-4">
            Preencha as informações básicas do projeto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 lg:space-y-10">
          {error && (
            <div className="p-4 bg-error-container text-on-error-container rounded-lg text-sm">
              {error}
            </div>
          )}

          <section className="space-y-4 lg:space-y-6">
            <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Informações do Projeto</h3>
            
            <div className="space-y-2">
              <label htmlFor="name" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Nome do Projeto *
              </label>
              <Input
                id="name"
                placeholder="Casa Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Endereço da Obra *
              </label>
              <Input
                id="address"
                placeholder="Av. Paulista, 1000"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label htmlFor="startDate" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                  Início
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="endDate" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                  Previsão de Término
                </label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4 lg:space-y-6">
            <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Cliente</h3>
            
            <div className="space-y-2">
              <label htmlFor="clientName" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Nome do Cliente
              </label>
              <Input
                id="clientName"
                placeholder="João Silva"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="clientEmail" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Email do Cliente
              </label>
              <Input
                id="clientEmail"
                type="email"
                placeholder="joao@email.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>
          </section>

          <section className="space-y-4 lg:space-y-6">
            <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Etapas do Projeto</h3>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUseTemplate(true)}
                className={`flex-1 px-4 lg:px-6 py-3 rounded-lg font-bold text-[12px] tracking-widest uppercase transition-all ${
                  useTemplate
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Template
              </button>
              <button
                type="button"
                onClick={() => setUseTemplate(false)}
                className={`flex-1 px-4 lg:px-6 py-3 rounded-lg font-bold text-[12px] tracking-widest uppercase transition-all ${
                  !useTemplate
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                Personalizar
              </button>
            </div>

            {useTemplate && (
              <div className="space-y-2 lg:space-y-3">
                {DEFAULT_STAGES.map((stage, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 lg:p-4 rounded-xl bg-surface-container-low"
                  >
                    <span className="text-sm font-medium text-outline w-6">
                      {index + 1}.
                    </span>
                    <span className="text-sm font-medium text-on-surface">{stage.name}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="flex gap-3 lg:gap-4 pt-4 lg:pt-6">
            <Link href="/dashboard" className="flex-1">
              <Button variant="secondary" className="w-full h-12 lg:h-14 font-bold tracking-widest uppercase text-[12px]" type="button">
                Cancelar
              </Button>
            </Link>
            <Button 
              type="submit" 
              className="flex-1 h-12 lg:h-14 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-[12px]"
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
