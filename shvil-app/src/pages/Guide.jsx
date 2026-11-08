import { useMemo, useState } from 'react'
import { useApp } from '../context.jsx'
import { Acc, Alert, Section, Stat } from '../components/UI.jsx'
import { Photo } from '../components/Photo.jsx'
import { Icon } from '../components/Icons.jsx'
import { HE_MONTHS_SHORT, HE_MONTHS } from '../lib/dates.js'
import { LEVEL_CLS, LEVEL_HE } from '../lib/season.js'
import logistics from '../data/logistics.json'
import lodging from '../data/lodging.json'

const SECTIONS = [
  ['seasons', '☀️', 'עונות ומזג אוויר'], ['water', '💧', 'מים והטמנות'], ['lodging', '🏕️', 'לינה'], ['safety', '🆘', 'בטיחות וחירום'],
  ['gear', '🎒', 'ציוד'], ['budget', '💰', 'תקציב'], ['transport', '🚌', 'תחבורה והצטיידות'], ['nav', '🧭', 'סימון וניווט'], ['faq', '❓', 'שאלות נפוצות'], ['ethics', '🌿', 'טיול אחראי'],
]

export default function Guide({ section = 'seasons', navigate }) {
  const sec = SECTIONS.find((s) => s[0] === section) ? section : 'seasons'
  return (
    <div className="page stack">
      <div className="row" style={{ gap: 6, overflowX: 'auto', flexWrap: 'nowrap', paddingBottom: 4 }}>
        {SECTIONS.map(([id, ico, name]) => <button key={id} className={`chip chip--btn ${sec === id ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }} onClick={() => navigate(`guide/${id}`)}>{ico} {name}</button>)}
      </div>
      {sec === 'seasons' && <Seasons />}
      {sec === 'water' && <Water />}
      {sec === 'lodging' && <Lodging navigate={navigate} />}
      {sec === 'safety' && <Safety />}
      {sec === 'gear' && <Gear />}
      {sec === 'budget' && <Budget />}
      {sec === 'transport' && <Transport />}
      {sec === 'nav' && <NavGuide />}
      {sec === 'faq' && <FAQ />}
      {sec === 'ethics' && <Ethics />}
      <p className="tiny muted">המידע נאסף ממקורות ציבוריים (החברה להגנת הטבע, רשות הטבע והגנים, קהילות השביל ומדריכים) ועלול להשתנות. אמתו לפני היציאה.</p>
    </div>
  )
}

const List = ({ items = [] }) => <ul className="stack" style={{ gap: 6 }}>{items.map((x, i) => <li key={i}>{typeof x === 'string' ? x : x.he || x.note_he || JSON.stringify(x)}</li>)}</ul>

function Seasons() {
  const s = logistics.seasons || {}
  const [col, setCol] = useState('north')
  const cols = { north: 'צפון (ק. שמונה)', center: 'מרכז (ת"א)', beer_sheva: 'באר שבע', mitzpe_ramon: 'מצפה רמון', eilat: 'אילת' }
  return (
    <div className="stack">
      <Photo photoKey="meron" />
      <div className="card"><p>{s.summary_he}</p></div>
      <div className="grid-2">
        {(s.windows || []).map((w, i) => (
          <div key={i} className="card card--flat" style={{ borderColor: 'var(--orange)' }}>
            <div className="bold">{w.name_he}</div>
            <div className="small mt"><b>יציאה:</b> {w.start_he}</div>
            <div className="small"><b>סיום:</b> {w.end_he}</div>
            <p className="small mt">{w.why_he}</p>
            <p className="tiny mt" style={{ color: 'var(--red)' }}>⚠ {w.risks_he}</p>
          </div>
        ))}
      </div>
      <Section title="מפת העונות" icon="sun">
        <div className="card">
          {[['north', 'צפון'], ['center', 'מרכז'], ['negev', 'נגב']].map(([g, n]) => (
            <div key={g} className="row mb" style={{ gap: 4 }}>
              <span className="small" style={{ width: 40 }}>{n}</span>
              {(s.monthly_table || []).map((m) => <div key={m.month} className={`month-cell ${LEVEL_CLS[m.rec?.[g]] || ''}`} style={{ flex: 1 }} title={`${m.name_he}: ${LEVEL_HE[m.rec?.[g]]}`}>{HE_MONTHS_SHORT[m.month - 1]}</div>)}
            </div>
          ))}
          <div className="row tiny muted" style={{ gap: 10 }}><span><span className="month-cell m-ideal" style={{ display: 'inline-block', width: 12, height: 12 }} /> מצוין</span><span><span className="month-cell m-ok" style={{ display: 'inline-block', width: 12, height: 12 }} /> סביר</span><span><span className="month-cell m-hard" style={{ display: 'inline-block', width: 12, height: 12 }} /> קשה</span><span><span className="month-cell m-avoid" style={{ display: 'inline-block', width: 12, height: 12 }} /> להימנע</span></div>
        </div>
      </Section>
      <Section title="טבלת אקלים חודשית">
        <div className="segmented mb" style={{ flexWrap: 'wrap' }}>{Object.entries(cols).map(([k, v]) => <button key={k} className={col === k ? 'active' : ''} onClick={() => setCol(k)}>{v}</button>)}</div>
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>חודש</th><th>מקס׳</th><th>מינ׳</th><th>גשם</th><th>אור</th><th>הערה</th></tr></thead>
            <tbody>{(s.monthly_table || []).map((m) => (
              <tr key={m.month}><td className="bold">{HE_MONTHS[m.month - 1]}</td><td>{m[col]?.hi}°</td><td>{m[col]?.lo}°</td><td>{m[col]?.rain_mm} מ"מ</td><td>{s.daylight_hours?.by_month?.[m.month]} ש׳</td><td className="tiny muted">{m.note_he}</td></tr>
            ))}</tbody>
          </table>
        </div>
      </Section>
      <Acc title="🔥 כללי חום"><List items={s.heat_rules_he} /></Acc>
      <Acc title="🌧️ גשם ושיטפונות"><List items={s.rain_flood_rules_he} /></Acc>
      <Acc title="❄️ שלג"><p>{s.snow_he}</p></Acc>
      <Acc title="🌸 פריחה"><p>{s.wildflowers_he}</p></Acc>
    </div>
  )
}

function Water() {
  const w = logistics.water || {}
  return (
    <div className="stack">
      <Photo photoKey="negev_hiker" />
      <Alert kind="info" icon="water"><b>כמה מים?</b> {w.liters_per_day_he}</Alert>
      <div className="card"><div className="card__title">הכלל: "עד ערד ואחרי ערד"</div><p>{w.split_point_he}</p></div>
      <Section title="איפה צריך להטמין" icon="water">
        {(w.segments_requiring_caching || []).map((s, i) => (
          <div key={i} className="card"><div className="bold">{s.from_he} ← {s.to_he}</div><p className="small mt">{s.note_he}</p></div>
        ))}
      </Section>
      <div className="card"><div className="card__title">חניוני לילה עם מים (דרום)</div><p className="small">{w.night_camps_with_water_south_he}</p><div className="card__title mt">ללא מים</div><p className="small">{w.night_camps_without_water_he}</p></div>
      <Acc title="🛠️ איך מטמינים (בעצמכם)" open><List items={w.caching_howto_he} /></Acc>
      <Acc title="💳 שירותי הטמנה בתשלום">
        <p className="mb">{w.price_range_summary_he}</p>
        {(w.paid_services || []).map((p, i) => <div key={i} className="mb"><b>{p.name_he}</b><div className="tiny">{p.coverage_he} · {p.price_note_he}</div>{p.source && <a className="tiny" href={p.source} target="_blank" rel="noreferrer">מקור</a>}</div>)}
      </Acc>
      <Acc title="⛲ מקורות מים בצפון ובמרכז"><p>{w.north_sources_he}</p></Acc>
      <Alert kind="ok">{w.leave_no_trace_he}</Alert>
    </div>
  )
}

function Lodging({ navigate }) {
  const [tab, setTab] = useState('angels')
  const ta = lodging.trail_angels || {}
  const [region, setRegion] = useState('הכל')
  const camps = lodging.night_camps || []
  const paid = lodging.paid_lodging || []
  const regions = ['הכל', ...new Set(camps.map((c) => (c.region || '').split('/')[0].trim()).filter(Boolean))]
  return (
    <div className="stack">
      <Photo photoKey="night_camp" />
      <div className="segmented" style={{ alignSelf: 'center' }}>{[['angels', '😇 מלאכי שביל'], ['camps', '⛺ חניוני לילה'], ['paid', '🏨 בתשלום'], ['rules', '📜 כללים']].map(([k, v]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{v}</button>)}</div>
      {tab === 'angels' && (
        <div className="stack">
          <div className="card"><p>{ta.description_he}</p></div>
          <Acc title="איפה מוצאים מלאכים (רשימות רשמיות וקהילות)" open>
            <div className="stack" style={{ gap: 6 }}>{(ta.how_to_find || []).map((h, i) => <a key={i} href={h.url} target="_blank" rel="noreferrer" className="small">🔗 {h.name}</a>)}</div>
          </Acc>
          <Acc title="כללי התנהגות אצל מלאך שביל"><List items={ta.etiquette_he} /></Acc>
          <Section title="יישובים עם מסורת אירוח (מצפון לדרום)">
            <div className="stack" style={{ gap: 6 }}>
              {(ta.notable_locations || []).map((l, i) => (
                <div key={i} className="card card--flat" style={{ padding: 12 }}>
                  <div className="row between"><b>{l.settlement_he}</b><span className="tag">{l.region}</span></div>
                  <p className="small muted">{l.note}</p>
                  {l.lat && <button className="btn btn--sm btn--ghost mt" onClick={() => navigate(`map?lat=${l.lat}&lon=${l.lon}`)}>📍 במפה</button>}
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
      {tab === 'camps' && (
        <div className="stack">
          <Alert kind="info" icon="tent">חניוני הלילה של שביל ישראל (רט"ג/קק"ל) הם המקומות היחידים שבהם מותר ללון בשמורות טבע ובנגב. רובם חינם, ללא מתקנים, וחלקם עם ברז מים. הגיעו לפני החשכה.</Alert>
          <div className="row" style={{ gap: 6, overflowX: 'auto', flexWrap: 'nowrap' }}>{regions.map((r) => <button key={r} className={`chip chip--btn ${region === r ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }} onClick={() => setRegion(r)}>{r}</button>)}</div>
          {camps.filter((c) => region === 'הכל' || (c.region || '').startsWith(region)).map((c, i) => (
            <div key={i} className="card">
              <div className="row between"><b>{c.name_he}</b>{c.facilities?.water === true ? <span className="chip" style={{ background: 'var(--primary)', color: '#fff' }}>💧 מים</span> : <span className="chip">ללא מים</span>}</div>
              <div className="tiny muted">{c.region} · ליד {c.nearest_settlement} · {c.cost_he}</div>
              <div className="small mt">{c.facilities_he}</div>
              <p className="small mt">{c.notes_he}</p>
              {c.water_caching && <p className="tiny" style={{ color: 'var(--orange)' }}>הטמנה: {c.water_caching}</p>}
              <div className="row mt" style={{ gap: 6 }}>{c.lat && <button className="btn btn--sm" onClick={() => navigate(`map?lat=${c.lat}&lon=${c.lon}`)}>📍 במפה</button>}{c.source && <a className="btn btn--sm btn--ghost" href={c.source} target="_blank" rel="noreferrer">מקור</a>}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'paid' && (
        <div className="stack">
          {paid.map((p, i) => (
            <div key={i} className="card">
              <div className="row between"><b>{p.name_he}</b><span className="tag">{p.type_he}</span></div>
              <div className="tiny muted">{p.location}</div>
              <div className="small mt">💵 {p.price_he || 'לא פורסם'} {p.price_year ? `(${p.price_year})` : ''}</div>
              {p.notes && <p className="small mt">{p.notes}</p>}
              <div className="row mt" style={{ gap: 6 }}>{p.url ? <a className="btn btn--sm btn--blue" href={p.url} target="_blank" rel="noreferrer">הזמנה / אתר</a> : p.booking_he && <span className="tiny">{p.booking_he}</span>}{p.lat && <button className="btn btn--sm" onClick={() => navigate(`map?lat=${p.lat}&lon=${p.lon}`)}>📍</button>}</div>
            </div>
          ))}
        </div>
      )}
      {tab === 'rules' && <div className="card"><div className="card__title">כללי לינה ואש בשטח</div><List items={lodging.camping_rules_he} /></div>}
    </div>
  )
}

function Safety() {
  const s = logistics.safety || {}
  const em = logistics.emergency_contacts || []
  return (
    <div className="stack">
      <div className="card" style={{ borderColor: 'var(--red)' }}>
        <div className="card__title" style={{ color: 'var(--red)' }}><Icon name="phone" />מספרי חירום</div>
        <div className="stack" style={{ gap: 8 }}>{em.map((c, i) => <div key={i} className="row between" style={{ alignItems: 'flex-start' }}><div className="small"><b>{c.name_he}</b><div className="tiny muted">{c.note_he}</div></div>{/^[\d\-*#\s/]+$/.test(c.number) ? <a className="btn btn--sm" href={`tel:${c.number.replace('*', '%2A')}`} dir="ltr">{c.number}</a> : /^https?:/.test(c.number) ? <a className="btn btn--sm" href={c.number} target="_blank" rel="noreferrer">קישור</a> : <span className="tiny muted" style={{ maxWidth: 140 }}>{c.number}</span>}</div>)}</div>
      </div>
      <Acc title="🌊 שיטפונות" open><p className="mb">{s.flash_floods?.when_he}</p><b>איך בודקים:</b><List items={s.flash_floods?.how_to_check_he} /></Acc>
      <Acc title="🎯 שטחי אש">
        <p className="mb">{s.firing_zones?.rule_he}</p>
        <b>תיאום:</b><List items={s.firing_zones?.coordination_he} />
        <b className="mt" style={{ display: 'block' }}>מקטעים רלוונטיים:</b>
        {(s.firing_zones?.segments_he || []).map((x, i) => <div key={i} className="mt small"><b>{x.segment_he}</b> – {x.note_he}</div>)}
        <p className="mt tiny" style={{ color: 'var(--red)' }}>{s.firing_zones?.sign_he}</p>
      </Acc>
      <Acc title="🥵 חום ומכת חום"><List items={s.heat_he} /></Acc>
      <Acc title="🐍 בעלי חיים"><List items={s.animals_he} /></Acc>
      <Acc title="🛡️ מצב ביטחוני 2024–2026 וקטעי הצפון"><p className="mb">{s.hermon_golan_he}</p><List items={s.security_2024_2026_he} /></Acc>
      <Acc title="👥 קהילות ומקורות מידע"><List items={s.communities_he} /></Acc>
    </div>
  )
}

const DEFAULT_GEAR = [
  { cat: 'נשיאה ולינה', items: ['תרמיל 45–65 ל\' עם חגורת מותן', 'כיסוי גשם לתרמיל / שק פנימי', 'אוהל קל / טארפ (רשת נגד יתושים בצפון)', 'שק שינה (°0 לנגב בחורף, °+7 לאביב)', 'מזרן מתנפח/מתקפל', 'כרית קטנה (אופציונלי)'] },
  { cat: 'מים', items: ['קיבולת 5–6 ליטר (בקבוקים + שלוקר)', 'טבליות / פילטר לטיהור (מעיינות בצפון)', 'ג\'ריקנים/בקבוקים להטמנה (נגב)', 'מלחים / אבקת אלקטרוליטים'] },
  { cat: 'ביגוד', items: ['נעלי הליכה מוכרות (לא חדשות!)', 'סנדלים/כפכפים לערב ולמעברי מים', '2–3 זוגות גרביים (מרינו)', 'חולצה ארוכה בהירה נגד שמש', 'מכנסי הליכה + מכנסיים קצרים', 'פליז / שכבת חום', 'מעיל רוח-גשם', 'כובע רחב שוליים + באף', 'כפפות וכובע צמר (חורף)', 'גרביונים/חזייה ספורטיבית', 'חוטיני / בגד ים (כנרת, אילת)'] },
  { cat: 'ניווט ותקשורת', items: ['טלפון + אפליקציית מפות לא-מקוונת', 'סוללת גיבוי 10,000–20,000mAh + כבלים', 'מפות סימון שבילים מודפסות / ספר השביל', 'מצפן גיבוי', 'פנס ראש + סוללות', 'משרוקית'] },
  { cat: 'בישול ואוכל', items: ['גזייה קטנה + מיכל גז (לקנות בארץ)', 'סיר קטן + כף/מזלג', 'מצית + גפרורים עמידים למים', 'אוכל ל-2–5 ימים (נגב: עד 6)', 'שקיות אשפה (משאירים נקי)'] },
  { cat: 'בריאות והיגיינה', items: ['ערכת עזרה ראשונה: פלסטרים לשלפוחיות, תחבושת אלסטית, משככי כאבים, אנטיהיסטמין', 'קרם הגנה SPF50 + שפתון', 'נייר טואלט + כף חפירה קטנה', 'סבון ביולוגי, מברשת + משחת שיניים', 'תרופות אישיות', 'משחת אנטי-שפשוף / וזלין', 'ג\'ל חיטוי ידיים'] },
  { cat: 'שונות', items: ['מקלות הליכה', 'משקפי שמש', 'סכין רב-שימושית', 'חבל דק / חוטי כביסה + אטבים', 'תעודת זהות, כרטיס אשראי, מזומן', 'כרטיס מנוי רט"ג (אופציונלי, חוסך כניסות)', 'ערכת תיקונים: סרט דביק, חוט ומחט', 'פנקס ועט ליומן'] },
]
function Gear() {
  const { gear, setGear } = useApp()
  const total = DEFAULT_GEAR.reduce((a, c) => a + c.items.length, 0)
  const checked = Object.values(gear).filter(Boolean).length
  const toggle = (k) => setGear({ ...gear, [k]: !gear[k] })
  return (
    <div className="stack">
      <div className="card"><div className="row between"><b>רשימת הציוד שלי</b><span>{checked}/{total}</span></div><div className="progress mt"><div style={{ width: `${(checked / total) * 100}%` }} /></div><p className="tiny muted mt">הסימונים נשמרים במכשיר. משקל יעד ללא מים ואוכל: 7–10 ק"ג. בנגב, עם 6 ליטר מים ואוכל ל-4 ימים, המשקל מגיע ל-15–20 ק"ג.</p></div>
      {DEFAULT_GEAR.map((c) => (
        <div key={c.cat} className="card">
          <div className="card__title">{c.cat}</div>
          {c.items.map((it) => { const k = `${c.cat}:${it}`; return <label key={k} className={`check ${gear[k] ? 'on' : ''}`}><input type="checkbox" checked={!!gear[k]} onChange={() => toggle(k)} /><span>{it}</span></label> })}
        </div>
      ))}
      <Acc title="המלצות ציוד מהמחקר (החברה להגנת הטבע ושביליסטים)"><List items={(logistics.logistics?.gear_list || []).map((g) => g.he || g)} /></Acc>
      <button className="btn btn--ghost btn--sm" onClick={() => setGear({})}>איפוס הרשימה</button>
    </div>
  )
}

function Budget() {
  const b = lodging.budget || {}
  const [days, setDays] = useState(55)
  const [profile, setProfile] = useState(1)
  const prof = b.daily_profiles?.[profile]
  const range = (s = '') => s.split('–').map((x) => parseInt(String(x).replace(/[^\d]/g, ''), 10) || 0)
  const [lo, hi] = prof ? range(prof.total_per_day) : [0, 0]
  return (
    <div className="stack">
      <div className="card stack">
        <div className="field"><label>פרופיל</label><div className="segmented" style={{ flexWrap: 'wrap' }}>{(b.daily_profiles || []).map((p, i) => <button key={i} className={profile === i ? 'active' : ''} onClick={() => setProfile(i)}>{p.profile.split(' (')[0]}</button>)}</div>{prof && <p className="tiny muted">{prof.profile}</p>}</div>
        <div className="field"><label>מספר ימים: <b>{days}</b></label><input className="range" type="range" min={20} max={80} value={days} onChange={(e) => setDays(Number(e.target.value))} /></div>
        <div className="grid-3">
          <Stat value={`₪${(lo * days).toLocaleString()}`} label="מינימום" />
          <Stat value={`₪${(Math.round((lo + hi) / 2) * days).toLocaleString()}`} label="ממוצע" />
          <Stat value={`₪${(hi * days).toLocaleString()}`} label="מקסימום" />
        </div>
        {prof && <table className="table small"><tbody>
          <tr><td>אוכל</td><td>{prof.food} ₪/יום</td></tr><tr><td>לינה</td><td>{prof.lodging} ₪/יום</td></tr><tr><td>הטמנות מים (ממוצע)</td><td>{prof.water_caching_amortized} ₪/יום</td></tr><tr><td>תחבורה</td><td>{prof.transport} ₪/יום</td></tr><tr><td>שונות</td><td>{prof.misc} ₪/יום</td></tr>
        </tbody></table>}
        <p className="tiny muted">{b.assumptions_he}</p>
        <p className="tiny" style={{ color: 'var(--orange)' }}>לא כולל: {b.totals_estimate?.excludes}</p>
      </div>
      <Acc title="פירוט רכיבי העלות">{Object.entries(b.components || {}).map(([k, v]) => <p key={k} className="mb">{v}</p>)}</Acc>
    </div>
  )
}

function Transport() {
  const t = logistics.logistics?.transport || {}, r = logistics.logistics?.resupply || {}, p = logistics.logistics?.pace || {}
  return (
    <div className="stack">
      <Acc title="🚌 הגעה לנקודת ההתחלה בצפון" open><List items={t.to_north_start_he} /></Acc>
      <Acc title="🏁 אילת – סיום / התחלה"><List items={t.from_eilat_he} /></Acc>
      <Alert kind="warn">{t.shabbat_he}</Alert>
      <Section title="נקודות הצטיידות (מצפון לדרום)" icon="flag">
        <p className="small muted mb">{r.note_he}</p>
        <div className="card table-wrap"><table className="table"><thead><tr><th>קטע</th><th>יישובים / חנויות</th></tr></thead><tbody>{(r.points || []).map((x, i) => <tr key={i}><td className="bold">{x.segment_he}</td><td className="small">{x.places_he}</td></tr>)}</tbody></table></div>
        <p className="small mt">{r.mail_drops_he}</p>
      </Section>
      <Section title="קצב ומשך">
        <div className="card stack small"><p><b>קצב יומי:</b> {p.typical_km_per_day_he}</p><p><b>סה"כ ימים:</b> {p.total_days_he}</p><p><b>ימי מנוחה:</b> {p.rest_days_he}</p><p><b>חלוקה למקטעים:</b> {p.segments_he}</p></div>
      </Section>
      <Acc title="🎒 תרבות השביל"><List items={logistics.logistics?.culture_he} /></Acc>
    </div>
  )
}

function NavGuide() {
  const n = logistics.navigation || {}
  return (
    <div className="stack">
      <Photo photoKey="trail_marker" />
      <div className="card">
        <div className="row" style={{ gap: 14 }}>
          <span className="blaze" style={{ width: 40, height: 60 }}><span className="w" /><span className="b" /><span className="o" /></span>
          <div><div className="bold">סימון שביל ישראל</div><p className="small">{n.marking_he}</p></div>
        </div>
        <Alert kind="info"><b>כלל הכיוון:</b> {n.direction_rule_he}</Alert>
        <p className="small mt">{n.trail_markers_general_he}</p>
      </div>
      <Section title="אפליקציות ומפות">
        {(n.apps || []).map((a, i) => <div key={i} className="card"><b>{a.name_he}</b><p className="small mt">{a.note_he}</p>{a.url && <a className="tiny" href={a.url} target="_blank" rel="noreferrer">{a.url}</a>}</div>)}
      </Section>
      <Alert kind="warn">{n.offline_advice_he}</Alert>
    </div>
  )
}

function FAQ() {
  const [q, setQ] = useState('')
  const list = useMemo(() => (logistics.faq || []).filter((f) => !q || (f.q_he + f.a_he).includes(q)), [q])
  return (
    <div className="stack">
      <input className="input" placeholder="חיפוש בשאלות…" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((f, i) => <Acc key={i} title={f.q_he}><p>{f.a_he}</p></Acc>)}
    </div>
  )
}

function Ethics() {
  const r = logistics.responsible || {}
  return (
    <div className="stack">
      <Acc title="🌿 לא משאירים עקבות" open><List items={r.leave_no_trace_he} /></Acc>
      <Acc title="🔥 כללי אש"><List items={r.fire_rules_he} /></Acc>
      <Acc title="🐕 כלבים בשביל"><p>{r.dogs_he}</p></Acc>
      <Acc title="🕯️ שבת וחגים"><p>{r.shabbat_holidays_he}</p></Acc>
      <Acc title="🕌 אתרים דתיים ויישובים"><p>{r.religious_sites_he}</p></Acc>
    </div>
  )
}
