/**
 * imageDB.js — IndexedDB store for captured image blobs.
 *
 * Why IndexedDB instead of localStorage?
 * - localStorage has a hard ~5 MB quota per origin (often less on Android).
 * - A single full-resolution PNG frame can exceed that limit, causing the image
 *   to be silently truncated or fail to load entirely.
 * - IndexedDB has no practical size limit (quota is a percentage of free disk
 *   space) and stores binary Blobs natively — no base64 overhead.
 */

const DB_NAME = 'rawfoto_images'
const STORE_NAME = 'images'
const DB_VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME) // keyed by photo id
      }
    }

    request.onsuccess = (e) => resolve(e.target.result)
    request.onerror = (e) => reject(e.target.error)
  })
}

/** Save a Blob (or File) under the given key. */
export async function saveImageBlob(id, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

/** Retrieve a Blob by key. Returns null if not found. */
export async function getImageBlob(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(id)
    req.onsuccess = (e) => resolve(e.target.result ?? null)
    req.onerror = (e) => reject(e.target.error)
  })
}

/** Delete a single entry by key. */
export async function deleteImageBlob(id) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

/** Delete ALL stored images (used by clearGallery). */
export async function clearAllImageBlobs() {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}
