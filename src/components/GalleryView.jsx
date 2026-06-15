import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { deletePhoto, updatePhotoUrl } from '../store/slices/gallerySlice' // <-- you'll need updatePhotoUrl action
import { createUncompressedTiff } from '../utils/tiffWriter'
import { XIcon, DownloadIcon, Trash2Icon, InfoIcon, CalendarIcon, CameraIcon, Loader2Icon } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion'

/** Convert a blob URL to a permanent data URL (base64) */
const blobUrlToDataUrl = (blobUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // just in case
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      try {
        resolve(canvas.toDataURL('image/png'))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error('Failed to load image from blob URL'))
    img.src = blobUrl
  })
}

export function GalleryView({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const photos = useSelector((state) => state.gallery.items)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Stable data URLs for all photos (id → dataUrl)
  const [stableUrls, setStableUrls] = useState({})
  const [isConverting, setIsConverting] = useState(false)
  const conversionInProgress = useRef(false)

  // Whenever the photo list changes, convert any blob URLs
  useEffect(() => {
    if (!isOpen || photos.length === 0) return

    const convertAll = async () => {
      // Prevent overlapping conversions
      if (conversionInProgress.current) return
      conversionInProgress.current = true
      setIsConverting(true)

      const updates = {}
      const promises = photos.map(async (photo) => {
        // Only convert if the stored URL is a blob and we don't have a stable version yet
        if (photo.url && photo.url.startsWith('blob:') && !stableUrls[photo.id]) {
          try {
            const dataUrl = await blobUrlToDataUrl(photo.url)
            updates[photo.id] = dataUrl
            // Also update Redux so next time the data URL is already there
            dispatch(updatePhotoUrl({ id: photo.id, url: dataUrl }))
          } catch (e) {
            console.warn(`Could not convert blob for ${photo.id}`, e)
            // Keep the original (may be broken, but at least we show something)
            updates[photo.id] = photo.url
          }
        } else if (photo.url) {
          // Already a data URL or stable URL stored
          updates[photo.id] = photo.url
        }
      })

      await Promise.allSettled(promises)
      setStableUrls((prev) => ({ ...prev, ...updates }))
      setIsConverting(false)
      conversionInProgress.current = false
    }

    convertAll()
  }, [photos, isOpen, dispatch]) // stableUrls intentionally omitted to avoid re‑running on every update

  // Get the URL to use for display/export: prefer the stable data URL
  const getPhotoUrl = (photo) => stableUrls[photo.id] || photo.url

  const handleDownloadPNG = (photo) => {
    const url = getPhotoUrl(photo)
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = `rawfoto_${photo.id}.png`
    link.click()
  }

  const handleDownloadTIFF = async (photo) => {
    const sourceUrl = getPhotoUrl(photo)
    if (!sourceUrl) return

    setIsExporting(true)
    try {
      const img = new Image()
      img.src = sourceUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const tiffBlob = createUncompressedTiff(canvas)
      const tiffUrl = URL.createObjectURL(tiffBlob)

      const link = document.createElement('a')
      link.href = tiffUrl
      link.download = `rawfoto_${photo.id}.tiff`
      link.click()

      setTimeout(() => URL.revokeObjectURL(tiffUrl), 1000)
    } catch (e) {
      console.error('TIFF generation error:', e)
      alert('Failed to generate uncompressed TIFF raw file.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      dispatch(deletePhoto(id))
      // Clean up local stable URL
      setStableUrls((prev) => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      if (selectedPhoto && selectedPhoto.id === id) {
        setSelectedPhoto(null)
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col p-4 sm:p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                <CameraIcon className="w-6 h-6 text-neutral-400" />
                RawFoto Gallery
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'} saved locally
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-900 transition-colors"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Conversion progress indicator */}
          {isConverting && (
            <div className="text-xs text-yellow-400 mb-3 flex items-center gap-2">
              <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
              Preparing RAW files for viewing...
            </div>
          )}

          {/* Photo Grid */}
          {photos.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
              <CameraIcon className="w-16 h-16 mb-4 stroke-[1.2]" />
              <p className="font-medium">No photos captured yet.</p>
              <p className="text-xs text-neutral-600 mt-1 max-w-xs text-center">
                Go to the viewfinder, dial in your manual parameters, and click the shutter.
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pr-2">
              {photos.map((photo) => {
                const url = getPhotoUrl(photo)
                return (
                  <motion.div
                    key={photo.id}
                    layout
                    className="group relative aspect-[3/4] bg-neutral-900 border border-neutral-800 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt="Captured RAW frame"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">
                        Image unavailable
                      </div>
                    )}
                    {/* Badge */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-yellow-400/30 text-yellow-400 text-[10px] font-mono rounded">
                      RAW
                    </span>
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 justify-between">
                      <span className="text-[10px] font-mono text-white/90">
                        ISO {photo.metadata.iso} · {photo.metadata.shutterSpeed}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(photo.id)
                        }}
                        className="p-1 text-red-400 hover:text-red-500 bg-black/50 rounded transition-colors"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Single Photo Inspector Overlay */}
          <AnimatePresence>
            {selectedPhoto && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="fixed inset-0 z-50 bg-black flex flex-col md:flex-row p-4 gap-6"
              >
                {/* Close Inspector button */}
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 z-50 p-2.5 text-white/80 hover:text-white bg-black/50 backdrop-blur-sm border border-neutral-800 rounded-full"
                >
                  <XIcon className="w-5 h-5" />
                </button>

                {/* Left side: big photo view */}
                <div className="flex-1 flex items-center justify-center bg-neutral-950/40 relative min-h-0 md:min-h-full">
                  <img
                    src={getPhotoUrl(selectedPhoto)}
                    alt="Inspect RAW Frame"
                    className="max-w-full max-h-full object-contain shadow-2xl border border-neutral-800"
                  />
                </div>

                {/* Right side: metadata panel */}
                <div className="w-full md:w-80 bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-between shrink-0">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-display font-bold text-white">
                        RAW File Info
                      </h3>
                      <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono rounded">
                        UNCOMPRESSED DNG
                      </span>
                    </div>

                    {/* Metadata specs (unchanged) */}
                    <div className="space-y-4 text-sm">
                      <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
                        <CameraIcon className="w-4 h-4 text-neutral-500" />
                        <div>
                          <div className="text-xs text-neutral-500">Capture Settings</div>
                          <div className="font-mono text-white mt-0.5">
                            ISO {selectedPhoto.metadata.iso} · {selectedPhoto.metadata.shutterSpeed} · {selectedPhoto.metadata.ev >= 0 ? `+${selectedPhoto.metadata.ev}` : selectedPhoto.metadata.ev} EV
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
                        <InfoIcon className="w-4 h-4 text-neutral-500" />
                        <div>
                          <div className="text-xs text-neutral-500">White Balance / Temp</div>
                          <div className="font-mono text-white mt-0.5">
                            {selectedPhoto.metadata.kelvin}K (Daylight preset)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
                        <CalendarIcon className="w-4 h-4 text-neutral-500" />
                        <div>
                          <div className="text-xs text-neutral-500">Timestamp</div>
                          <div className="font-mono text-white mt-0.5">
                            {new Date(selectedPhoto.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
                        <div className="w-4 h-4 text-neutral-500 font-mono text-xs flex items-center justify-center font-bold">W</div>
                        <div>
                          <div className="text-xs text-neutral-500">Camera Aperture</div>
                          <div className="font-mono text-white mt-0.5">f/2.2 (System ideal)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 mt-6">
                    <button
                      onClick={() => handleDownloadTIFF(selectedPhoto)}
                      disabled={isExporting || !getPhotoUrl(selectedPhoto)}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-black py-3 px-4 font-bold hover:bg-yellow-400 active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      {isExporting ? 'Generating TIFF...' : 'Export RAW (.TIFF)'}
                    </button>
                    <button
                      onClick={() => handleDownloadPNG(selectedPhoto)}
                      disabled={!getPhotoUrl(selectedPhoto)}
                      className="w-full flex items-center justify-center gap-2 bg-neutral-800 text-white py-3 px-4 font-medium border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Export PNG
                    </button>
                    <button
                      onClick={() => handleDelete(selectedPhoto.id)}
                      className="w-full flex items-center justify-center gap-2 bg-black text-red-500 hover:text-red-400 py-3 px-4 text-xs font-semibold hover:bg-neutral-950 transition-colors"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                      Delete Image
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}