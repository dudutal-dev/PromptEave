import { useEffect, useState } from 'react'
import { useApp } from '../context.jsx'
import { Photo } from '../components/Photo.jsx'
import { Stat, Section, Alert } from '../components/UI.jsx'
import { Icon } from '../components/Icons.jsx'
import { fmtDate, HE_MONTHS } from '../lib/dates.js'
import { MONTHS, LEVEL_CLS, LEVEL_HE } from '../lib/season.js'
import { fetchForecast, wmoText, heatRisk } from '../lib/weather.js'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { nearest } from '../lib/geo.js'

export default function Home({ navigate }) {
  const { segments, meta, itinerary, done, totalKm, doneKm, plan } = useApp()
  const today = new Date()
  const todayDay = itinerary?.days.find((d) => d.date.toDateString() === today.toDateString())
  const nextDay = itinerary?.days.find((d) => d.date >= today && !d.rest)
  const pct = totalKm ? Math.round((doneKm / totalKm) * 100) : 0
  const month = today.getMonth()

  return (
    <div className="page stack">
      <div className="hero">
        <Photo photoKey="hero" credit={false} className="" style={{ position: 'absolute', inset: 0, aspectRatio: 'auto', borderRadius: 0 }} />
        <div className="hero__overlay" />
        <div className="hero__content">
          <h1>שביל ישראל</h1>
          <p>מדן ועד אילת · {meta.total_length_km || '~1,050'} ק"מ · {segments.length} מקטעים · מסע של חיים</p>
        </div>
      </div>

      <div className="grid-3">
        <Stat value={`${Math.round(totalKm)}`} label='ק"מ בשביל' />
        <Stat value={segments.length} label="מקטעים" />
        <Stat value={`${pct}%`} label="הושלם על ידך" />
      </div>
      {done.length > 0 && <div className="progress"><div style={{ width: pct + '%' }} /></div>}

      {itinerary ? (
        <div className="card">
          <div className="card__title"><Icon name="plan" />המסע שלי</div>
          <p className="small muted">{fmtDate(itinerary.summary.startDate)} → {fmtDate(itinerary.summary.endDate)} · {itinerary.summary.days} ימים · {plan.direction === 'sobo' ? 'צפון→דרום' : 'דרום→צפון'}</p>
          {todayDay ? (
            <div className="mt">
              <div className="bold">היום (יום {todayDay.day}): {todayDay.rest ? 'יום מנוחה 😌' : todayDay.title}</div>
              {!todayDay.rest && <div className="small muted">{todayDay.km} ק"מ · לינה: {todayDay.overnight}</div>}
              {todayDay.notes?.slice(0, 2).map((n, i) => <div key={i} className="small" style={{ color: 'var(--orange)' }}>⚠ {n}</div>)}
            </div>
          ) : nextDay ? (
            <div className="mt small">היום הבא במסלול: <b>{nextDay.title}</b> ב-{fmtDate(nextDay.date)}</div>
          ) : null}
          <div className="row mt">
            <button className="btn btn--primary btn--sm" onClick={() => navigate('plan')}>לתוכנית המלאה</button>
            {todayDay && !todayDay.rest && <button className="btn btn--sm" onClick={() => navigate(`segments/${todayDay.segments[0]}`)}>פרטי המקטע</button>}
          </div>
        </div>
      ) : (
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--blue-deep), #1d4ed8)', color: '#fff', border: 0 }}>
          <div className="card__title">עוד לא תכננת מסע?</div>
          <p className="small" style={{ opacity: 0.9 }}>בחרו כיוון, תאריך וקצב – והאפליקציה תבנה לכם לו"ז יומי עם לינה, מים ואזהרות עונתיות.</p>
          <button className="btn btn--primary mt" onClick={() => navigate('plan')}>בואו נתכנן 🥾</button>
        </div>
      )}

      <WeatherCard segments={segments} />

      <Section title="עונות: מה המצב החודש?" icon="sun">
        <div className="card">
          <div className="grid-3">
            {[['north', 'צפון'], ['center', 'מרכז'], ['negev', 'נגב']].map(([g, name]) => (
              <div key={g} className="stat">
                <div className={`month-cell ${LEVEL_CLS[MONTHS[g][month]]}`} style={{ aspectRatio: 'auto', padding: '6px 0', marginBottom: 6 }}>{LEVEL_HE[MONTHS[g][month]]}</div>
                <div className="stat__label">{name} · {HE_MONTHS[month]}</div>
              </div>
            ))}
          </div>
          <button className="btn btn--ghost btn--sm mt" onClick={() => navigate('guide/seasons')}>לטבלת העונות המלאה ←</button>
        </div>
      </Section>

      <Section title="קיצורי דרך">
        <div className="grid-2">
          {[
            ['map', '🗺️', 'מפה ו-GPS', 'תוואי השביל, מיקומך וחניוני לילה'],
            ['nav', '🧭', 'מצפן וניווט', 'כיוון, מרחק ליעד, זריחה ושקיעה'],
            ['guide/lodging', '🏕️', 'לינה', 'מלאכי שביל, חניוני לילה ואכסניות'],
            ['guide/water', '💧', 'מים והטמנות', 'כמה, איפה ואיך מטמינים'],
            ['guide/gear', '🎒', 'ציוד', 'רשימת ציוד אינטראקטיבית'],
            ['guide/safety', '🆘', 'בטיחות', 'שיטפונות, שטחי אש, חירום'],
          ].map(([to, ico, t, s]) => (
            <button key={to} className="card" style={{ textAlign: 'start', cursor: 'pointer' }} onClick={() => navigate(to)}>
              <div style={{ fontSize: 26 }}>{ico}</div>
              <div className="bold">{t}</div>
              <div className="tiny muted">{s}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="רגעים מהשביל" icon="camera">
        <div className="grid-2">
          {['meron', 'arbel', 'ramon', 'timna'].map((k) => <Photo key={k} photoKey={k} />)}
        </div>
      </Section>
      {meta.sources && <p className="tiny muted">מקורות המידע: {meta.sources.slice(0, 3).map((s) => s.name || s).join(' · ')} ועוד. מומלץ לאמת פרטים מול המפות והאתרים הרשמיים לפני היציאה.</p>}
    </div>
  )
}

function WeatherCard({ segments }) {
  const { pos } = useGeolocation(true, { enableHighAccuracy: false, maximumAge: 600000 })
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [place, setPlace] = useState(null)
  useEffect(() => {
    const target = pos || { lat: 31.78, lon: 35.2 } // Jerusalem fallback
    const n = nearest(target, segments.filter((s) => s.start?.lat).map((s) => ({ ...s.start, seg: s })))
    setPlace(pos ? (n ? `ליד ${n.point.name_he}` : 'מיקומך') : 'ירושלים (ברירת מחדל)')
    fetchForecast(target.lat, target.lon, 4).then(setData).catch(() => setErr('אין חיבור לשרת מזג האוויר'))
  }, [pos?.lat != null, segments]) // eslint-disable-line react-hooks/exhaustive-deps
  if (err) return null
  if (!data) return <div className="card small muted">טוען תחזית…</div>
  const c = data.current, d = data.daily
  const risk = heatRisk(c.apparent_temperature, c.uv_index)
  return (
    <div className="card">
      <div className="card__title">{wmoText(c.weather_code)[1]} מזג אוויר · <span className="small muted">{place}</span></div>
      <div className="row between">
        <div><span className="gauge">{Math.round(c.temperature_2m)}°</span> <span className="small muted">מורגש {Math.round(c.apparent_temperature)}° · רוח {Math.round(c.wind_speed_10m)} קמ"ש · UV {c.uv_index}</span></div>
      </div>
      {risk && <div className={`alert ${risk.cls} mt small`}>{risk.label}</div>}
      <div className="row mt" style={{ gap: 6 }}>
        {d.time.map((t, i) => (
          <div key={t} className="stat" style={{ flex: 1, padding: '6px 4px' }}>
            <div className="tiny muted">{i === 0 ? 'היום' : fmtDate(t, { weekday: 'short', day: undefined, month: undefined })}</div>
            <div>{wmoText(d.weather_code[i])[1]}</div>
            <div className="small"><b>{Math.round(d.temperature_2m_max[i])}°</b> / {Math.round(d.temperature_2m_min[i])}°</div>
            {d.precipitation_probability_max[i] > 20 && <div className="tiny" style={{ color: 'var(--primary)' }}>☔ {d.precipitation_probability_max[i]}%</div>}
          </div>
        ))}
      </div>
      <p className="tiny muted mt">מקור: Open-Meteo. בחורף יש לבדוק גם אזהרות שיטפונות של השירות המטאורולוגי.</p>
    </div>
  )
}
