# RawFoto — Minimalist RAW Camera

> A browser-based RAW camera simulator that turns your phone or laptop into a full-manual photography tool.

RawFoto is a **progressive web app** (PWA) built with React and Vite that uses your device's camera to capture uncompressed, lossless PNG images. It gives you full DSLR-style manual control — ISO, shutter speed, exposure compensation, white balance, focus simulation — all running in the browser, no native app required.

Capture, review, download, and delete your photos from the in-app gallery, all stored locally via IndexedDB so nothing leaves your device unless you export it.

---

## Features

- **Full manual controls** — adjust ISO (100–6400), shutter speed (1/1000s to 1s), EV compensation (±3 EV), and white balance temperature (2500K–10000K)
- **Manual & auto focus** — toggle between AF and MF with a simulated distance slider; tap the viewfinder to place a focus reticle
- **Live RGB histogram** — real-time luminance and RGB channel overlay to nail your exposure before you shoot
- **Composition grids** — rule-of-thirds grid overlay and a gyroscope-based level indicator
- **Dual aspect ratios** — switch between classic 3:4 and cinematic 16:9 cropping
- **Front/rear camera toggle** — flip between selfie and rear cameras on mobile
- **Simulated flash & shutter sound** — visual flash animation and synthesized audio feedback
- **In-app gallery** — browse, inspect metadata, download, or delete your captures
- **PWA installable** — add to your home screen for a full-screen, offline-capable experience (works on Android, iOS, and desktop)
- **First-run tutorial** — step-by-step onboarding for new users

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 19 |
| Build tool | Vite 8 (with HMR) |
| State management | Redux Toolkit |
| Styling | Tailwind CSS 4 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Image storage | IndexedDB (via raw wrapper) |
| Metadata storage | localStorage |
| PWA | Service Worker + Web Manifest |
| Fonts | Inter (body) + Outfit (display) |

---

## Project Structure

```
RawFoto/
├── index.html              # Entry HTML with PWA meta tags
├── vite.config.js          # Vite + React plugin config
├── tailwind.config.js      # Custom fonts + breakpoints
├── postcss.config.js       # Tailwind v4 PostCSS
├── eslint.config.js        # ESLint flat config
├── package.json
├── public/                 # Static assets (served at root)
│   ├── manifest.json       # Web App Manifest
│   ├── sw.js               # Service Worker (cache-first)
│   ├── favicon.svg         # (unreferenced — see issues)
│   └── icons.svg           # SVG icon sprite
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Root component with routing
│   ├── index.css           # Tailwind import + Google Fonts
│   ├── pages/
│   │   └── LandingPage.jsx # Marketing landing (hero, features, docs)
│   ├── components/
│   │   ├── Navbar.jsx       # Sticky top nav with scroll-to links
│   │   ├── Hero.jsx         # Hero section with viewfinder mockup
│   │   ├── Features.jsx     # Feature grid (2×3)
│   │   ├── PhotoShowcase.jsx# Gallery showcase (Unsplash demo)
│   │   ├── HowItWorks.jsx   # Three-step explainer
│   │   ├── Documentation.jsx# Technical deep-dive sections
│   │   ├── Footer.jsx       # Footer with social links
│   │   ├── CameraView.jsx   # The actual camera UI (big one)
│   │   ├── GalleryView.jsx  # Photo gallery drawer + inspector
│   │   ├── Histogram.jsx    # Live RGB histogram canvas overlay
│   │   ├── TutorialOverlay.jsx# First-run walkthrough
│   │   └── PwaInstallBanner.jsx# Install prompt bottom sheet
│   ├── store/
│   │   ├── store.js         # Redux store config
│   │   └── slices/
│   │       ├── cameraSlice.js  # ISO, shutter, EV, WB, focus state
│   │       ├── gallerySlice.js # Photo metadata list
│   │       └── pwaSlice.js     # Installable / installed flags
│   └── utils/
│       ├── imageDB.js       # IndexedDB CRUD for image blobs
│       ├── dngWriter.js     # (unused) DNG binary generator
│       └── tiffWriter.js    # (unused) TIFF binary generator
└── dist/                    # Built output
```

---

## Getting Started

### Prerequisites

- Node.js 18+ (I used v20 or v22)
- npm or bun

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173` with hot module replacement. Grant camera access when prompted.

### Build

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static file server:

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

Runs ESLint with React hooks and refresh plugins.

---

## How the Capture Pipeline Works

1. **Camera stream** is obtained via `navigator.mediaDevices.getUserMedia()` with ideal 1920×1080 resolution.
2. **Real-time preview** applies CSS filters for EV brightness, focus blur, and white balance tint — no WebGL needed.
3. **On shutter**, a frame is drawn onto an offscreen `<canvas>` at native resolution, cropped to the selected aspect ratio (3:4 or 16:9), and mirrored for front-facing cameras.
4. **The image** is exported as a lossless PNG via `canvas.toDataURL()` → base64 decode → `Blob`.
5. **The Blob** is stored in IndexedDB via `imageDB.js`. Metadata (ISO, shutter, EV, Kelvin, dimensions) is saved to localStorage through Redux.
6. **The gallery** loads Blob URLs on demand and displays them in a responsive grid with full metadata inspection and download/delete actions.

---

## License

MIT — do what you want with it. Built by [Prajwal Raut](https://prajwalr.space/).
