import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, ArrowRight, RefreshCw, CheckCircle2, Circle, Clock3 } from 'lucide-react'

type Status = 'todo' | 'doing' | 'done'
type Card = { id: string; title: string; status: Status; created_at?: string }
const API = (import.meta.env.VITE_API_URL || 'https://kanban-fullstack-1-f6v0.onrender.com').replace(/\/$/, '')
const columns: { key: Status; label: string; icon: typeof Circle; hint: string }[] = [
  { key: 'todo', label: 'To do', icon: Circle, hint: 'Ready when you are' },
  { key: 'doing', label: 'Doing', icon: Clock3, hint: 'Work in progress' },
  { key: 'done', label: 'Done', icon: CheckCircle2, hint: 'Nicely finished' },
]

export default function App() {
  const [cards, setCards] = useState<Card[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
    if (!res.ok) {
      let message = `Request failed (${res.status})`
      try { const data = await res.json(); message = data.detail || message } catch {}
      throw new Error(message)
    }
    return res.status === 204 ? null : res.json()
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true); setError('')
    try { setCards(await request('/api/cards')) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load cards') }
    finally { setLoading(false) }
  }, [request])

  useEffect(() => { void refresh() }, [refresh])

  async function addCard(e: FormEvent) {
    e.preventDefault()
    const clean = title.trim()
    if (!clean || busy) return
    setBusy(true); setError('')
    try {
      const created = await request('/api/cards', { method: 'POST', body: JSON.stringify({ title: clean }) })
      setCards(prev => [created, ...prev]); setTitle('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not add card') }
    finally { setBusy(false) }
  }

  async function move(card: Card, status: Status) {
    if (card.status === status || busy) return
    setBusy(true); setError('')
    try {
      const updated = await request(`/api/cards/${card.id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setCards(prev => prev.map(c => c.id === card.id ? updated : c))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not move card') }
    finally { setBusy(false) }
  }

  async function remove(card: Card) {
    if (busy) return
    setBusy(true); setError('')
    try {
      await request(`/api/cards/${card.id}`, { method: 'DELETE' })
      setCards(prev => prev.filter(c => c.id !== card.id))
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not delete card') }
    finally { setBusy(false) }
  }

  return <main className="page">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">K</span><span>kanban<span className="brand-dot">.</span></span></div>
      <div className="top-meta"><span className="status-dot" /> Workspace <span className="avatar">U</span></div>
    </header>
    <section className="intro">
      <div><p className="eyebrow">YOUR WORKSPACE</p><h1>Make progress,<br/><span>one card at a time.</span></h1><p className="sub">A simple place to plan, focus, and finish what matters.</p></div>
      <div className="stats"><div><strong>{cards.length}</strong><span>Total tasks</span></div><div><strong>{cards.filter(c=>c.status==='done').length}</strong><span>Completed</span></div></div>
    </section>
    <form className="add-form" onSubmit={addCard}>
      <Plus size={20}/><input aria-label="New task" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add a task to your board…" maxLength={200}/>
      <button type="submit" disabled={!title.trim() || busy}>{busy ? 'Working…' : 'Add task'}</button>
    </form>
    {error && <div className="error" role="alert">{error}<button onClick={()=>void refresh()} type="button">Retry</button></div>}
    <div className="board-heading"><h2>My board</h2><button className="refresh" onClick={()=>void refresh()} aria-label="Refresh board" type="button"><RefreshCw size={16}/> Refresh</button></div>
    {loading ? <div className="loading">Loading your board…</div> : <section className="board">
      {columns.map((col, index) => {
        const Icon = col.icon
        const list = cards.filter(c=>c.status===col.key)
        return <section className={`column col-${col.key}`} key={col.key}>
          <div className="column-head"><div className="column-title"><span className="column-icon"><Icon size={17}/></span><h3>{col.label}</h3><span className="count">{list.length}</span></div><p>{col.hint}</p></div>
          <div className="card-list">
            {list.map(card=><article className="task-card" key={card.id}>
              <div className="task-top"><span className="task-label">TASK</span><button className="delete" onClick={()=>void remove(card)} aria-label={`Delete ${card.title}`} type="button"><Trash2 size={15}/></button></div>
              <p className="task-title">{card.title}</p>
              <div className="task-footer">
                <span className="mini-avatar">U</span>
                <div className="move-actions">
                  {index > 0 && <button title={`Move to ${columns[index-1].label}`} onClick={()=>void move(card, columns[index-1].key)} type="button">←</button>}
                  {index < columns.length-1 && <button title={`Move to ${columns[index+1].label}`} onClick={()=>void move(card, columns[index+1].key)} type="button"><ArrowRight size={14}/></button>}
                </div>
              </div>
            </article>)}
            {!list.length && <div className="empty"><span>✦</span><p>No tasks here yet</p><small>{col.key==='todo'?'Add a task above to get started.':'Move a card here when its status changes.'}</small></div>}
          </div>
        </section>
      })}
    </section>}
    <footer>Kanban workspace <span>·</span> Stay focused, keep moving.</footer>
  </main>
}
