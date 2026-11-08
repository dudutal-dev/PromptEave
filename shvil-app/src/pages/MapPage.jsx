import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context.jsx'
import { MapView, BASE_LAYERS } from '../components/MapView.jsx'
import { Icon } from '../components/Icons.jsx'
import { Modal } from '../components/UI.jsx'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { loadTrailGeometry, idbGet, idbDel, TRAIL_KEY } from '../lib/overpass.js'
import { nearestOnLine, nearest, formatKm, bearing, compassLabelLong, lineLength } from '../lib/geo.js'
import { linesToGPX, download } from '../lib/gpx.js'
import { useToast } from '../hooks/useToast.jsx'
import lodging from '../data/lodging.json'
import logistics from '../data/logistics.json'

export default function MapPage({ query }) {
  const { segments, prefs, setPrefs } = useApp()
  const toast = useToast()
  const [gps, setGps] = useState(false)
  const [follow, setFollow] = useState(false)
  const { pos, error } = useGeolocation(gps)
  const [lines, setLines] = useState(null)
  const [status, setStatus] = useState('')
  const [layersOpen, setLayersOpen] = useState(false)
  const [show, setShow] = useState({ camps: true, lodging: false, water: false })
  const relationId = logistics?.navigation?.osm_relation_id

  useEffect(() => { idbGet(TRAIL_KEY).then((d) => d?.lines && setLines(d.lines)) }, [])
  useEffect(() => { if (error) toast(error) }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  const fitTo = useMemo(() => {
    const s = query.seg && segments.find((x) => x.id === Number(query.seg))
    if (s?.start?.lat && s?.end?.lat) return { bounds: [[s.start.lat, s.start.lon], [s.end.lat, s.end.lon]] }
    if (query.lat) return { center: [Number(query.lat), Number(query.lon)], zoom: 14 }
    return null
  }, [query.seg, query.lat, query.lon, segments])

  const pois = useMemo(() => {
    const out = []
    if (show.camps) for (const c of lodging.night_camps || []) out.push({ lat: c.lat, lon: c.lon, icon: '⛺', title: c.name_he, html: `<b>⛺ ${c.name_he}</b><br/>${c.facilities_he || ''}<br/><span style="color:#666">${c.notes_he || ''}</span>` })
    if (show.lodging) for (const c of lodging.paid_lodging || []) if (c.lat) out.push({ lat: c.lat, lon: c.lon, icon: c.type === 'field_school' ? '🏫' : '🏨', title: c.name_he, html: `<b>${c.name_he}</b><br/>${c.type_he || ''} · ${c.price_he || ''}<br/>${c.url ? `<a href="${c.url}" target="_blank">אתר/הזמנה</a>` : ''}` })
    if (show.water) for (const w of logistics?.water?.points || []) if (w.lat) out.push({ lat: w.lat, lon: w.lon, icon: '💧', title: w.name_he, html: `<b>💧 ${w.name_he}</b><br/>${w.notes_he || ''}` })
    return out
  }, [show])

  const info = useMemo(() => {
    if (!pos) return null
    let onTrail = null
    if (lines) {
      let best = { dist: Infinity }
      for (const l of lines) { const r = nearestOnLine(pos, l); if (r.dist < best.dist) best = r }
      onTrail = best
    }
    const pts = segments.flatMap((s) => [{ ...s.start, label: `תחילת מקטע ${s.id} (${s.start?.name_he})` }, { ...s.end, label: `סוף מקטע ${s.id} (${s.end?.name_he})` }]).filter((p) => p.lat)
    const n = nearest(pos, pts)
    const camps = (lodging.night_camps || []).filter((c) => c.lat)
    const nc = camps.length ? nearest(pos, camps) : null
    return { onTrail, n, nc }
  }, [pos, lines, segments])

  const downloadTrail = async () => {
    try {
      setStatus('מוריד תוואי…')
      const d = await loadTrailGeometry({ relationId, force: true, onStatus: setStatus })
      setLines(d.lines); setStatus('')
      toast(`התוואי הורד ונשמר (${Math.round(d.lines.reduce((a, l) => a + lineLength(l), 0))} ק"מ)`)
    } catch (e) { setStatus(''); toast('ההורדה נכשלה – בדקו חיבור לאינטרנט ונסו שוב') }
  }
  const removeTrail = async () => { await idbDel(TRAIL_KEY); setLines(null); toast('התוואי נמחק מהמכשיר') }

  return (
    <div className="page page--full">
      <div className="map-wrap">
        <MapView segments={segments} lines={lines} pois={pois} user={pos} follow={follow} base={prefs.base} fitTo={fitTo} selectedId={query.seg ? Number(query.seg) : null} />
        <div className="map-ctl map-ctl--tr">
          <button className={`mapbtn ${gps ? 'active' : ''}`} onClick={() => { setGps(!gps); setFollow(!gps) }} title="GPS"><Icon name="locate" /></button>
          {gps && <button className={`mapbtn ${follow ? 'active' : ''}`} onClick={() => setFollow(!follow)} title="עקוב אחרי">🎯</button>}
          <button className="mapbtn" onClick={() => setLayersOpen(true)} title="שכבות"><Icon name="layers" /></button>
        </div>
        <div className="map-ctl map-ctl--bl">
          <div className="map-info">
            {status ? <span>{status}</span> : pos && info ? (
              <>
                <div className="bold">📍 {pos.lat.toFixed(5)}, {pos.lon.toFixed(5)} <span className="muted">±{Math.round(pos.accuracy)} מ'</span></div>
                {info.onTrail && <div>מרחק מהשביל: <b>{formatKm(info.onTrail.dist)}</b></div>}
                {info.n && <div>{info.n.point.label}: <b>{formatKm(info.n.dist)}</b> {compassLabelLong(bearing(pos, info.n.point))}</div>}
                {info.nc && <div>⛺ {info.nc.point.name_he}: <b>{formatKm(info.nc.dist)}</b></div>}
                {pos.altitude != null && <div className="tiny muted">גובה {Math.round(pos.altitude)} מ' · מהירות {pos.speed ? (pos.speed * 3.6).toFixed(1) : 0} קמ"ש</div>}
              </>
            ) : (
              <span>{lines ? 'תוואי מלא טעון ✓' : 'מוצג תוואי סכמטי בין נקודות המקטעים – הורידו את התוואי המלא בתפריט השכבות'}</span>
            )}
          </div>
        </div>
      </div>

      <Modal open={layersOpen} onClose={() => setLayersOpen(false)} title="שכבות ומפות">
        <div className="stack">
          <div>
            <div className="bold mb">מפת רקע</div>
            <div className="stack" style={{ gap: 6 }}>
              {Object.entries(BASE_LAYERS).map(([k, v]) => <label key={k} className="row"><input type="radio" name="base" checked={prefs.base === k} onChange={() => setPrefs({ ...prefs, base: k })} />{v.name}</label>)}
            </div>
            <p className="tiny muted mt">מפת הטיולים של ישראל מציגה את סימוני השבילים (אדום/כחול/ירוק/שחור) ואת שביל ישראל. אריחי מפה שנצפו נשמרים לשימוש לא מקוון.</p>
          </div>
          <div>
            <div className="bold mb">נקודות עניין</div>
            <label className="switch"><input type="checkbox" checked={show.camps} onChange={(e) => setShow({ ...show, camps: e.target.checked })} /> ⛺ חניוני לילה</label><br />
            <label className="switch mt"><input type="checkbox" checked={show.lodging} onChange={(e) => setShow({ ...show, lodging: e.target.checked })} /> 🏨 לינה בתשלום / בתי ספר שדה</label><br />
            <label className="switch mt"><input type="checkbox" checked={show.water} onChange={(e) => setShow({ ...show, water: e.target.checked })} /> 💧 נקודות מים</label>
          </div>
          <div>
            <div className="bold mb">תוואי השביל המלא (OpenStreetMap)</div>
            <p className="small muted">הורדה חד-פעמית (כ-2–5MB) של תוואי שביל ישראל כפי שממופה ב-OSM. נשמר במכשיר, מאפשר חישוב מרחק מהשביל ללא אינטרנט.</p>
            <div className="row mt">
              <button className="btn btn--primary btn--sm" onClick={downloadTrail} disabled={!!status}>{lines ? 'רענון התוואי' : 'הורדת התוואי'}</button>
              {lines && <button className="btn btn--sm" onClick={() => { download('israel-national-trail.gpx', linesToGPX(lines)); toast('GPX הורד') }}>ייצוא GPX</button>}
              {lines && <button className="btn btn--ghost btn--sm" onClick={removeTrail}>מחיקה</button>}
            </div>
          </div>
          <div className="alert alert--info small">לניווט שטח אמיתי מומלץ להחזיק גם אפליקציה ייעודית (Israel Hiking Map / עמוד ענן) ומפת סימון שבילים מודפסת. ה-GPS בטלפון תלוי בסוללה ובקליטה.</div>
        </div>
      </Modal>
    </div>
  )
}
