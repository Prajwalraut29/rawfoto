import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, SlidersHorizontal, Image as ImageIcon, Lightbulb, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react'

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to RawFoto',
    icon: Camera,
    description: 'Your browser-based RAW camera simulator. Capture photos with manual controls just like a DSLR — all from your device camera.',
    highlight: 'viewfinder',
  },
  {
    title: 'Camera Controls',
    icon: SlidersHorizontal,
    description: 'Swipe through Exposure (ISO/Shutter/EV), Focus Distance, and White Balance tabs below. Adjust each setting to see real-time preview changes.',
    highlight: 'controls',
  },
  {
    title: 'Capture & Gallery',
    icon: ImageIcon,
    description: 'Tap the big shutter button to capture. Your photos are saved in the in-app gallery — tap the thumbnail to view, download, or delete them.',
    highlight: 'shutter',
  },
  {
    title: 'Pro Tips',
    icon: Lightbulb,
    description: 'Use low ISO (100-400) for clean shots. Tap the viewfinder to set focus. Enable the grid and level for perfect composition. Experiment with white balance for creative looks!',
    highlight: 'tips',
  },
]

export function TutorialOverlay({ onDismiss }) {
  const [step, setStep] = useState(0)
  const current = TUTORIAL_STEPS[step]
  const isLast = step === TUTORIAL_STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      onDismiss()
    } else {
      setStep((s) => s + 1)
    }
  }

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm"
      >
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-white/70 text-xs font-medium hover:bg-white/20 hover:text-white transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Skip
        </button>

        <div className="absolute top-4 left-4 flex gap-2">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-yellow-400 w-6' : 'bg-white/30'}`}
            />
          ))}
        </div>

        <motion.div
          key={step}
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-neutral-900 border-t border-white/10 rounded-t-3xl px-6 pt-8 pb-10 max-w-lg mx-auto w-full"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center shrink-0">
              <current.icon className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-display">{current.title}</h2>
              <p className="text-xs text-neutral-500">
                Step {step + 1} of {TUTORIAL_STEPS.length}
              </p>
            </div>
          </div>

          <p className="text-sm text-neutral-300 leading-relaxed mb-6">{current.description}</p>

          
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 disabled:opacity-30 hover:text-white transition-colors disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-yellow-500 text-black text-sm font-bold hover:bg-yellow-400 transition-colors"
            >
              {isLast ? 'Get Started' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
