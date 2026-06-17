export function createMinimalDng(canvas) {
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const rgba = imgData.data

  const pixelCount = width * height
  const imageSize = pixelCount * 3

  const tagCount = 14
  const ifdStart = 8
  const ifdSize = 2 + tagCount * 12 + 4

  let dataCursor = ifdStart + ifdSize

  const bitsPerSampleOffset = dataCursor; dataCursor += 6
  const dngVersionOffset = dataCursor; dataCursor += 4
  const dngBackwardVersionOffset = dataCursor; dataCursor += 4
  const cameraModelStr = 'RawFoto'
  const cameraModelOffset = dataCursor; dataCursor += cameraModelStr.length + 1
  const colorMatrix1Offset = dataCursor; dataCursor += 72
  const asShotNeutralOffset = dataCursor; dataCursor += 24

  const pixelDataOffset = dataCursor
  const totalSize = pixelDataOffset + imageSize

  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)

  view.setUint16(0, 0x4949, true)
  view.setUint16(2, 42, true)
  view.setUint32(4, ifdStart, true)

  view.setUint16(8, tagCount, true)

  let tagOffset = 10
  function writeTag(tag, type, count, valueOrOffset) {
    view.setUint16(tagOffset, tag, true)
    view.setUint16(tagOffset + 2, type, true)
    view.setUint32(tagOffset + 4, count, true)
    view.setUint32(tagOffset + 8, valueOrOffset, true)
    tagOffset += 12
  }

  writeTag(256, 4, 1, width)
  writeTag(257, 4, 1, height)
  writeTag(258, 3, 3, bitsPerSampleOffset)
  writeTag(259, 3, 1, 1)
  writeTag(262, 3, 1, 34892)
  writeTag(273, 4, 1, pixelDataOffset)
  writeTag(277, 3, 1, 3)
  writeTag(278, 4, 1, height)
  writeTag(279, 4, 1, imageSize)

  writeTag(50706, 1, 4, dngVersionOffset)
  writeTag(50707, 1, 4, dngBackwardVersionOffset)
  writeTag(50708, 2, cameraModelStr.length + 1, cameraModelOffset)
  writeTag(50721, 10, 9, colorMatrix1Offset)
  writeTag(50728, 10, 3, asShotNeutralOffset)
  writeTag(50778, 3, 1, 21)

  view.setUint32(tagOffset, 0, true)

  view.setUint16(bitsPerSampleOffset, 8, true)
  view.setUint16(bitsPerSampleOffset + 2, 8, true)
  view.setUint16(bitsPerSampleOffset + 4, 8, true)

  view.setUint8(dngVersionOffset, 1)
  view.setUint8(dngVersionOffset + 1, 4)
  view.setUint8(dngVersionOffset + 2, 0)
  view.setUint8(dngVersionOffset + 3, 0)

  view.setUint8(dngBackwardVersionOffset, 1)
  view.setUint8(dngBackwardVersionOffset + 1, 4)
  view.setUint8(dngBackwardVersionOffset + 2, 0)
  view.setUint8(dngBackwardVersionOffset + 3, 0)

  for (let i = 0; i < cameraModelStr.length; i++) {
    view.setUint8(cameraModelOffset + i, cameraModelStr.charCodeAt(i))
  }
  view.setUint8(cameraModelOffset + cameraModelStr.length, 0)

  const colorMatrix = [
    4360747, 10000000,  3850649, 10000000,  1430804, 10000000,
    2225045, 10000000,  7168786, 10000000,   606169, 10000000,
     139322, 10000000,   971045, 10000000,  7141733, 10000000,
  ]
  for (let i = 0; i < colorMatrix.length; i += 2) {
    const off = colorMatrix1Offset + i * 4
    view.setInt32(off, colorMatrix[i], true)
    view.setInt32(off + 4, colorMatrix[i + 1], true)
  }

  for (let i = 0; i < 3; i++) {
    const off = asShotNeutralOffset + i * 8
    view.setInt32(off, 1, true)
    view.setInt32(off + 4, 3, true)
  }

  const pixelView = new Uint8Array(buffer, pixelDataOffset, imageSize)
  let readIdx = 0, writeIdx = 0
  for (let i = 0; i < pixelCount; i++) {
    pixelView[writeIdx] = rgba[readIdx]
    pixelView[writeIdx + 1] = rgba[readIdx + 1]
    pixelView[writeIdx + 2] = rgba[readIdx + 2]
    readIdx += 4
    writeIdx += 3
  }

  return new Blob([buffer], { type: 'application/octet-stream' })
}
