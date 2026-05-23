'use client'

import { Check, CheckCircle } from 'lucide-react'
import type { Stage } from '@/lib/types'

interface TimelineProps {
  stages: Stage[]
  onToggleComplete?: (stageId: string) => Promise<void>
}

export function Timeline({ stages, onToggleComplete }: TimelineProps) {
  const currentIndex = stages.findIndex(s => !s.is_completed)
  const firstIncomplete = currentIndex >= 0 ? currentIndex : stages.length - 1

  return (
    <div className="space-y-0 transition-all duration-300">
      {stages.map((stage, idx) => {
        const isCompleted = stage.is_completed
        const isCurrent = idx === firstIncomplete
        const isPast = idx < firstIncomplete

        return (
          <div key={stage.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-success'
                    : isCurrent
                    ? 'bg-primary ring-2 ring-primary/30 animate-pulse'
                    : 'bg-surface-container-highest'
                }`}
              >
                {isCompleted && <Check className="w-3 h-3 text-white" />}
                {isCurrent && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {idx < stages.length - 1 && (
                <div
                  className={`w-0.5 h-6 lg:h-8 ${
                    isPast || isCompleted ? 'bg-success/40' : 'bg-surface-container-highest'
                  }`}
                />
              )}
            </div>
            <div className={`pb-5 lg:pb-6 ${isPast || isCompleted ? 'opacity-60' : ''}`}>
              {onToggleComplete ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={stage.is_completed}
                    className="rounded border border-outline-variant bg-surface-container-lowest text-primary"
                    disabled={isCompleted}
                  />
                  <span className="text-sm font-medium text-on-surface">
                    {stage.name}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2 mt-1">
                  <p className="text-sm font-medium {isCurrent ? 'text-on-surface font-bold' : 'text-on-surface-variant'}">
                    {stage.name}
                  </p>
                  {isCurrent && !isCompleted && (
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Em andamento</p>
                  )}
                  {stage.completed_at && (
                    <p className="text-[10px] text-outline mt-0.5">
                      Concluído: {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function Timeline({ stages, onUpdateDate }: TimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [savingDate, setSavingDate] = useState(false)
  const [localError, setLocalError] = useState('')

  const currentIndex = stages.findIndex(s => !s.is_completed)
  const firstIncomplete = currentIndex >= 0 ? currentIndex : stages.length - 1

  const handleStartEdit = (stage: Stage) => {
    setEditingId(stage.id)
    setEditStart(stage.start_date ? stage.start_date.slice(0, 10) : '')
    setEditEnd(stage.end_date ? stage.end_date.slice(0, 10) : '')
    setLocalError('')
  }

  const handleSave = async (stageId: string) => {
    if (!onUpdateDate) {
      setEditingId(null)
      return
    }
    setSavingDate(true)
    setLocalError('')
    try {
      await onUpdateDate(stageId, editStart || null, editEnd || null)
      setEditingId(null)
    } catch {
      setLocalError('Erro ao salvar')
    } finally {
      setSavingDate(false)
    }
  }

  const formatDate = (d: string | null) => {
    if (!d) return null
    const date = new Date(d + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-0">
      {stages.map((stage, idx) => {
        const isCompleted = stage.is_completed
        const isCurrent = idx === firstIncomplete
        const isPast = idx < firstIncomplete
        const isEditing = editingId === stage.id
        const startDate = formatDate(stage.start_date)
        const endDate = formatDate(stage.end_date)

        return (
          <div key={stage.id} className="flex gap-3 group">
            <div className="flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-success'
                    : isCurrent
                    ? 'bg-primary ring-2 ring-primary/30 animate-pulse'
                    : 'bg-surface-container-highest'
                }`}
              >
                {isCompleted && <Check className="w-3 h-3 text-white" />}
                {isCurrent && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              {idx < stages.length - 1 && (
                <div
                  className={`w-0.5 h-6 lg:h-8 ${
                    isPast || isCompleted ? 'bg-success/40' : 'bg-surface-container-highest'
                  }`}
                />
              )}
            </div>
            <div className={`pb-5 lg:pb-6 flex-1 min-w-0 ${isPast || isCompleted ? 'opacity-60' : ''}`}>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${isCurrent ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                  {stage.name}
                </p>
                {!isCompleted && onUpdateDate && (
                  <button
                    onClick={() => handleStartEdit(stage)}
                    className="opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Pencil className="w-3 h-3 text-outline hover:text-primary" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={editStart}
                      onChange={e => setEditStart(e.target.value)}
                      className="w-[130px] text-[11px] px-2 py-1 rounded border border-outline-variant bg-surface-container-lowest text-on-surface"
                      disabled={savingDate}
                    />
                    <span className="text-[10px] text-outline">→</span>
                    <input
                      type="date"
                      value={editEnd}
                      onChange={e => setEditEnd(e.target.value)}
                      className="w-[130px] text-[11px] px-2 py-1 rounded border border-outline-variant bg-surface-container-lowest text-on-surface"
                      disabled={savingDate}
                    />
                    <button
                      onClick={() => handleSave(stage.id)}
                      disabled={savingDate}
                      className="text-[11px] font-bold text-primary hover:text-primary-dim transition-colors disabled:opacity-50"
                    >
                      {savingDate ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-[11px] text-outline hover:text-on-surface transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                  {localError && <p className="text-[10px] text-danger">{localError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {(startDate || endDate) ? (
                    <p className="text-[10px] text-outline mt-0.5">
                      {startDate && endDate
                        ? `${startDate} → ${endDate}`
                        : startDate
                        ? `Início ${startDate}`
                        : `Término ${endDate}`}
                    </p>
                  ) : onUpdateDate && !isCompleted ? (
                    <button
                      onClick={() => handleStartEdit(stage)}
                      className="text-[10px] text-primary/60 hover:text-primary transition-colors mt-0.5"
                    >
                      + Definir datas
                    </button>
                  ) : null}
                  {stage.completed_at && (
                    <p className="text-[10px] text-outline mt-0.5">
                      {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  {isCurrent && !isCompleted && !startDate && !endDate && !onUpdateDate && (
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Em andamento</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
