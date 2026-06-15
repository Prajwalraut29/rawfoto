import React from 'react'
import { motion } from 'framer-motion'
import {
  SlidersHorizontalIcon,
  ImageIcon,
  GridIcon,
  ActivityIcon,
  Wand2Icon,
  CloudIcon,
} from 'lucide-react'

const features = [
  {
    icon: <SlidersHorizontalIcon className="w-5 h-5" />,
    title: 'Full Manual Controls',
    description: 'Take charge of ISO, shutter speed, and white balance.',
  },
  {
    icon: <ImageIcon className="w-5 h-5" />,
    title: 'Uncompressed RAW',
    description: 'Capture every detail with zero compression artifacts.',
  },
  {
    icon: <GridIcon className="w-5 h-5" />,
    title: 'Composition Grids',
    description: 'Rule of thirds, golden ratio, and level indicators.',
  },
  {
    icon: <ActivityIcon className="w-5 h-5" />,
    title: 'Live Histogram',
    description: 'Perfect your exposure in real-time before you shoot.',
  },
  {
    icon: <Wand2Icon className="w-5 h-5" />,
    title: 'Pro Presets',
    description: 'Apply film-grade color profiles directly in-camera.',
  },
  {
    icon: <CloudIcon className="w-5 h-5" />,
    title: 'Cloud Sync',
    description: 'Auto-backup your heavy RAW files securely.',
  },
]

const containerVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
}

export function Features() {
  return (
    <section
      id="features"
      className="py-24 px-6 bg-white border-t border-neutral-200"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-4xl md:text-5xl font-display font-bold tracking-tight mb-4">
            Built for shooters, designed for control.
          </h2>
          <p className="text-lg text-neutral-500">
            Everything you need to capture the perfect shot, without the
            clutter.
          </p>
        </div>

        {/* 2x3 Grid with 1px inner borders via gap and background */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            margin: '-100px',
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-neutral-200 border border-neutral-200"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-white p-10 flex flex-col h-full"
            >
              <div className="w-10 h-10 flex items-center justify-center border border-neutral-200 mb-8 text-neutral-900">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
