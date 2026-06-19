import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { dismissBanner, setInstalled } from '../store/slices/pwaSlice'
import { SmartphoneIcon, XIcon, DownloadIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function PwaInstallBanner() {
  const dispatch = useDispatch()
  const { isInstallable, isInstalled, bannerDismissed } = useSelector((state) => state.pwa)

  const handleInstallClick = async () => {
    const promptEvent = window.deferredPrompt
    if (!promptEvent) return

    promptEvent.prompt()

    const { outcome } = await promptEvent.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    if (outcome === 'accepted') {
      dispatch(setInstalled(true))
    }

    window.deferredPrompt = null
  }

  const handleDismiss = () => {
    dispatch(dismissBanner())
  }

  const shouldShow = isInstallable && !isInstalled && !bannerDismissed

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-50 bg-neutral-900 border border-neutral-800 shadow-2xl p-5 rounded-lg flex gap-4"
        >
          <div className="w-12 h-12 rounded bg-yellow-500 text-black flex items-center justify-center shrink-0">
            <SmartphoneIcon className="w-6 h-6" />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-bold text-white leading-snug">
                Install RawFoto Pro
              </h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Add to your home screen for immersive, full-screen RAW camera controls and offline usage.
              </p>
            </div>
            
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 bg-yellow-500 text-black text-xs font-bold px-4 py-2 hover:bg-yellow-400 active:scale-95 transition-transform"
              >
                <DownloadIcon className="w-3.5 h-3.5" />
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="text-neutral-400 hover:text-white text-xs font-medium"
              >
                Maybe Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-300"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
