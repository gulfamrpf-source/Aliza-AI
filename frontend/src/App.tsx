import { useEffect, useRef, useState } from 'react'
import { Activity, ArrowDown, ArrowUp, AudioLines, Bot, ChevronDown, CircleHelp, FileText, Globe2, Menu, MessageSquare, Moon, MoreHorizontal, Plus, Search, Settings2, Sparkles, SquarePen, Sun, Trash2, X } from 'lucide-react'

type Message = { id?: number; role: 'user' | 'assistant'; content: string }
type Conversation = { id: string; title: string; updated_at: string }
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [light, setLight] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking'|'online'|'offline'>('checking')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function refreshConversations() {
    try { const r = await fetch(`${API}/api/conversations`); if (!r.ok) throw new Error(); setConversations(await r.json()); setApiStatus('online') }
    catch { setApiStatus('offline') }
  }
  useEffect(() => { void refreshConversations() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  async function openConversation(id: string) {
    setActiveId(id); setMobileSidebar(false)
    try { const r = await fetch(`${API}/api/conversations/${id}/messages`); if (!r.ok) throw new Error(); setMessages(await r.json()) }
    catch { setMessages([]) }
  }
  function newChat() { setActiveId(null); setMessages([]); setInput(''); setMobileSidebar(false); inputRef.current?.focus() }

  async function send(text = input) {
    const value = text.trim(); if (!value || loading) return
    setInput(''); setMessages(prev => [...prev, { role: 'user', content: value }]); setLoading(true)
    try {
      const r = await fetch(`${API}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversation_id: activeId, message: value }) })
      const data = await r.json(); if (!r.ok) throw new Error(data.detail || 'The AI service is unavailable.')
      setActiveId(data.conversation_id); setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]); await refreshConversations()
    } catch (e) { setMessages(prev => [...prev, { role: 'assistant', content: `I couldn't reach the Alizariz AI backend. ${e instanceof Error ? e.message : 'Please check that the backend is running.'}` }]) }
    finally { setLoading(false); inputRef.current?.focus() }
  }
  async function removeConversation(id: string) {
    if (!confirm('Delete this conversation?')) return
    await fetch(`${API}/api/conversations/${id}`, { method: 'DELETE' }); if (activeId === id) newChat(); await refreshConversations()
  }
  const suggestions = [
    { icon: <Sparkles size={17}/>, title: 'Brainstorm ideas', sub: 'Explore a new project or solve a problem', prompt: 'Help me brainstorm ideas for a new project.' },
    { icon: <FileText size={17}/>, title: 'Write something', sub: 'Draft, rewrite or improve your text', prompt: 'Help me write a clear and professional document.' },
    { icon: <Globe2 size={17}/>, title: 'Learn something', sub: 'Understand a topic step by step', prompt: 'Teach me an interesting topic step by step.' },
    { icon: <Activity size={17}/>, title: 'Solve a problem', sub: 'Break a challenge into practical steps', prompt: 'Help me solve a problem by breaking it into steps.' },
  ]
  return <div className={`app ${light ? 'light' : ''}`}>
    {mobileSidebar && <button className="scrim" onClick={() => setMobileSidebar(false)} aria-label="Close menu"/>}
    <aside className={`sidebar ${mobileSidebar ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark">A<span>.</span></div><div><b>Alizariz</b><small>ARTIFICIAL INTELLIGENCE</small></div><button className="icon-btn mobile-close" onClick={() => setMobileSidebar(false)}><X size={18}/></button></div>
      <button className="new-chat" onClick={newChat}><SquarePen size={17}/> <span>New chat</span><span className="shortcut">⌘ K</span></button>
      <div className="side-tools"><button><Search size={16}/> Search chats</button><button><Sparkles size={16}/> Explore tools <span className="soon">SOON</span></button></div>
      <div className="history-head"><span>YOUR CHATS</span><button className="icon-btn" onClick={refreshConversations}><MoreHorizontal size={17}/></button></div>
      <div className="history-list">{conversations.map(c => <div className={`history-item ${activeId === c.id ? 'selected' : ''}`} key={c.id}><button onClick={() => openConversation(c.id)}><MessageSquare size={15}/><span>{c.title}</span></button><button className="delete-chat" title="Delete chat" onClick={() => removeConversation(c.id)}><Trash2 size={14}/></button></div>)}{!conversations.length && <p className="empty-history">Your conversations will appear here.</p>}</div>
      <div className="sidebar-bottom"><div className="free-card"><div className="free-icon"><Sparkles size={16}/></div><div><b>Alizariz AI Preview</b><small>Free access · Early development</small></div><span className="live-dot"/></div><button className="profile"><div className="avatar">G</div><div><b>Guest user</b><small>Local preview</small></div><MoreHorizontal size={18}/></button></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="top-left"><button className="icon-btn menu-toggle" onClick={() => setMobileSidebar(true)}><Menu size={19}/></button><div className="model-select"><span className="model-dot"/> Alizariz Assistant <ChevronDown size={15}/></div><span className="preview-tag">PREVIEW</span></div><div className="top-actions"><span className={`connection ${apiStatus}`}><i/>{apiStatus === 'online' ? 'System online' : apiStatus === 'offline' ? 'Backend offline' : 'Connecting'}</span><button className="icon-btn" title="Toggle theme" onClick={() => setLight(!light)}>{light ? <Moon size={18}/> : <Sun size={18}/>}</button><button className="icon-btn" title="Settings"><Settings2 size={18}/></button></div></header>
      <section className="chat-area">
        {messages.length === 0 ? <div className="welcome"><div className="welcome-orb"><div className="orb-core"><span>A</span></div><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><Sparkles className="orb-spark" size={19}/></div><div className="eyebrow"><span/> YOUR AI, YOUR POSSIBILITIES</div><h1>What can I help<br/><em>you with today?</em></h1><p className="welcome-copy">Welcome to Alizariz AI. Think, create, explore and bring your ideas to life.</p><div className="suggestions">{suggestions.map(s => <button className="suggestion" key={s.title} onClick={() => send(s.prompt)}><span className="suggestion-icon">{s.icon}</span><span><b>{s.title}</b><small>{s.sub}</small></span><ArrowUp size={15} className="suggestion-arrow"/></button>)}</div></div> : <div className="messages">{messages.map((m,i) => <div className={`message-row ${m.role}`} key={`${i}-${m.role}`}><div className="message-avatar">{m.role === 'assistant' ? <div className="mini-mark">A</div> : 'G'}</div><div className="message-content"><div className="message-author">{m.role === 'assistant' ? 'Alizariz AI' : 'You'}</div><div className="message-text">{m.content}</div>{m.role === 'assistant' && <div className="message-tools"><button onClick={() => navigator.clipboard?.writeText(m.content)}>Copy</button><button onClick={() => send('Please expand on your previous answer.')}>Continue</button></div>}</div></div>)}{loading && <div className="message-row assistant"><div className="message-avatar"><div className="mini-mark">A</div></div><div className="message-content"><div className="message-author">Alizariz AI</div><div className="typing"><i/><i/><i/></div></div></div>}<div ref={bottomRef}/></div>}
      </section>
      <footer className="composer-wrap"><div className="composer"><textarea ref={inputRef} rows={1} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey){e.preventDefault(); void send()} }} placeholder="Message Alizariz AI..."/><div className="composer-bottom"><div className="composer-left"><button className="attach-btn" title="Attachments coming soon"><Plus size={18}/></button><span className="composer-hint">AI can make mistakes. Verify important information.</span></div><div className="composer-right"><button className="voice-btn" title="Voice coming soon"><AudioLines size={18}/></button><button className="send-btn" disabled={!input.trim() || loading} onClick={() => void send()}><ArrowUp size={18}/></button></div></div></div><div className="footer-note"><span>ALIZARIZ AI</span><span>·</span><span>YOUR INTELLIGENCE. YOUR WORLD.</span></div></footer>
    </main>
  </div>
}
