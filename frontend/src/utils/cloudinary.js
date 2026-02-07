function isCloudinaryImageUrl(url) {
  return (
    typeof url === 'string' &&
    url.includes('res.cloudinary.com') &&
    url.includes('/image/upload/')
  )
}

function TransformIntoCloudinaryUrl(url, transform) {
  if (!isCloudinaryImageUrl(url) || !transform) return url

  const marker = '/image/upload/'
  const index = url.indexOf(marker)
  if (index === -1) return url

  const prefix = url.slice(0, index + marker.length)
  const rest = url.slice(index + marker.length)

  return `${prefix}${transform}/${rest}`
}

export function cloudinaryCoverUrl(url, { w, h }) {
  if (!isCloudinaryImageUrl(url)) return url

  const width = Number(w)
  if (!Number.isFinite(width)) return url

  const transform = [
    'f_auto',
    'q_auto',
    'fl_progressive',
    'c_scale',
    `w_${width}`,
  ].join(',')

  return TransformIntoCloudinaryUrl(url, transform)
}

export function cloudinaryCoverSrcSet(url, variants) {
  if (!isCloudinaryImageUrl(url)) return undefined
  if (!Array.isArray(variants) || variants.length === 0) return undefined

  const parts = variants
    .map(({ w, h }) => {
      const width = Number(w)
      if (!Number.isFinite(width)) return null
      return `${cloudinaryCoverUrl(url, { w: width })} ${width}w`
    })
    .filter(Boolean)

  return parts.length ? parts.join(', ') : undefined
}