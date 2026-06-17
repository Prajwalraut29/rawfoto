import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { deletePhoto, clearGallery } from '../store/slices/gallerySlice'
import { getImageBlob, deleteImageBlob, clearAllImageBlobs } from '../utils/imageDB'
import { createUncompressedTiff } from '../utils/tiffWriter'
import { createMinimalDng } from '../utils/dngWriter'
import { XIcon, DownloadIcon, Trash2Icon, InfoIcon, CalendarIcon, CameraIcon, Loader2Icon } from 'lucide-react'
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

  // Map of id → object URL (created from IndexedDB blobs, revoked on cleanup)
  const [blobUrls, setBlobUrls] = useState({})
  const [loadingIds, setLoadingIds] = useState(new Set())
  const revokeQueue = useRef([])

  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [errorIds, setErrorIds] = useState(new Set()) // IDs that failed to load from IndexedDB

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
            if (signal.aborted) return
            if (!blob) {
              // Blob not found in IndexedDB — mark as error
              setErrorIds((prev) => { const s = new Set(prev); s.add(id); return s })
              return
            }
            const url = URL.createObjectURL(blob)
            revokeQueue.current.push(url)
            setBlobUrls((prev) => ({ ...prev, [id]: url }))
          } catch (err) {
            console.warn(`Could not load image ${id} from IndexedDB:`, err)
            setErrorIds((prev) => { const s = new Set(prev); s.add(id); return s })
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

  /** Retry loading a single photo that previously errored */
  const handleRetry = useCallback(async (photo) => {
    setErrorIds((prev) => { const s = new Set(prev); s.delete(photo.id); return s })
    setLoadingIds((prev) => { const s = new Set(prev); s.add(photo.id); return s })
    try {
      const blob = await getImageBlob(photo.id)
      if (!blob) {
        setErrorIds((prev) => { const s = new Set(prev); s.add(photo.id); return s })
        return
      }
      const url = URL.createObjectURL(blob)
      revokeQueue.current.push(url)
      setBlobUrls((prev) => ({ ...prev, [photo.id]: url }))
    } catch (err) {
      console.warn('Retry failed:', err)
      setErrorIds((prev) => { const s = new Set(prev); s.add(photo.id); return s })
    } finally {
      setLoadingIds((prev) => { const s = new Set(prev); s.delete(photo.id); return s })
    }
  }, [])

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  // ─── Downloads ────────────────────────────────────────────────────────────

  const handleDownloadJPEG = async (photo) => {
    try {
      const blob = await getImageBlob(photo.id)
      if (!blob) { alert('Image not found in storage.'); return }
      const extension = photo.metadata?.mimeType === 'image/png' ? 'png' : 'jpg'
      downloadBlob(blob, `rawfoto_${photo.id}.${extension}`)
    } catch (err) {
      console.error('JPEG download error:', err)
      alert('Failed to download image.')
    }
  }

  const handleDownloadTIFF = async (photo) => {
    setIsExporting(true)
    try {
      const blob = await getImageBlob(photo.id)
      if (!blob) { alert('Image not found in storage.'); return }

      const canvas = await blobToCanvas(blob)
      if (!canvas) { alert('Failed to decode image.'); return }

      const tiffBlob = createUncompressedTiff(canvas)
      downloadBlob(tiffBlob, `rawfoto_${photo.id}.tiff`)
    } catch (err) {
      console.error('TIFF generation error:', err)
      alert('Failed to generate uncompressed TIFF.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownloadDNG = async (photo) => {
    setIsExporting(true)
    try {
      const blob = await getImageBlob(photo.id)
      if (!blob) { alert('Image not found in storage.'); return }

      const canvas = await blobToCanvas(blob)
      if (!canvas) { alert('Failed to decode image.'); return }

      const dngBlob = createMinimalDng(canvas)
      downloadBlob(dngBlob, `rawfoto_${photo.id}.dng`)
    } catch (err) {
      console.error('DNG generation error:', err)
      alert('Failed to generate DNG.')
    } finally {
      setIsExporting(false)
    }
  }

  /** Load a JPEG blob into an off-screen canvas and return it */
  const blobToCanvas = async (blob) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.src = url
    try {
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      return canvas
    } finally {
      URL.revokeObjectURL(url)
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

          {/* Loading indicator while blobs are fetched from IndexedDB */}
          {loadingIds.size > 0 && (
            <div className="text-xs text-yellow-400 mb-3 flex items-center gap-2">
              <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
              Loading images…
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
                const isLoading = loadingIds.has(photo.id)
                const hasError = errorIds.has(photo.id)
                const tileAspect = photo.metadata?.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[3/4]'
                const fileSizeKB = photo.metadata?.fileSize
                  ? (photo.metadata.fileSize / 1024).toFixed(1)
                  : null
                return (
                  <motion.div
                    key={photo.id}
                    layout
                    className={`group relative ${tileAspect} bg-neutral-900 border ${
                      hasError ? 'border-red-900/60' : 'border-neutral-800'
                    } overflow-hidden cursor-pointer`}
                    onClick={() => !hasError && setSelectedPhoto(photo)}
                  >
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                      </div>
                    ) : hasError ? (
                      /* ❌ Error card — shown when IndexedDB has no blob for this photo */
                      <div className="w-full h-full flex flex-col items-start justify-between p-2.5 bg-neutral-950">
                        <div className="flex items-center gap-1.5 text-red-400">
                          <XIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[10px] font-bold font-mono leading-tight">Failed to load</span>
                        </div>
                        <div className="space-y-0.5 w-full">
                          <p className="text-[9px] font-mono text-neutral-500 truncate">
                            rawfoto_{photo.id}
                          </p>
                          <p className="text-[9px] font-mono text-neutral-600">
                            {new Date(photo.timestamp).toLocaleTimeString()}
                          </p>
                          <p className="text-[9px] font-mono text-neutral-600">
                            {photo.metadata?.width && photo.metadata.width > 0
                              ? `${photo.metadata.width}×${photo.metadata.height}px`
                              : '∞×∞ px'}
                          </p>
                          {fileSizeKB && (
                            <p className="text-[9px] font-mono text-neutral-600">{fileSizeKB} KB</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRetry(photo) }}
                          className="w-full text-[9px] font-bold font-mono text-yellow-400 border border-yellow-400/30 py-0.5 hover:bg-yellow-400/10 transition-colors"
                        >
                          RETRY
                        </button>
                      </div>
                    ) : url ? (
                      <img
                        src={url}
                        alt="Captured RAW frame"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600">
                        <Loader2Icon className="w-5 h-5 animate-spin" />
                      </div>
                    )}

                    {/* RAW badge — only when loaded */}
                    {url && !hasError && (
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-md border border-yellow-400/30 text-yellow-400 text-[10px] font-mono rounded">
                        PREVIEW
                      </span>
                    )}

                    {/* Hover overlay — only when loaded */}
                    {url && !hasError && (
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
                    )}
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
                      alt="Inspect preview image"
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
                      <h3 className="text-lg font-display font-bold text-white">Preview Image Info</h3>
                      <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-mono rounded">
                        JPEG preview
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
                      disabled={isExporting || !getPhotoUrl(selectedPhoto)}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-500 text-black py-3 px-4 font-bold hover:bg-yellow-400 active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      {isExporting ? 'Generating…' : 'Export TIFF'}
                    </button>
                    <button
                      onClick={() => handleDownloadDNG(selectedPhoto)}
                      disabled={isExporting || !getPhotoUrl(selectedPhoto)}
                      className="w-full flex items-center justify-center gap-2 bg-yellow-600 text-black py-3 px-4 font-bold hover:bg-yellow-500 active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      {isExporting ? 'Generating…' : 'Export DNG'}
                    </button>
                    <button
                      onClick={() => handleDownloadJPEG(selectedPhoto)}
                      disabled={!getPhotoUrl(selectedPhoto)}
                      className="w-full flex items-center justify-center gap-2 bg-neutral-800 text-white py-3 px-4 font-medium border border-neutral-700 hover:bg-neutral-700 active:scale-[0.98] transition-transform disabled:opacity-50"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Export JPEG
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