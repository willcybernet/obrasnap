'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Trash2, Mail, Phone, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'
import { getClients, createClientDb, deleteClientDb } from '@/lib/db'
import type { Client } from '@/lib/types'

interface ClientWithProjectsCount extends Client {
  projects: { id: string; is_active: boolean }[]
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientWithProjectsCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [modalSaving, setModalSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  const fetchClientsList = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      const data = await getClients(user.id)
      setClients(data as ClientWithProjectsCount[])
    } catch (err: any) {
      console.error('Erro ao carregar clientes:', err)
      setError(err.message || 'Erro ao carregar lista de clientes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientsList()
  }, [])

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      setModalSaving(true)
      setModalError('')

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await createClientDb(user.id, {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      })

      // Reset & Refresh
      setName('')
      setEmail('')
      setPhone('')
      setIsModalOpen(false)
      await fetchClientsList()
    } catch (err: any) {
      console.error('Erro ao cadastrar cliente:', err)
      setModalError(err.message || 'Erro ao cadastrar cliente. Tente novamente.')
    } finally {
      setModalSaving(false)
    }
  }

  const handleDeleteClient = async (id: string, name: string) => {
    const hasProjects = clients.find(c => c.id === id)?.projects.length || 0
    let confirmMsg = `Deseja realmente excluir o cliente "${name}"?`
    if (hasProjects > 0) {
      confirmMsg = `O cliente "${name}" possui ${hasProjects} projeto(s) associado(s). Ao excluí-lo, os projetos ficarão órfãos de cliente. Deseja prosseguir com a exclusão?`
    }

    if (!confirm(confirmMsg)) return

    try {
      await deleteClientDb(id)
      await fetchClientsList()
    } catch (err: any) {
      console.error('Erro ao excluir cliente:', err)
      alert(err.message || 'Erro ao excluir cliente.')
    }
  }

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term))
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse font-headline text-xl text-on-surface-variant">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <>
      <section className="mb-8 lg:mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-outline hidden md:block">ObraSnap • Clientes</span>
            <h2 className="font-headline text-3xl lg:text-6xl tracking-tighter text-on-background font-medium">Clientes</h2>
            <p className="font-body text-base lg:text-lg text-on-surface-variant mt-1">
              Gerencie seus clientes e os vincule às obras correspondentes.
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground py-3 px-5 rounded-md font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-all self-start md:self-auto"
          >
            <Plus className="w-[18px] h-[18px]" />
            Novo Cliente
          </Button>
        </div>
      </section>

      {error && (
        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-8 max-w-md bg-surface-container rounded-full px-4 py-2 border border-outline-variant/10 flex items-center">
        <Search className="text-outline w-5 h-5 shrink-0" />
        <input 
          className="bg-transparent border-none focus:ring-0 text-sm font-body w-full placeholder:text-outline-variant ml-2 outline-none" 
          placeholder="Buscar por nome, e-mail ou telefone..." 
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredClients.length === 0 ? (
        <section className="flex flex-col items-center justify-center py-16 lg:py-24 bg-surface-container-low rounded-2xl border border-outline-variant/10">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-outline" />
          </div>
          <h3 className="font-headline text-xl font-bold text-on-background mb-2">Nenhum cliente encontrado</h3>
          <p className="text-on-surface-variant text-center max-w-sm mb-6 text-sm">
            {searchTerm ? 'Nenhum resultado corresponde à sua busca. Experimente outros termos.' : 'Crie seu primeiro cliente para vinculá-lo aos seus projetos de obra.'}
          </p>
          {!searchTerm && (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary text-primary-foreground py-3 px-5 rounded-md font-bold text-[12px] tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Cliente
            </Button>
          )}
        </section>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map((client, idx) => {
            const activeProjectsCount = client.projects.filter(p => p.is_active).length
            const archivedProjectsCount = client.projects.filter(p => !p.is_active).length
            const initial = client.name.charAt(0).toUpperCase()
            
            return (
              <div 
                key={client.id}
                className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex flex-col justify-between hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-headline text-lg font-bold flex items-center justify-center shrink-0">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-headline text-lg font-bold tracking-tight truncate text-on-background">{client.name}</h3>
                      <p className="text-[10px] uppercase tracking-widest font-label text-outline mt-0.5">Cliente</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteClient(client.id, client.name)}
                    className="text-outline hover:text-error transition-colors p-1.5 rounded-lg hover:bg-error-container/20"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 py-4 border-y border-surface-container/60 text-sm text-on-surface-variant">
                  {client.email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-outline shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-outline/50 italic">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>Sem e-mail cadastrado</span>
                    </div>
                  )}

                  {client.phone ? (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-outline shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-outline/50 italic">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>Sem telefone cadastrado</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 flex items-center gap-4 text-xs font-label">
                  <div>
                    <span className="text-outline uppercase tracking-wider text-[10px] block">Obras Ativas</span>
                    <span className="font-headline text-lg font-bold text-on-background">{activeProjectsCount}</span>
                  </div>
                  <div className="border-l border-surface-container/60 pl-4">
                    <span className="text-outline uppercase tracking-wider text-[10px] block">Arquivadas</span>
                    <span className="font-headline text-lg font-bold text-on-background">{archivedProjectsCount}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Modal - Novo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
          <div className="bg-background rounded-2xl w-full max-w-md p-6 lg:p-8 border border-outline-variant/10 shadow-lift flex flex-col relative animate-fade-in-up">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-outline hover:text-on-background transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h3 className="font-headline text-xl lg:text-2xl font-bold tracking-tight text-on-background">Novo Cliente</h3>
              <p className="text-xs text-on-surface-variant mt-1">Preencha as informações do cliente para cadastrá-lo.</p>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              {modalError && (
                <div className="p-3 bg-error-container text-on-error-container rounded-lg text-xs">
                  {modalError}
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="modal-name" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                  Nome Completo *
                </label>
                <Input
                  id="modal-name"
                  placeholder="Nome do cliente"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 bg-surface-container border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-email" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                  E-mail
                </label>
                <Input
                  id="modal-email"
                  type="email"
                  placeholder="cliente@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-surface-container border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-phone" className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                  Telefone
                </label>
                <Input
                  id="modal-phone"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11 bg-surface-container border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="secondary"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-11 font-bold tracking-widest uppercase text-[10px]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={modalSaving}
                  className="flex-1 h-11 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-[10px]"
                >
                  {modalSaving ? 'Salvando...' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
