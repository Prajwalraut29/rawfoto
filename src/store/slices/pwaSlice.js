import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  isInstallable: false,
  isInstalled: false,
  bannerDismissed: false,
}

const pwaSlice = createSlice({
  name: 'pwa',
  initialState,
  reducers: {
    setInstallable: (state, action) => {
      state.isInstallable = action.payload
    },
    setInstalled: (state, action) => {
      state.isInstalled = action.payload
      if (action.payload) {
        state.isInstallable = false
      }
    },
    dismissBanner: (state) => {
      state.bannerDismissed = true
    },
  },
})

export const { setInstallable, setInstalled, dismissBanner } = pwaSlice.actions
export default pwaSlice.reducer
