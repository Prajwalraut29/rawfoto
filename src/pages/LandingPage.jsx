import React from 'react'
import { Navbar } from '../components/Navbar'
import { Hero } from '../components/Hero'
import { Features } from '../components/Features'
import { PhotoShowcase } from '../components/PhotoShowcase'
import { HowItWorks } from '../components/HowItWorks'
import { Documentation } from '../components/Documentation'
import { Footer } from '../components/Footer'
import { PwaInstallBanner } from '../components/PwaInstallBanner'

export function LandingPage({ onStartCamera }) {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      {/* Top sticky navbar */}
      <Navbar onOpenInstall={onStartCamera} />

      <main>
        {/* Pass onStartCamera to Hero so they can jump straight into the camera view */}
        <section className="relative">
          <Hero onOpenInstall={onStartCamera} />
          {/* Overlay badge to indicate browser demo is ready */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-mono font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow z-10 animate-pulse">
            Open and Click Now
          </div>
        </section>

        <Features />

        <PhotoShowcase />

        {/* Pass onStartCamera to HowItWorks so 'Try it now' launches the camera */}
        <HowItWorks onOpenInstall={onStartCamera} />

        <Documentation />
      </main>

      <Footer />

      {/* Auto sliding PWA install prompt banner */}
      <PwaInstallBanner />
    </div>
  )
}
