import { createSlice } from '@reduxjs/toolkit'

// Helper to load gallery items from localStorage
const loadGalleryFromStorage = () => {
  try {
    const saved = localStorage.getItem('rawfoto_gallery')
    return saved ? JSON.parse(saved) : []
  } catch (e) {
    console.error('Error loading gallery from localStorage:', e)
    return []
  }
}

// Helper to save gallery items to localStorage
const saveGalleryToStorage = (items) => {
  try {
    localStorage.setItem('rawfoto_gallery', JSON.stringify(items))
  } catch (e) {
    console.error('Error saving gallery to localStorage:', e)
  }
}

const initialState = {
  items: loadGalleryFromStorage(),
}

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {
    addPhoto: (state, action) => {
      state.items.unshift(action.payload)
      saveGalleryToStorage(state.items)
    },
    deletePhoto: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload)
      saveGalleryToStorage(state.items)
    },
    clearGallery: (state) => {
      state.items = []
      saveGalleryToStorage([])
    },
  },
})

export const { addPhoto, deletePhoto, clearGallery } = gallerySlice.actions
export default gallerySlice.reducer
