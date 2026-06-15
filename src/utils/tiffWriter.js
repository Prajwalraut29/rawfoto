/**
 * Converts a Canvas element into an uncompressed RGB TIFF image Blob
 * @param {HTMLCanvasElement} canvas
 * @returns {Blob} TIFF image Blob
 */
export function createUncompressedTiff(canvas) {
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const rgba = imgData.data

  const pixelCount = width * height
  const headerSize = 128
  const imageSize = pixelCount * 3
  const totalSize = headerSize + imageSize

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)

  // 1. Header (8 bytes)
  view.setUint16(0, 0x4949, true) // Little-endian 'II'
  view.setUint16(2, 42, true)     // Magic number
  view.setUint32(4, 8, true)      // Offset to first IFD (8)

  // 2. IFD count of tags (2 bytes)
  view.setUint16(8, 9, true)      // 9 entries

  // Helper to write directory entry
  let tagOffset = 10
  function writeTag(tag, type, count, value) {
    view.setUint16(tagOffset, tag, true)
    view.setUint16(tagOffset + 2, type, true)
    view.setUint32(tagOffset + 4, count, true)
    view.setUint32(tagOffset + 8, value, true)
    tagOffset += 12
  }

  // Tags definitions (must be sorted by tag ID ascending!)
  writeTag(256, 4, 1, width)                       // ImageWidth
  writeTag(257, 4, 1, height)                      // ImageLength
  writeTag(258, 3, 3, 118)                         // BitsPerSample (values at offset 118)
  writeTag(259, 3, 1, 1)                           // Compression (1 = none)
  writeTag(262, 3, 1, 2)                           // PhotometricInterpretation (2 = RGB)
  writeTag(273, 4, 1, 128)                         // StripOffsets (pixels start at 128)
  writeTag(277, 3, 1, 3)                           // SamplesPerPixel (3)
  writeTag(278, 4, 1, height)                      // RowsPerStrip
  writeTag(279, 4, 1, imageSize)                   // StripByteCounts

  // Next IFD Offset (4 bytes)
  view.setUint32(tagOffset, 0, true)
  tagOffset += 4 // Should now be at 118

  // BitsPerSample values (3 x SHORT)
  view.setUint16(118, 8, true)
  view.setUint16(120, 8, true)
  view.setUint16(122, 8, true)
  // Padding to align to 128
  view.setUint16(124, 0, true)
  view.setUint16(126, 0, true)

  // 3. Write pixels (RGB bytes) at offset 128
  const pixelView = new Uint8Array(buffer, 128, imageSize)
  let readIdx = 0
  let writeIdx = 0
  for (let i = 0; i < pixelCount; i++) {
    pixelView[writeIdx] = rgba[readIdx]       // Red
    pixelView[writeIdx + 1] = rgba[readIdx + 1] // Green
    pixelView[writeIdx + 2] = rgba[readIdx + 2] // Blue
    readIdx += 4
    writeIdx += 3
  }

  return new Blob([buffer], { type: 'image/tiff' })
}
