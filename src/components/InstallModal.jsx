import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XIcon, SmartphoneIcon, QrCodeIcon } from 'lucide-react'

export function InstallModal({ isOpen, onClose }) {
  // Close on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
            }}
            className="relative w-full max-w-md bg-white shadow-2xl overflow-hidden border border-neutral-200"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>

            <div className="p-8">
              <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center mb-6">
                <SmartphoneIcon className="w-6 h-6" />
              </div>

              <h2 className="text-2xl font-display font-bold mb-2">
                Get RawFoto
              </h2>
              <p className="text-neutral-500 mb-8">
                Scan the QR code to download the app, or choose your platform
                below. Free forever.
              </p>

              <div className="flex justify-center mb-8">
                <div className="p-4 border border-neutral-200 bg-neutral-50">
                  <QrCodeIcon
                    className="w-32 h-32 text-neutral-900"
                    strokeWidth={1}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-neutral-900 text-white py-3 px-4 font-medium hover:bg-neutral-800 transition-colors">
                  Download for iOS
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-white text-neutral-900 border border-neutral-200 py-3 px-4 font-medium hover:bg-neutral-50 transition-colors">
                  Download for Android
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
