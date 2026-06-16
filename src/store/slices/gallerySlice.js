import { createSlice } from '@reduxjs/toolkit'

/**
 * Images are stored as Blobs in IndexedDB (see src/utils/imageDB.js).
 * Only photo metadata + IDs are kept in Redux/localStorage — no base64 strings —
 * so we stay well under the ~5 MB localStorage quota on all platforms including Android.
 */

const STORAGE_KEY = 'rawfoto_gallery_meta'

const loadMetaFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const items = JSON.parse(saved)
    // Strip any legacy url fields that may have been saved before this refactor
    return items.map(({ url: _url, ...rest }) => rest)
  } catch (e) {
    console.error('Error loading gallery metadata from localStorage:', e)
    return []
  }
}

const saveMetaToStorage = (items) => {
  try {
    // Never persist url — blobs live in IndexedDB
    const meta = items.map(({ url: _url, ...rest }) => rest)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
  } catch (e) {
    console.error('Error saving gallery metadata to localStorage:', e)
  }
}

const initialState = {
  items: loadMetaFromStorage(),
}

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {
    /** Payload: { id, timestamp, metadata }  — NO url field */
    addPhoto: (state, action) => {
      // Remove url just in case caller includes it (defensive)
      const { url: _url, ...photo } = action.payload
      state.items.unshift(photo)
      saveMetaToStorage(state.items)
    },
    deletePhoto: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      saveMetaToStorage(state.items)
    },
    clearGallery: (state) => {
      state.items = []
      saveMetaToStorage([])
    },
    // updatePhotoUrl: no-op — images live in IndexedDB, not in Redux state
    updatePhotoUrl: (_state, _action) => {},
  },
})

export const { addPhoto, deletePhoto, clearGallery, updatePhotoUrl } = gallerySlice.actions
export default gallerySlice.reducer
