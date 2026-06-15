import React, { useState, useEffect } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { store } from './store/store'
import { LandingPage } from './pages/LandingPage'
import { CameraView } from './components/CameraView'
import { GalleryView } from './components/GalleryView'
import { setInstallable, setInstalled } from './store/slices/pwaSlice'

function AppContent() {
  const dispatch = useDispatch()
  const [view, setView] = useState('landing') // 'landing' | 'camera'
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  // 1. PWA installation triggers and Listeners
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent default mini-infobar on mobile
      e.preventDefault()
      // Store event on window object for triggering later
      window.deferredPrompt = e
      // Notify Redux store that PWA can be installed
      dispatch(setInstallable(true))
    }

    const handleAppInstalled = () => {
      dispatch(setInstalled(true))
      window.deferredPrompt = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if app is already running in standalone (installed) mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      dispatch(setInstalled(true))
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [dispatch])

  // 2. Service Worker Registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((reg) => console.log('ServiceWorker registered with scope:', reg.scope))
          .catch((err) => console.warn('ServiceWorker registration failed:', err))
      })
    }
  }, [])

  return (
    <>
      {view === 'landing' ? (
        <LandingPage onStartCamera={() => setView('camera')} />
      ) : (
        <CameraView
          onBack={() => setView('landing')}
          onOpenGallery={() => setIsGalleryOpen(true)}
        />
      )}

      {/* Floating global Gallery Drawer */}
      <GalleryView isOpen={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
    </>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
