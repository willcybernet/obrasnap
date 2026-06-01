'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'destructive' | 'warning' | 'default'
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
  variant = 'destructive'
}: ConfirmModalProps) {
  const [modalError, setModalError] = useState('')

  if (!isOpen) return null

  const handleConfirm = async () => {
    setModalError('')
    try {
      await onConfirm()
    } catch (err: any) {
      setModalError(err.message || 'Ocorreu um erro. Tente novamente.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fade-in">
      <div className="bg-background rounded-2xl w-full max-w-md p-6 lg:p-8 border border-outline-variant/10 shadow-lift flex flex-col relative animate-fade-in-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-on-background transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <h3 className="font-headline text-xl lg:text-2xl font-bold tracking-tight text-on-background">
            {title}
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            {description}
          </p>
        </div>

        {modalError && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-xs mb-4">
            {modalError}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <div className="flex gap-3 pt-4">
            <Button 
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 h-11 font-bold tracking-widest uppercase text-[10px]"
            >
              {cancelText}
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              onClick={handleConfirm}
              className={`flex-1 h-11 ${variant === 'destructive' ? 'bg-error text-error-foreground' : variant === 'warning' ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'} font-bold tracking-widest uppercase text-[10px]`}
            >
              {isLoading ? 'Processando...' : confirmText}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
