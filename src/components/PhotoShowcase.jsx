import React from 'react'
import { motion } from 'framer-motion'

const photos = [
  {
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    title: 'Portrait',
    settings: '85mm · f/1.4 · 1/500s · ISO 100',
  },
  {
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop',
    title: 'Landscape',
    settings: '16mm · f/8.0 · 1/125s · ISO 100',
  },
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
    title: 'Architecture',
    settings: '24mm · f/5.6 · 1/250s · ISO 200',
  },
  {
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800&auto=format&fit=crop',
    title: 'Low Light',
    settings: '35mm · f/1.8 · 1/60s · ISO 1600',
  },
]

export function PhotoShowcase() {
  return (
    <section className="py-24 px-6 bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-neutral-400 uppercase mb-4">
              Gallery
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">
              Shot on RawFoto.
            </h2>
          </div>
          <p className="text-neutral-500 max-w-sm text-sm">
            Unedited RAW files straight from the camera, showcasing dynamic
            range and detail.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                y: 20,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
              }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-200 mb-4 border border-neutral-200">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-sm">{photo.title}</h4>
                <span className="text-xs text-neutral-400 font-mono tracking-tight">
                  {photo.settings}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
