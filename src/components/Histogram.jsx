import React, { useEffect, useRef } from 'react'

export function Histogram({ videoRef, isEnabled }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const offscreenCanvasRef = useRef(null)

  useEffect(() => {
    if (!isEnabled || !videoRef.current) {
      // Clear canvas if disabled
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Create a tiny offscreen canvas to downsample the frame for fast computation
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas')
      offscreenCanvasRef.current.width = 64
      offscreenCanvasRef.current.height = 48
    }
    const offscreenCanvas = offscreenCanvasRef.current
    const offscreenCtx = offscreenCanvas.getContext('2d')

    const drawHistogram = () => {
      if (video.paused || video.ended || video.readyState < 2) {
        animRef.current = requestAnimationFrame(drawHistogram)
        return
      }

      const w = canvas.width
      const h = canvas.height

      // 1. Draw video frame downsampled onto the tiny offscreen canvas
      offscreenCtx.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height)
      
      // 2. Extract pixels
      const imgData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height)
      const data = imgData.data
      
      // 3. Populate RGB bins (256 levels of brightness)
      const rHist = new Array(256).fill(0)
      const gHist = new Array(256).fill(0)
      const bHist = new Array(256).fill(0)
      const lHist = new Array(256).fill(0) // Luminance

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        rHist[r]++
        gHist[g]++
        bHist[b]++
        
        // Luminance formula
        const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b)
        lHist[l]++
      }

      // 4. Find max value to normalize height
      const maxVal = Math.max(
        Math.max(...rHist),
        Math.max(...gHist),
        Math.max(...bHist),
        Math.max(...lHist),
        1
      )

      // 5. Draw histogram curves
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.fillRect(0, 0, w, h)

      const drawPath = (histArray, color, fillStyle) => {
        ctx.beginPath()
        ctx.moveTo(0, h)
        
        for (let x = 0; x < w; x++) {
          // Map x coordinate (0 to w) to bin index (0 to 255)
          const binIndex = Math.floor((x / w) * 255)
          const val = histArray[binIndex]
          
          // Normalize y height
          const y = h - (val / maxVal) * (h - 4)
          ctx.lineTo(x, y)
        }
        
        ctx.lineTo(w, h)
        ctx.closePath()

        if (fillStyle) {
          ctx.fillStyle = fillStyle
          ctx.fill()
        }
        
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Draw red, green, blue overlays with translucency
      ctx.globalCompositeOperation = 'screen'
      drawPath(rHist, 'rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.15)')
      drawPath(gHist, 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.15)')
      drawPath(bHist, 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.15)')
      ctx.globalCompositeOperation = 'source-over'
      
      // Draw white luminance curve
      drawPath(lHist, 'rgba(255, 255, 255, 0.9)', null)

      animRef.current = requestAnimationFrame(drawHistogram)
    }

    animRef.current = requestAnimationFrame(drawHistogram)

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
      }
    }
  }, [videoRef, isEnabled])

  return (
    <div className="absolute top-20 right-4 w-32 h-20 rounded border border-white/20 overflow-hidden shadow-md z-30 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={128}
        height={80}
        className="w-full h-full block"
      />
    </div>
  )
}
