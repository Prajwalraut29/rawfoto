export function createUncompressedTiff(canvas, mimeType = 'image/tiff') {
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const rgba = imgData.data

  const pixelCount = width * height
  const headerSize = 128          // all metadata fits in first 128 bytes
  const imageSize = pixelCount * 3
  const totalSize = headerSize + imageSize

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)

  // ---- TIFF Header ----
  view.setUint16(0, 0x4949, true) // Little-endian
  view.setUint16(2, 42, true)     // Magic
  view.setUint32(4, 8, true)      // IFD at offset 8

  // ---- IFD ----
  view.setUint16(8, 9, true)      // 9 entries

  let tagOffset = 10
  function writeTag(tag, type, count, value) {
    view.setUint16(tagOffset, tag, true)
    view.setUint16(tagOffset + 2, type, true)
    view.setUint32(tagOffset + 4, count, true)
    view.setUint32(tagOffset + 8, value, true)
    tagOffset += 12
  }

  // Sorted by tag ID
  writeTag(256, 4, 1, width)       // ImageWidth
  writeTag(257, 4, 1, height)      // ImageLength
  writeTag(258, 3, 3, 122)         // BitsPerSample → at offset 122
  writeTag(259, 3, 1, 1)           // Compression: none
  writeTag(262, 3, 1, 2)           // PhotometricInterpretation: RGB
  writeTag(273, 4, 1, 128)         // StripOffsets → pixel data at 128
  writeTag(277, 3, 1, 3)           // SamplesPerPixel
  writeTag(278, 4, 1, height)      // RowsPerStrip
  writeTag(279, 4, 1, imageSize)   // StripByteCounts

  // Next IFD offset (0 = no more IFDs)
  view.setUint32(tagOffset, 0, true)   // writes at 118

  // BitsPerSample values (8,8,8) at offset 122
  view.setUint16(122, 8, true)
  view.setUint16(124, 8, true)
  view.setUint16(126, 8, true)

  // ---- Pixel data at offset 128 ----
  const pixelView = new Uint8Array(buffer, 128, imageSize)
  let readIdx = 0, writeIdx = 0
  for (let i = 0; i < pixelCount; i++) {
    pixelView[writeIdx] = rgba[readIdx]       // R
    pixelView[writeIdx + 1] = rgba[readIdx + 1]   // G
    pixelView[writeIdx + 2] = rgba[readIdx + 2]   // B
    readIdx += 4
    writeIdx += 3
  }

  return new Blob([buffer], { type: 'application/octet-stream' })
}