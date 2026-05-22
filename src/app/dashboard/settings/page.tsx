'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Upload, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase'

const colorOptions = [
  { name: 'Cinza', value: '#5f5e5e' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Amarelo', value: '#f59e0b' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Turquesa', value: '#14b8a6' },
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [officeName, setOfficeName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#5f5e5e')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmail(user.email || '')
        setName(user.user_metadata?.name || '')
        
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (userData) {
          setOfficeName(userData.office_name || '')
          setPrimaryColor(userData.primary_color || '#5f5e5e')
          setLogoUrl(userData.logo_url)
        }
      }
      setLoading(false)
    }

    fetchUser()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: email,
        name: name,
        office_name: officeName,
        primary_color: primaryColor,
        logo_url: logoUrl,
      }, { onConflict: 'id' })

    if (!error) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    
    setSaving(false)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const fileName = `logos/${user.id}/${Date.now()}-${file.name}`
    
    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, file)

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(fileName)
      
      setLogoUrl(publicUrl)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse font-headline text-xl">Carregando...</div>
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
          <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Configurações</span>
          <h2 className="font-headline text-3xl lg:text-5xl font-medium tracking-tighter text-on-background mt-2">
            Perfil do Escritório
          </h2>
          <p className="font-body text-base lg:text-lg text-on-surface-variant mt-2 lg:mt-4">
            Personalize a appearance da sua empresa na plataforma.
          </p>
        </div>

        <div className="space-y-8 lg:space-y-10">
          {success && (
            <div className="p-4 bg-success/20 text-success rounded-lg text-sm font-medium">
              Configurações salvas com sucesso!
            </div>
          )}

          <section className="space-y-4 lg:space-y-6">
            <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Logo</h3>
            
            <div className="flex items-center gap-6">
              <div className="w-24 lg:w-32 h-24 lg:h-32 rounded-xl bg-surface-container-low flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-16 lg:w-20 h-16 lg:h-20 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-2xl lg:text-3xl font-bold">
                      {officeName.charAt(0).toUpperCase() || 'E'}
                    </span>
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm font-medium">Alterar Logo</span>
                </span>
              </label>
            </div>
          </section>

          <section className="space-y-4 lg:space-y-6">
            <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Informações</h3>
            
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Seu Nome
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Nome do Escritório
              </label>
              <Input
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="Nome da sua empresa"
                className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant focus:border-primary rounded-t-lg"
              />
            </div>

            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-widest text-outline ml-1">
                Email
              </label>
              <Input
                value={email}
                disabled
                className="h-12 lg:h-14 bg-surface-container-low border-none border-b-2 border-outline-variant opacity-60"
              />
            </div>
          </section>

          <section className="space-y-4 lg:space-y-6">
            <h3 className="font-headline text-lg lg:text-xl font-bold text-on-surface">Cor de Destaque</h3>
            
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setPrimaryColor(color.value)}
                  className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full transition-all ${
                    primaryColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-primary scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>

            <div className="p-4 bg-surface-container-low rounded-xl">
              <span className="font-label text-[10px] uppercase tracking-widest text-outline block mb-2">Preview</span>
              <div 
                className="px-4 py-2 rounded-lg text-white font-bold text-sm"
                style={{ backgroundColor: primaryColor }}
              >
                Casa Silva - 75% concluído
              </div>
            </div>
          </section>

          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 lg:h-14 bg-primary text-primary-foreground font-bold tracking-widest uppercase text-[12px]"
          >
            {saving ? (
              'Salvando...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  )
}
