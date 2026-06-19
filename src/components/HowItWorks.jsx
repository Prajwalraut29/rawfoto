import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRightIcon } from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Dial in your settings',
    description:
      'Adjust ISO, shutter speed, and focus manually or let the smart auto mode handle the basics while you compose.',
  },
  {
    number: '02',
    title: 'Frame with precision',
    description:
      'Use the built-in composition grids, leveler, and live histogram to ensure perfect exposure and framing.',
  },
  {
    number: '03',
    title: 'Capture in RAW',
    description:
      'Shoot uncompressed DNG files. Maximum detail, maximum dynamic range, ready for professional editing.',
  },
]

export function HowItWorks({ onOpenInstall }) {
  return (
    <section
      id="how-it-works"
      className="py-32 px-6 bg-white border-t border-neutral-200"
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-8">
          <div className="lg:col-span-5 lg:sticky lg:top-32 self-start">
            <div className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase mb-6">
              How it works
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-8 leading-[1.1]">
              From viewfinder to RAW in three steps.
            </h2>
            <button
              onClick={onOpenInstall}
              className="group inline-flex items-center gap-2 text-sm font-bold border-b-2 border-neutral-900 pb-1 hover:text-neutral-600 hover:border-neutral-600 transition-colors"
            >
              Try it now
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="lg:col-span-7 lg:col-start-6">
            <div className="flex flex-col">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                    margin: '-100px',
                  }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                  }}
                  className={`py-12 flex gap-8 ${index !== 0 ? 'border-t border-neutral-200' : ''}`}
                >
                  <div className="text-3xl md:text-4xl font-display font-black text-neutral-200">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-neutral-500 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
