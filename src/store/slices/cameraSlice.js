import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  iso: 100,
  shutterSpeed: '1/250',
  ev: 0.0,
  focusMode: 'Auto', // 'Auto' or 'Manual'
  focusDistance: 1.0, // 0.0 to 1.0
  wbMode: 'Auto', // 'Auto' or 'Custom'
  kelvin: 5500, // 2500K to 10000K
  facingMode: 'environment', // 'user' or 'environment'
  gridEnabled: true,
  levelEnabled: true,
  aspectRatio: '3:4', // '3:4', '16:9', '1:1'
  flashMode: 'off', // 'off', 'on', 'auto'
  histogramEnabled: true,
  focusReticle: null, // { x, y } coordinates for tap-to-focus simulation
}

const cameraSlice = createSlice({
  name: 'camera',
  initialState,
  reducers: {
    setIso: (state, action) => {
      state.iso = action.payload
    },
    setShutterSpeed: (state, action) => {
      state.shutterSpeed = action.payload
    },
    setEv: (state, action) => {
      state.ev = action.payload
    },
    setFocusMode: (state, action) => {
      state.focusMode = action.payload
    },
    setFocusDistance: (state, action) => {
      state.focusDistance = action.payload
    },
    setWbMode: (state, action) => {
      state.wbMode = action.payload
    },
    setKelvin: (state, action) => {
      state.kelvin = action.payload
    },
    toggleFacingMode: (state) => {
      state.facingMode = state.facingMode === 'environment' ? 'user' : 'environment'
    },
    toggleGrid: (state) => {
      state.gridEnabled = !state.gridEnabled
    },
    toggleLevel: (state) => {
      state.levelEnabled = !state.levelEnabled
    },
    setAspectRatio: (state, action) => {
      state.aspectRatio = action.payload
    },
    toggleFlashMode: (state) => {
      const modes = ['off', 'on', 'auto']
      const currentIndex = modes.indexOf(state.flashMode)
      state.flashMode = modes[(currentIndex + 1) % modes.length]
    },
    toggleHistogram: (state) => {
      state.histogramEnabled = !state.histogramEnabled
    },
    setFocusReticle: (state, action) => {
      state.focusReticle = action.payload
    },
    resetCameraSettings: () => initialState,
  },
})

export const {
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
  setAspectRatio,
  toggleFlashMode,
  toggleHistogram,
  setFocusReticle,
  resetCameraSettings,
} = cameraSlice.actions

export default cameraSlice.reducer
