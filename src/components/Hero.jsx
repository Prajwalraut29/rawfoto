import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from 'lucide-react'

export function Hero({ onOpenInstall }) {
  return (
    <section className="pt-20 pb-32 px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-8 items-center">
        {/* Left Content */}
        <motion.div
          initial={{
            opacity: 0,
            x: -20,
          }}
          animate={{
            opacity: 1,
            x: 0,
          }}
          transition={{
            duration: 0.6,
            delay: 0.1,
          }}
          className="max-w-xl"
        >
          <div className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase mb-8">
            Raw Photo Capture
          </div>

          <h1 className="text-6xl sm:text-7xl lg:text-[5.5rem] leading-[0.95] font-display font-black mb-8">
            <span className="block text-neutral-900">Shoot in RAW.</span>
            <span className="block text-neutral-300">Control every frame.</span>
          </h1>

          <p className="text-lg text-neutral-500 mb-10 leading-relaxed max-w-md">
            A minimalist camera system to capture uncompressed RAW photos,
            master your angles, and take full manual control over ISO, shutter
            speed, and focus.
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={onOpenInstall}
              className="group flex items-center gap-3 bg-neutral-900 text-white px-8 py-4 font-medium hover:bg-neutral-800 transition-colors"
            >
              Click Now
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <span className="text-sm text-neutral-400">
              Free. iOS & Android.
            </span>
          </div>
        </motion.div>

        {/* Right Content - Viewfinder Mockup */}
        <motion.div
          initial={{
            opacity: 0,
            y: 40,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
            delay: 0.2,
          }}
          className="relative mx-auto w-full max-w-[400px] aspect-[3/4] bg-neutral-100 border border-neutral-200 shadow-2xl overflow-hidden"
        >
          {/* Real Photo Background */}
          <img
            src="https://images.unsplash.com/photo-1551316679-9c6ae9dec224?q=80&w=1000&auto=format&fit=crop"
            alt="Moody street photography"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Viewfinder UI Overlay */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Rule of thirds grid */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-r border-b border-white/20" />
              <div className="border-b border-white/20" />
              <div className="border-r border-white/20" />
              <div className="border-r border-white/20" />
              <div className="" />
            </div>

            {/* Center Focus Box */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/50" />

            {/* Corner Brackets */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white" />
            <div className="absolute bottom-24 left-6 w-8 h-8 border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-24 right-6 w-8 h-8 border-b-2 border-r-2 border-white" />

            {/* Bottom Manual Controls Strip */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 text-white text-xs font-medium tracking-wider">
              <span>ISO 100</span>
              <span>1/250</span>
              <span>f/2.8</span>
              <span className="text-yellow-400">RAW</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
