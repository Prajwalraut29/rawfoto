import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { deletePhoto, clearGallery } from '../store/slices/gallerySlice'
import { getImageBlob, deleteImageBlob, clearAllImageBlobs } from '../utils/imageDB'
import { createUncompressedTiff } from '../utils/tiffWriter'
import { XIcon, DownloadIcon, Trash2Icon, InfoIcon, CalendarIcon, CameraIcon, Loader2Icon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function GalleryView({ isOpen, onClose }) {
  const dispatch = useDispatch()
  const photos = useSelector((state) => state.gallery.items)

  // Map of id → object URL (created from IndexedDB blobs, revoked on cleanup)
  const [blobUrls, setBlobUrls] = useState({})
  const [loadingIds, setLoadingIds] = useState(new Set())
  const revokeQueue = useRef([])

  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Load blob URLs for all photos whenever gallery opens or photo list changes
  useEffect(() => {
    if (!isOpen || photos.length === 0) return

    const controller = new AbortController()
    const { signal } = controller

    const load = async () => {
      const newIds = photos
        .map((p) => p.id)
        .filter((id) => !blobUrls[id])

      if (newIds.length === 0) return

      setLoadingIds((prev) => {
        const next = new Set(prev)
        newIds.forEach((id) => next.add(id))
        return next
      })

      await Promise.allSettled(
        newIds.map(async (id) => {
          if (signal.aborted) return
          try {
            const blob = await getImageBlob(id)
            if (signal.aborted || !blob) return
            const url = URL.createObjectURL(blob)
            revokeQueue.current.push(url)
            setBlobUrls((prev) => ({ ...prev, [id]: url }))
          } catch (err) {
            console.warn(`Could not load image ${id} from IndexedDB:`, err)
          }
        })
      )

      if (!signal.aborted) {
        setLoadingIds((prev) => {
          const next = new Set(prev)
          newIds.forEach((id) => next.delete(id))
          return next
        })
      }
    }

    load()

    return () => {
      controller.abort()
    }
  }, [photos, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // Revoke all object URLs when component unmounts
  useEffect(() => {
    return () => {
      revokeQueue.current.forEach((url) => URL.revokeObjectURL(url))
      revokeQueue.current = []
    }
  }, [])

  const getPhotoUrl = useCallback((photo) => blobUrls[photo.id] || null, [blobUrls])

  // ─── Downloads ────────────────────────────────────────────────────────────

  const handleDownloadPNG = async (photo) => {
    try {
      const blob = await getImageBlob(photo.id)
      if (!blob) { alert('Image not found in storage.'); return }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rawfoto_${photo.id}.png`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      console.error('PNG download error:', err)
      alert('Failed to download image.')
    }
  }

  const handleDownloadTIFF = async (photo) => {
    setIsExporting(true)
    try {
      const blob = await getImageBlob(photo.id)
      if (!blob) { alert('Image not found in storage.'); return }

      const img = new Image()
      const tempUrl = URL.createObjectURL(blob)
      img.src = tempUrl
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      URL.revokeObjectURL(tempUrl)

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
    } catch (err) {
      console.error('TIFF generation error:', err)
      alert('Failed to generate uncompressed TIFF.')
    } finally {
      setIsExporting(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this photo?')) return
    // Revoke object URL
    if (blobUrls[id]) {
      URL.revokeObjectURL(blobUrls[id])
      setBlobUrls((prev) => { const c = { ...prev }; delete c[id]; return c })
    }
    // Delete from IndexedDB
    try { await deleteImageBlob(id) } catch (err) { console.warn('IDB delete error:', err) }
    // Remove from Redux / localStorage
    dispatch(deletePhoto(id))
    if (selectedPhoto && selectedPhoto.id === id) setSelectedPhoto(null)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
                const isLoading = loadingIds.has(photo.id)
                const tileAspect = photo.metadata?.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[3/4]'
                return (
                  <motion.div
                    key={photo.id}
                    layout
                    className={`group relative ${tileAspect} bg-neutral-900 border border-neutral-800 overflow-hidden cursor-pointer`}
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                      </div>
                    ) : url ? (
                      <img
                        src={url}
                        alt="Captured RAW frame"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs text-center px-2">
                        Image unavailable
                      </div>
                    )}

                    {/* RAW badge */}
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-yellow-400/30 text-yellow-400 text-[10px] font-mono rounded">
                      RAW
                    </span>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 justify-between">
                      <span className="text-[10px] font-mono text-white/90">
                        ISO {photo.metadata.iso} · {photo.metadata.shutterSpeed}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(photo.id) }}
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
                {/* Close Inspector */}
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="absolute top-4 right-4 z-50 p-2.5 text-white/80 hover:text-white bg-black/50 backdrop-blur-sm border border-neutral-800 rounded-full"
                >
                  <XIcon className="w-5 h-5" />
                </button>

                {/* Image view */}
                <div className="flex-1 flex items-center justify-center bg-neutral-950/40 relative min-h-0 md:min-h-full">
                  {getPhotoUrl(selectedPhoto) ? (
                    <img
                      src={getPhotoUrl(selectedPhoto)}
                      alt="Inspect RAW Frame"
                      className="max-w-full max-h-full object-contain shadow-2xl border border-neutral-800"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-neutral-500">
                      <Loader2Icon className="w-8 h-8 animate-spin" />
                      <span className="text-sm">Loading image…</span>
                    </div>
                  )}
                </div>

                {/* Metadata panel */}
                <div className="w-full md:w-80 bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-between shrink-0">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-display font-bold text-white">RAW File Info</h3>
                      <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono rounded">
                        UNCOMPRESSED PNG
                      </span>
                    </div>

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
                            {selectedPhoto.metadata.kelvin}K
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
                        <div className="w-4 h-4 text-neutral-500 font-mono text-xs flex items-center justify-center font-bold">R</div>
                        <div>
                          <div className="text-xs text-neutral-500">Resolution · Aspect</div>
                          <div className="font-mono text-white mt-0.5">
                            {selectedPhoto.metadata.width && selectedPhoto.metadata.height
                              ? `${selectedPhoto.metadata.width} × ${selectedPhoto.metadata.height}`
                              : 'Full Native'}
                            {selectedPhoto.metadata.aspectRatio ? ` · ${selectedPhoto.metadata.aspectRatio}` : ''}
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
                      disabled={isExporting}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-black py-3 px-4 font-bold hover:bg-yellow-400 active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      {isExporting ? 'Generating TIFF…' : 'Export RAW (.TIFF)'}
                    </button>
                    <button
                      onClick={() => handleDownloadPNG(selectedPhoto)}
                      className="w-full flex items-center justify-center gap-2 bg-neutral-800 text-white py-3 px-4 font-medium border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-transform"
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