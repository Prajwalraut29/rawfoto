import React from 'react'
import { motion } from 'framer-motion'
import {
  Camera,
  Code2,
  Cpu,
  Globe,
  Image,
  Layout,
  Palette,
  Smartphone,
  Zap,
} from 'lucide-react'

const sections = [
  {
    id: 'overview',
    icon: Camera,
    title: 'Overview',
    content:
      'RawFoto is a progressive web application (PWA) that turns your browser into a professional-grade RAW camera. Built entirely with modern web technologies, it leverages the MediaDevices API to access your device camera, applies real-time filters and overlays, and captures uncompressed PNG images with full manual control over ISO, shutter speed, exposure compensation, white balance, and focus — just like a DSLR.',
  },
  {
    id: 'tech-stack',
    icon: Cpu,
    title: 'Technology Stack',
    items: [
      { label: 'Framework', value: 'React 19 with Vite 8' },
      { label: 'State Management', value: 'Redux Toolkit' },
      { label: 'Styling', value: 'Tailwind CSS 4' },
      { label: 'Animations', value: 'Framer Motion' },
      { label: 'Icons', value: 'Lucide React' },
      { label: 'Storage', value: 'IndexedDB + localStorage' },
      { label: 'Build Tool', value: 'Vite 8 with HMR' },
      { label: 'PWA', value: 'Service Worker + Web Manifest' },
    ],
  },
  {
    id: 'camera-api',
    icon: Globe,
    title: 'Camera API (WebRTC)',
    content:
      'RawFoto uses the navigator.mediaDevices.getUserMedia() API to access the device camera. This is part of the WebRTC specification and is supported on all modern browsers (Chrome, Firefox, Safari, Edge). The app requests a video stream with ideal resolution constraints and displays it in a <video> element. Real-time CSS filters simulate EV brightness adjustments, manual focus blur, and white balance temperature tints directly on the live preview — no WebGL or shader required.',
    code: `const constraints = {
  video: {
    facingMode: { ideal: 'environment' },
    width: { ideal: 1920, max: 4096 },
    height: { ideal: 1080, max: 2160 },
  },
  audio: false,
}

const stream = await navigator.mediaDevices
  .getUserMedia(constraints)
videoRef.current.srcObject = stream`,
  },
  {
    id: 'capture',
    icon: Image,
    title: 'Image Capture Pipeline',
    content:
      'When the shutter button is pressed, RawFoto draws the current video frame onto an offscreen <canvas> element at full native resolution. The canvas is cropped to the selected aspect ratio (3:4 or 16:9) and mirrored for front-facing cameras. The result is exported as a lossless PNG blob via canvas.toDataURL(), then stored in IndexedDB for persistent offline access. Photo metadata (ISO, shutter speed, EV, Kelvin, dimensions) is saved alongside in localStorage via Redux.',
  },
  {
    id: 'architecture',
    icon: Layout,
    title: 'App Architecture',
    content:
      'The app follows a simple component-based architecture with Redux for global state. The root App.jsx switches between the LandingPage (marketing site) and CameraView (camera UI) based on a view state variable. The camera view contains the video viewfinder, overlay controls (grid, level, focus reticle, histogram), and a bottom drawer for adjusting exposure, focus, and white balance parameters. Photos are managed through a gallery slice in Redux, with actual image blobs stored in IndexedDB.',
  },
  {
    id: 'features',
    icon: Zap,
    title: 'Key Features',
    items: [
      'Full manual camera controls (ISO, shutter, EV, WB, focus)',
      'Live RGB histogram overlay',
      'Rule-of-thirds composition grid',
      'Gyroscope-based level indicator',
      'Tap-to-focus with animated reticle',
      'Front/rear camera toggle',
      'Aspect ratio switching (3:4 / 16:9)',
      'Simulated flash and shutter sound',
      'In-app gallery with download and delete',
      'PWA installable with offline support',
      'Tutorial overlay for first-time users',
      'Responsive design for mobile and desktop',
    ],
  },
  {
    id: 'pwa',
    icon: Smartphone,
    title: 'Progressive Web App',
    content:
      'RawFoto is fully installable as a PWA. The app registers a service worker (/sw.js) that caches assets for offline access. A web manifest provides metadata for the home screen installation experience. The app listens for the beforeinstallprompt event to trigger the native install prompt, and detects standalone mode to adjust the UI accordingly. This means RawFoto works offline and feels like a native app once installed.',
  },
  {
    id: 'styling',
    icon: Palette,
    title: 'Design System',
    content:
      'The UI uses a dual-theme approach: a light, minimalist landing page with white backgrounds and neutral-900 text, and a dark, immersive camera interface with black backgrounds and yellow-accented controls. Typography uses Inter for body text and Outfit for display headings. All icons come from Lucide React. Animations are handled by Framer Motion with spring physics for natural-feeling interactions.',
  },
]

export function Documentation() {
  return (
    <section id="documentation" className="py-24 px-6 bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16">
          <div className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase mb-6">
            Documentation
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            How RawFoto was built.
          </h2>
          <p className="text-lg text-neutral-500 max-w-2xl">
            A deep dive into the architecture, APIs, and design decisions behind this browser-based RAW camera.
          </p>
        </div>

        <div className="space-y-12">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="bg-white border border-neutral-200 p-8 md:p-10"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 flex items-center justify-center border border-neutral-200 text-neutral-900 shrink-0">
                  <section.icon className="w-5 h-5" />
                </div>
                <h3 className="text-2xl font-display font-bold">{section.title}</h3>
              </div>

              {section.content && (
                <p className="text-neutral-600 leading-relaxed mb-4">{section.content}</p>
              )}

              {section.items && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {section.items.map((item, i) => (
                    typeof item === 'string' ? (
                      <div key={i} className="flex items-center gap-3 text-sm text-neutral-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ) : (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                        <span className="text-sm font-medium text-neutral-900">{item.label}</span>
                        <span className="text-sm text-neutral-500 font-mono">{item.value}</span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {section.code && (
                <pre className="bg-neutral-900 text-neutral-100 p-4 md:p-6 overflow-x-auto text-sm font-mono leading-relaxed mt-4">
                  <code>{section.code}</code>
                </pre>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
