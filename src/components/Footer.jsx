import React from 'react'

export function Footer() {
  return (
    <footer className="bg-white border-t border-neutral-200 py-12 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-neutral-900" />
          <span className="font-display font-bold text-lg tracking-tight">
            RawFoto
          </span>
        </div>

        <div className="flex gap-8 text-sm text-neutral-500">
          <a href="https://prajwalr.space/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">
            Portfolio
          </a>
          <a href="https://www.linkedin.com/in/prajwal-raut29/" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">
            LinkedIn
          </a>
          <a href="https://x.com/prajwal29Raut" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">
            Twitter
          </a>
        </div>
      </div>
    </footer>
  )
}
