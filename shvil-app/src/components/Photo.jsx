import { useState } from 'react'
import photos from '../data/photos.json'

export function getPhoto(key) { return photos.find((p) => p.key === key) || null }

export function Photo({ photoKey, src, alt, className = '', credit = true, style }) {
  const p = photoKey ? getPhoto(photoKey) : null
  const url = src || p?.image_url
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  if (!url || failed) return <div className={`photo photo--placeholder ${className}`} style={style}>🥾</div>
  return (
    <div className={`photo ${className}`} style={style}>
      <img src={url} alt={alt || p?.place_he || ''} loading="lazy" onError={() => setFailed(true)} onLoad={() => setLoaded(true)} style={{ opacity: loaded ? 1 : 0 }} referrerPolicy="no-referrer" />
      {credit && p && loaded && <div className="photo__credit">{p.author ? `© ${p.author}` : ''} {p.license ? `· ${p.license}` : ''} · Wikimedia Commons</div>}
    </div>
  )
}
