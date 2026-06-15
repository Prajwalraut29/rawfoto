import { configureStore } from '@reduxjs/toolkit'
import cameraReducer from './slices/cameraSlice'
import galleryReducer from './slices/gallerySlice'
import pwaReducer from './slices/pwaSlice'

export const store = configureStore({
  reducer: {
    camera: cameraReducer,
    gallery: galleryReducer,
    pwa: pwaReducer,
  },
})
