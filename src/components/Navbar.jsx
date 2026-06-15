import React from 'react'
import { motion } from 'framer-motion'

export function Navbar({ onOpenInstall }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
      })
    }
  }
  return (
    <>
      {/* Top accent bar */}
      <div className="h-1 w-full bg-neutral-900" />

      <motion.nav
        initial={{
          y: -20,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 0.5,
        }}
        className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-neutral-200"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: 'smooth',
              })
            }
          >
            <div className="w-6 h-6 bg-neutral-900" />
            <span className="font-display font-bold text-xl tracking-tight">
              RawFoto
            </span>
          </div>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              How it works
            </button>
          </div>

          {/* CTA */}
          <div>
            <button
              onClick={onOpenInstall}
              className="bg-neutral-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Install App
            </button>
          </div>
        </div>
      </motion.nav>
    </>
  )
}
