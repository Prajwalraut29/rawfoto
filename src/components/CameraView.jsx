import React, { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  setIso,
  setShutterSpeed,
  setEv,
  setFocusMode,
  setFocusDistance,
  setWbMode,
  setKelvin,
  toggleFacingMode,
  toggleGrid,
  toggleLevel,
  toggleFlashMode,
  setFocusReticle,
  resetCameraSettings,
} from '../store/slices/cameraSlice'
import { addPhoto } from '../store/slices/gallerySlice'
import { Histogram } from './Histogram'
import {
  Sliders,
  Camera,
  RotateCw,
  Grid3X3,
  Flame,
  Volume2,
  Trash2,
  Compass,
  ArrowLeft,
  Image as ImageIcon,
  Sun,
  Activity,
  SlidersHorizontal,
  Zap,
} from 'lucide-react'

// Manual configuration lists
const SHUTTER_SPEEDS = ['Auto', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1s']
const ISO_VALUES = [100, 200, 400, 800, 1600, 3200, 6400]
const WB_PRESETS = [
  { name: 'Auto', kelvin: 5500 },
  { name: 'Daylight', kelvin: 5500 },
  { name: 'Cloudy', kelvin: 6500 },
  { name: 'Shade', kelvin: 7500 },
  { name: 'Tungsten', kelvin: 3200 },
  { name: 'Fluorescent', kelvin: 4000 },
]

export function CameraView({ onBack, onOpenGallery }) {
  const dispatch = useDispatch()
  const cameraState = useSelector((state) => state.camera)
  const galleryItems = useSelector((state) => state.gallery.items)

  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('exposure') // 'exposure', 'focus', 'color'
  const [flashActive, setFlashActive] = useState(false)
  const [deviceTilt, setDeviceTilt] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const lastPhoto = galleryItems[0] || null

  // Camera stream initialization
  useEffect(() => {
    let activeStream = null

    async function initCamera() {
      try {
        setError(null)
        if (stream) {
          stream.getTracks().forEach((track) => track.stop())
        }

        const constraints = {
          video: {
            facingMode: { ideal: cameraState.facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        }

        const newStream = await navigator.mediaDevices.getUserMedia(constraints)
        activeStream = newStream
        setStream(newStream)

        if (videoRef.current) {
          videoRef.current.srcObject = newStream
        }
      } catch (err) {
        console.error('Camera access error:', err)
        setError('Unable to access camera. Please check camera permissions in your settings.')
      }
    }

    initCamera()

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cameraState.facingMode])

  // Device orientation tilt sensor for levels
  useEffect(() => {
    const handleOrientation = (e) => {
      if (cameraState.levelEnabled) {
        setDeviceTilt({
          alpha: Math.round(e.alpha || 0),
          beta: Math.round(e.beta || 0),
          gamma: Math.round(e.gamma || 0),
        })
      }
    }

    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [cameraState.levelEnabled])

  // Tap to focus simulation
  const handleViewfinderTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    dispatch(setFocusReticle({ x, y }))

    // Auto clear reticle after 2 seconds
    setTimeout(() => {
      dispatch(setFocusReticle(null))
    }, 2000)
  }

  // Shutter action
  const handleShutterClick = () => {
    if (!videoRef.current || !stream) return

    // Play simulated click audio if supported, or play default shutter sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(800, audioCtx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.15)
    } catch (e) {
      console.warn('Audio Context shutter sound error:', e)
    }

    // Flash visual effect
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 2000) // Flash trigger fades out

    // Capture Canvas drawing
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 960
    const ctx = canvas.getContext('2d')

    // Capture image with current orientation/transformations if facing front camera
    if (cameraState.facingMode === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Apply manual processing filters onto the canvas pixels to bake parameters into the image
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imgData.data

    // 1. Calculate manual parameters multipliers
    const brightnessMult = 1.0 + cameraState.ev * 0.15 // EV offset
    const kelvinOffset = (cameraState.kelvin - 5500) / 4500 // -1.0 (cool) to 1.0 (warm)
    const noiseLevel = (cameraState.iso - 100) / 6300 * 0.15 // ISO noise level

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]

      // EV adjustments
      r = Math.min(255, Math.max(0, r * brightnessMult))
      g = Math.min(255, Math.max(0, g * brightnessMult))
      b = Math.min(255, Math.max(0, b * brightnessMult))

      // Kelvin (Color Temperature) adjustments
      if (kelvinOffset > 0) {
        // Warm/Amber shift (Low temperature presets are actually warm, High Kelvin is warm orange, low is cool blue)
        r = Math.min(255, r * (1.0 + kelvinOffset * 0.15))
        b = Math.max(0, b * (1.0 - kelvinOffset * 0.1))
      } else {
        // Cool/Blue shift
        r = Math.max(0, r * (1.0 + kelvinOffset * 0.1))
        b = Math.min(255, b * (1.0 - kelvinOffset * 0.15))
      }

      // Add ISO simulated digital grain/noise
      if (noiseLevel > 0) {
        const noise = (Math.random() - 0.5) * noiseLevel * 255
        r = Math.min(255, Math.max(0, r + noise))
        g = Math.min(255, Math.max(0, g + noise))
        b = Math.min(255, Math.max(0, b + noise))
      }

      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
    }
    ctx.putImageData(imgData, 0, 0)

    const url = canvas.toDataURL('image/png')

    // Add photo to Redux store
    dispatch(
      addPhoto({
        id: Date.now().toString(),
        url,
        timestamp: Date.now(),
        metadata: {
          iso: cameraState.iso,
          shutterSpeed: cameraState.shutterSpeed,
          ev: cameraState.ev,
          kelvin: cameraState.kelvin,
        },
      })
    )
  }

  // Get current CSS Filter string for real-time live preview matching settings
  const getPreviewFilter = () => {
    const brightness = 1.0 + cameraState.ev * 0.12
    const blur = cameraState.focusMode === 'Manual' ? Math.abs(1.0 - cameraState.focusDistance) * 3 : 0
    return `brightness(${brightness}) blur(${blur}px)`
  }

  // Get current Kelvin temperature color tint for live preview
  const getKelvinOverlayColor = () => {
    const k = cameraState.kelvin
    if (k > 5500) {
      // Warm tint
      const opacity = ((k - 5500) / 4500) * 0.15
      return `rgba(245, 158, 11, ${opacity})`
    } else if (k < 5500) {
      // Cool blue tint
      const opacity = ((5500 - k) / 3000) * 0.12
      return `rgba(59, 130, 246, ${opacity})`
    }
    return 'transparent'
  }

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* Top Options Bar */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-neutral-950 text-white z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          Landing
        </button>

        <div className="flex gap-6">
          <button
            onClick={() => dispatch(toggleGrid())}
            className={`p-1.5 rounded transition-colors ${cameraState.gridEnabled ? 'text-yellow-400' : 'text-neutral-500'}`}
            title="Toggle Composition Grid"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
          <button
            onClick={() => dispatch(toggleLevel())}
            className={`p-1.5 rounded transition-colors ${cameraState.levelEnabled ? 'text-yellow-400' : 'text-neutral-500'}`}
            title="Toggle Leveler"
          >
            <Compass className="w-5 h-5" />
          </button>
          <button
            onClick={() => dispatch(toggleFlashMode())}
            className={`p-1.5 rounded transition-colors ${cameraState.flashMode !== 'off' ? 'text-yellow-400' : 'text-neutral-500'} flex items-center gap-0.5`}
            title="Toggle Simulated Flash"
          >
            <Zap className="w-5 h-5" />
            <span className="text-[9px] uppercase font-bold">{cameraState.flashMode}</span>
          </button>
        </div>

        <div className="w-16" />
      </div>

      {/* Main Viewfinder Section */}
      <div className="flex-1 bg-neutral-950 relative flex items-center justify-center min-h-0">
        {error ? (
          <div className="p-8 text-center text-neutral-500 max-w-sm">
            <Camera className="w-12 h-12 mx-auto mb-4 stroke-[1.2]" />
            <p className="text-sm font-medium mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-yellow-500 border border-yellow-500/30 px-4 py-2"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <div
            onClick={handleViewfinderTap}
            onContextMenu={(e) => e.preventDefault()}
            className="relative max-w-full aspect-[3/4] h-full overflow-hidden bg-black shadow-inner cursor-pointer"
          >
            {/* Actual Live Video Feed */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              onContextMenu={(e) => e.preventDefault()}
              className="w-full h-full object-cover pointer-events-none"
              style={{
                filter: getPreviewFilter(),
                transform: cameraState.facingMode === 'user' ? 'scaleX(-1)' : 'none',
              }}
            />
            {/* Simulated Color Kelvin Tint Layer */}
            <div
              className="absolute inset-0 pointer-events-none z-10 mix-blend-color"
              style={{ backgroundColor: getKelvinOverlayColor() }}
            />

            {/* Simulated Digital Noise overlay for high ISO */}
            {cameraState.iso >= 800 && (
              <div
                className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay opacity-15"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
            )}

            {/* Shutter Visual Flash Overlay */}
            <AnimatePresence>
              {flashActive && (
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 bg-white z-30 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Composition Rule-of-Thirds Grid */}
            {cameraState.gridEnabled && (
              <div className="absolute inset-0 z-20 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/5">
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-r border-b border-white/10" />
                <div className="border-b border-white/10" />
                <div className="border-r border-white/10" />
                <div className="border-r border-white/10" />
                <div />
              </div>
            )}

            {/* Focus level indicators (Gyro tilt visualizer) */}
            {cameraState.levelEnabled && (
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <div className="relative w-40 h-40 border border-white/10 rounded-full flex items-center justify-center">
                  {/* Outer circle horizon lines */}
                  <div className="absolute w-6 h-0.5 bg-white/20 left-0" />
                  <div className="absolute w-6 h-0.5 bg-white/20 right-0" />

                  {/* Level roll line */}
                  <div
                    className="w-24 h-0.5 bg-green-400 shadow-sm transition-transform duration-75"
                    style={{
                      transform: `rotate(${cameraState.facingMode === 'user' ? -deviceTilt.gamma : deviceTilt.gamma}deg)`,
                      backgroundColor: Math.abs(deviceTilt.gamma) <= 1 ? '#4ade80' : '#f87171',
                    }}
                  />
                  {/* Center Dot */}
                  <div className="absolute w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            )}

            {/* Focus Box Reticle */}
            <AnimatePresence>
              {cameraState.focusReticle && (
                <motion.div
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute z-20 w-16 h-16 border border-yellow-400 flex items-center justify-center pointer-events-none"
                  style={{
                    left: `calc(${cameraState.focusReticle.x}% - 32px)`,
                    top: `calc(${cameraState.focusReticle.y}% - 32px)`,
                  }}
                >
                  <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live RGB Histogram Overlay */}
            <Histogram videoRef={videoRef} isEnabled={cameraState.histogramEnabled} />

            {/* Corner Bracket Overlays */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/60 pointer-events-none z-10" />
            <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/60 pointer-events-none z-10" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/60 pointer-events-none z-10" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/60 pointer-events-none z-10" />

            {/* Realtime EXIF values on bottom of viewfinder */}
            <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 z-20 flex items-center gap-3 text-[10px] font-mono text-white/90">
              <span className="text-yellow-400 font-bold">RAW</span>
              <span>ISO {cameraState.iso}</span>
              <span>{cameraState.shutterSpeed}s</span>
              <span>{cameraState.ev >= 0 ? `+${cameraState.ev.toFixed(1)}` : cameraState.ev.toFixed(1)} EV</span>
              <span>{cameraState.kelvin}K</span>
            </div>
          </div>
        )}
      </div>

      {/* Manual Parameters Controls Drawer */}
      <div className="bg-neutral-900 border-t border-white/5 pb-6 pt-3 flex flex-col items-center justify-between shrink-0 z-30">
        {/* Control Sub Tabs */}
        <div className="flex gap-8 border-b border-white/5 w-full justify-center pb-2.5 text-xs font-semibold text-neutral-400">
          <button
            onClick={() => setActiveTab('exposure')}
            className={`pb-1.5 border-b-2 transition-colors ${activeTab === 'exposure' ? 'border-yellow-400 text-white' : 'border-transparent hover:text-white'}`}
          >
            Exposure (ISO/Speed/EV)
          </button>
          <button
            onClick={() => setActiveTab('focus')}
            className={`pb-1.5 border-b-2 transition-colors ${activeTab === 'focus' ? 'border-yellow-400 text-white' : 'border-transparent hover:text-white'}`}
          >
            Focus Distance
          </button>
          <button
            onClick={() => setActiveTab('color')}
            className={`pb-1.5 border-b-2 transition-colors ${activeTab === 'color' ? 'border-yellow-400 text-white' : 'border-transparent hover:text-white'}`}
          >
            White Balance (WB)
          </button>
        </div>

        {/* Tab Controls Display */}
        <div className="w-full max-w-md px-6 py-4 flex flex-col gap-4 text-xs">
          {activeTab === 'exposure' && (
            <div className="space-y-4">
              {/* ISO Slider Selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                  <span>ISO SENSITIVITY</span>
                  <span className="text-white font-bold">{cameraState.iso}</span>
                </div>
                <div className="flex justify-between gap-1">
                  {ISO_VALUES.map((val) => (
                    <button
                      key={val}
                      onClick={() => dispatch(setIso(val))}
                      className={`flex-1 py-2 font-mono border rounded ${cameraState.iso === val ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shutter Speed Selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                  <span>SHUTTER SPEED</span>
                  <span className="text-white font-bold">{cameraState.shutterSpeed}</span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-neutral-800">
                  {SHUTTER_SPEEDS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => dispatch(setShutterSpeed(speed))}
                      className={`px-3 py-1.5 font-mono border rounded shrink-0 ${cameraState.shutterSpeed === speed ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'}`}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>

              {/* EV Compensation Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                  <span>EXPOSURE COMPENSATION</span>
                  <span className="text-white font-bold">
                    {cameraState.ev >= 0 ? `+${cameraState.ev.toFixed(1)}` : cameraState.ev.toFixed(1)} EV
                  </span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.3"
                  value={cameraState.ev}
                  onChange={(e) => dispatch(setEv(parseFloat(e.target.value)))}
                  className="w-full accent-white bg-neutral-800 rounded-lg appearance-none h-1 cursor-pointer"
                />
              </div>
            </div>
          )}

          {activeTab === 'focus' && (
            <div className="space-y-4 py-2">
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => dispatch(setFocusMode('Auto'))}
                  className={`flex-1 py-3 border rounded font-semibold ${cameraState.focusMode === 'Auto' ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400'}`}
                >
                  Auto Focus (AF)
                </button>
                <button
                  onClick={() => dispatch(setFocusMode('Manual'))}
                  className={`flex-1 py-3 border rounded font-semibold ${cameraState.focusMode === 'Manual' ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400'}`}
                >
                  Manual Focus (MF)
                </button>
              </div>

              {cameraState.focusMode === 'Manual' && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                    <span>FOCAL DISTANCE (MACRO → INFINITY)</span>
                    <span className="text-white font-bold">
                      {cameraState.focusDistance === 0 ? 'Macro (0.0)' : cameraState.focusDistance === 1 ? 'Infinity (1.0)' : cameraState.focusDistance.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={cameraState.focusDistance}
                    onChange={(e) => dispatch(setFocusDistance(parseFloat(e.target.value)))}
                    className="w-full accent-white bg-neutral-800 rounded-lg appearance-none h-1 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>Macro (0.0)</span>
                    <span>1.5m</span>
                    <span>Infinity (1.0)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'color' && (
            <div className="space-y-4">
              {/* Preset Selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                  <span>WHITE BALANCE PRESET</span>
                  <span className="text-white font-bold">{cameraState.wbMode}</span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {WB_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        dispatch(setWbMode(preset.name))
                        dispatch(setKelvin(preset.kelvin))
                      }}
                      className={`px-3 py-1.5 border rounded shrink-0 ${cameraState.wbMode === preset.name ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400 hover:text-white'}`}
                    >
                      {preset.name}
                    </button>
                  ))}
                  <button
                    onClick={() => dispatch(setWbMode('Custom'))}
                    className={`px-3 py-1.5 border rounded shrink-0 ${cameraState.wbMode === 'Custom' ? 'bg-white text-black border-white' : 'border-neutral-800 text-neutral-400'}`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Kelvin Temp Slider */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between font-mono text-[10px] text-neutral-400">
                  <span>COLOR TEMPERATURE</span>
                  <span className="text-white font-bold">{cameraState.kelvin} Kelvin</span>
                </div>
                <input
                  type="range"
                  min="2500"
                  max="10000"
                  step="100"
                  value={cameraState.kelvin}
                  disabled={cameraState.wbMode !== 'Custom'}
                  onChange={(e) => dispatch(setKelvin(parseInt(e.target.value)))}
                  className={`w-full accent-white bg-neutral-800 rounded-lg appearance-none h-1 cursor-pointer ${cameraState.wbMode !== 'Custom' ? 'opacity-30 cursor-not-allowed' : ''}`}
                />
                <div className="flex justify-between text-[10px] text-neutral-500 font-mono">
                  <span className="text-blue-400">2500K (Incandescent)</span>
                  <span className="text-yellow-500">5500K (Sunlight)</span>
                  <span className="text-orange-500">10000K (Overcast)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shutter Button area */}
        <div className="w-full flex items-center justify-between px-10 pt-2 max-w-sm">
          {/* Gallery Button Thumbnail */}
          <button
            onClick={onOpenGallery}
            className="w-12 h-12 bg-neutral-850 border border-white/10 rounded-full overflow-hidden flex items-center justify-center group relative hover:border-white/30"
          >
            {lastPhoto ? (
              <img
                src={lastPhoto.url}
                alt="Last capture"
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
            ) : (
              <ImageIcon className="w-5 h-5 text-neutral-500 group-hover:text-white" />
            )}
            {/* Gallery items counter bubble */}
            {galleryItems.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-yellow-500 text-black font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                {galleryItems.length}
              </span>
            )}
          </button>

          {/* Core Shutter Trigger */}
          <button
            onClick={handleShutterClick}
            disabled={!stream}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center p-1 hover:bg-neutral-800 transition-colors disabled:opacity-40"
          >
            <div className="w-full h-full bg-white rounded-full transition-transform active:scale-90 hover:scale-95" />
          </button>

          {/* Switch Facing camera */}
          <button
            onClick={() => dispatch(toggleFacingMode())}
            className="w-12 h-12 bg-neutral-900 border border-white/10 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/30 active:scale-95 transition-transform"
          >
            <RotateCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
