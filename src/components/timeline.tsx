import { Check } from 'lucide-react'
import type { Stage } from '@/lib/types'

interface TimelineProps {
  stages: Stage[]
}

export function Timeline({ stages }: TimelineProps) {
  const currentIndex = stages.findIndex(s => !s.is_completed)
  const firstIncomplete = currentIndex >= 0 ? currentIndex : stages.length - 1

  return (
    <div className="space-y-0">
      {stages.map((stage, idx) => {
        const isCompleted = stage.is_completed
        const isCurrent = idx === firstIncomplete
        const isPast = idx < firstIncomplete

        return (
          <div key={stage.id} className="flex gap-3">
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
              <p className={`text-sm font-medium ${isCurrent ? 'text-on-surface font-bold' : 'text-on-surface-variant'}`}>
                {stage.name}
              </p>
              {stage.completed_at && (
                <p className="text-[10px] text-outline mt-0.5">
                  {new Date(stage.completed_at).toLocaleDateString('pt-BR')}
                </p>
              )}
              {isCurrent && !isCompleted && (
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">Em andamento</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}