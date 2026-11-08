import { useState } from 'react'
import { useApp } from '../context.jsx'
import { Empty, Modal } from '../components/UI.jsx'
import { Icon } from '../components/Icons.jsx'
import { fmtDate, toISODate } from '../lib/dates.js'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { useToast } from '../hooks/useToast.jsx'

const MOODS = ['🤩', '😊', '😐', '😩', '🤕']
export default function Journal({ navigate }) {
  const { journal, setJournal, segments, done, doneKm, totalKm, itinerary } = useApp()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)
  const { pos } = useGeolocation(open, { enableHighAccuracy: false })
  const today = itinerary?.days.find((d) => d.date.toDateString() === new Date().toDateString())
  const blank = () => ({ id: Date.now(), date: toISODate(new Date()), segId: today?.segments?.[0] || '', text: '', km: today?.km || '', mood: '😊', pos: null })

  const saveEntry = () => {
    const e = { ...edit, pos: edit.pos || (pos ? { lat: pos.lat, lon: pos.lon } : null) }
    setJournal((j) => { const i = j.findIndex((x) => x.id === e.id); return i >= 0 ? j.map((x) => (x.id === e.id ? e : x)) : [e, ...j] })
    setOpen(false); toast('נשמר ביומן')
  }
  const exportText = async () => {
    const t = `יומן המסע שלי בשביל ישראל\n${done.length} מקטעים · ${Math.round(doneKm)} ק"מ מתוך ${Math.round(totalKm)}\n\n` +
      [...journal].sort((a, b) => a.date.localeCompare(b.date)).map((e) => `${e.date} ${e.mood} ${segments.find((s) => s.id === Number(e.segId))?.name_he || ''} ${e.km ? `· ${e.km} ק"מ` : ''}\n${e.text}\n`).join('\n')
    if (navigator.share) { try { await navigator.share({ title: 'יומן שביל ישראל', text: t }); return } catch { /* cancelled */ } }
    await navigator.clipboard?.writeText(t); toast('הועתק ללוח')
  }
  const pct = totalKm ? Math.round((doneKm / totalKm) * 100) : 0

  return (
    <div className="page stack">
      <div className="row between"><h2 className="section-title"><Icon name="journal" />יומן המסע</h2><div className="row" style={{ gap: 6 }}><button className="btn btn--sm" onClick={exportText}><Icon name="share" size={16} /></button><button className="btn btn--primary btn--sm" onClick={() => { setEdit(blank()); setOpen(true) }}>+ רשומה</button></div></div>
      <div className="card">
        <div className="row between"><span className="bold">ההתקדמות שלי</span><span>{pct}%</span></div>
        <div className="progress mt"><div style={{ width: pct + '%' }} /></div>
        <p className="small muted mt">{done.length} מקטעים · {Math.round(doneKm)} מתוך {Math.round(totalKm)} ק"מ · {journal.length} רשומות</p>
        {pct >= 100 && <div className="alert alert--ok mt">🏆 סיימתם את שביל ישראל! ניתן לפנות לחברה להגנת הטבע לקבלת תעודת סיום.</div>}
      </div>
      {journal.length === 0 && <Empty icon="📓" text="עוד אין רשומות. תעדו כל יום – חוויות, אנשים, נקודות מים, טיפים לבאים אחריכם." />}
      {[...journal].sort((a, b) => b.date.localeCompare(a.date)).map((e) => {
        const seg = segments.find((s) => s.id === Number(e.segId))
        return (
          <div key={e.id} className="card" onClick={() => { setEdit(e); setOpen(true) }} style={{ cursor: 'pointer' }}>
            <div className="row between"><span className="bold">{e.mood} {fmtDate(e.date, { year: 'numeric' })}</span>{e.km && <span className="chip">{e.km} ק"מ</span>}</div>
            {seg && <button className="tiny" style={{ background: 'none', border: 0, color: 'var(--primary)', padding: 0 }} onClick={(ev) => { ev.stopPropagation(); navigate(`segments/${seg.id}`) }}>מקטע {seg.id}: {seg.name_he}</button>}
            <p className="small mt" style={{ whiteSpace: 'pre-wrap' }}>{e.text}</p>
            {e.pos && <div className="tiny muted mono ltr mt">📍 {e.pos.lat.toFixed(4)}, {e.pos.lon.toFixed(4)}</div>}
          </div>
        )
      })}
      <Modal open={open} onClose={() => setOpen(false)} title="רשומה ביומן">
        {edit && (
          <div className="stack">
            <div className="grid-2">
              <div className="field"><label>תאריך</label><input className="input" type="date" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></div>
              <div className="field"><label>ק"מ היום</label><input className="input" type="number" value={edit.km} onChange={(e) => setEdit({ ...edit, km: e.target.value })} /></div>
            </div>
            <div className="field"><label>מקטע</label><select className="select" value={edit.segId} onChange={(e) => setEdit({ ...edit, segId: e.target.value })}><option value="">—</option>{segments.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.name_he}</option>)}</select></div>
            <div className="field"><label>איך היה?</label><div className="row">{MOODS.map((m) => <button key={m} className={`chip chip--btn ${edit.mood === m ? 'active' : ''}`} style={{ fontSize: 20 }} onClick={() => setEdit({ ...edit, mood: m })}>{m}</button>)}</div></div>
            <div className="field"><label>מה קרה היום?</label><textarea className="textarea" value={edit.text} onChange={(e) => setEdit({ ...edit, text: e.target.value })} placeholder="אנשים שפגשתם, נוף, מים, לינה, מה הייתם עושים אחרת…" /></div>
            <div className="row between">
              <button className="btn btn--ghost btn--sm" style={{ color: 'var(--red)' }} onClick={() => { setJournal((j) => j.filter((x) => x.id !== edit.id)); setOpen(false) }}>מחיקה</button>
              <button className="btn btn--primary" onClick={saveEntry}>שמירה</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
