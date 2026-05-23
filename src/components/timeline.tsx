'use client'

import { Check } from 'lucide-react'
import type { Stage } from '@/lib/types'

interface TimelineProps {
  stages: Stage[]
  onToggleComplete?: (stageId: string) => Promise<void>
}

export function Timeline({ stages, onToggleComplete }: TimelineProps) {
  return (
    <div className="space-y-2">
      {stages.map((stage) => (
        <button
          key={stage.id}
          type="button"
          onClick={() => onToggleComplete?.(stage.id)}
          disabled={!onToggleComplete}
          className="w-full flex items-center gap-3 rounded-lg bg-surface-container-highest/60 px-3 py-3 text-left transition-colors hover:bg-surface-container-highest disabled:cursor-default disabled:hover:bg-surface-container-highest/60"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
              stage.is_completed
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-outline bg-surface-container-lowest'
            }`}
          >
            {stage.is_completed && <Check className="h-3.5 w-3.5" />}
          </span>
          <span
            className={`text-sm font-medium ${
              stage.is_completed ? 'text-on-surface line-through opacity-70' : 'text-on-surface'
            }`}
          >
            {stage.name}
          </span>
        </button>
      ))}
    </div>
  )
}
