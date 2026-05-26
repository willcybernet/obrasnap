'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface LightboxProps {
  src: string | null
  alt?: string
  isOpen: boolean
  onClose: () => void
}

export function Lightbox({ src, alt = 'Visualização ampliada', isOpen, onClose }: LightboxProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Prevent body scrolling when lightbox is open
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !src) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-300 animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] rounded-full bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/75 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Fechar"
      >
        <X className="h-6 w-6" />
      </button>

      <div
        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-lg animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain select-none shadow-2xl"
        />
        {alt && alt !== 'Visualização ampliada' && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p className="text-white text-sm font-medium">{alt}</p>
          </div>
        )}
      </div>
    </div>
  )
}
