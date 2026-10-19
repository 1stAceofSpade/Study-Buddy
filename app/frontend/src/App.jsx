import { useCallback, useEffect, useRef, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  const body = await response.json()
  if (!response.ok) {
    const error = new Error(body.detail || 'The request could not be completed')
    error.status = response.status
    throw error
  }
  return body
}

function Icon({ name, size = 20, className = '' }) {
  const shapes = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5M8.5 9.5l4.5 4.5m0-4.5L8.5 14" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></>,
    play: <path d="m8 5 12 7-12 7z" />,
    pause: <><path d="M8 5h3v14H8zM15 5h3v14h-3z" /></>,
    reset: <><path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" /><path d="M3 3v5h5" /></>,
    send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9z" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    back: <><path d="M19 12H5m7 7-7-7 7-7" /></>,
    message: <><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></>,
  }
  return (
    <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {shapes[name]}
    </svg>
  )
}

function AmbientGlow() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -left-48 -top-52 h-[34rem] w-[34rem] rounded-full bg-violet-900/30 blur-[120px]" />
      <div className="absolute -bottom-64 -right-48 h-[38rem] w-[38rem] rounded-full bg-violet-900/30 blur-[140px]" />
      <div className="absolute left-[46%] top-[38%] h-72 w-72 rounded-full bg-fuchsia-900/10 blur-[120px]" />
    </div>
  )
}

function Brand({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/15 bg-violet-500/15 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.18)]">
        <Icon name="book" size={20} />
      </div>
      {!compact && (
        <div>
          <p className="text-sm font-semibold tracking-wide text-white">study buddy</p>
          <p className="text-[10px] tracking-[0.17em] text-violet-200/50">FOCUS, TOGETHER</p>
        </div>
      )}
    </div>
  )
}

function AuthView({ onAuthenticated, notice = '' }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await apiRequest('/register', {
          method: 'POST',
          body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
        })
      }
      const session = await apiRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const profile = await apiRequest('/users/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      onAuthenticated(session.access_token, profile)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative z-10 flex min-h-screen w-full items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#140C20]/80 p-7 shadow-[0_0_70px_rgba(139,92,246,0.13)] backdrop-blur-xl sm:p-9">
        <div className="mb-8 flex justify-center"><Brand /></div>
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-white">{mode === 'login' ? 'Welcome back.' : 'Make room to grow.'}</h1>
          <p className="mt-2 text-sm text-slate-400">{mode === 'login' ? 'Sign in to find your study buddies.' : 'Create an account to start studying together.'}</p>
        </div>
        {notice && <p className="mb-4 text-sm text-amber-200">{notice}</p>}
        <form className="space-y-4" onSubmit={submit}>
          {mode === 'register' && (
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-300">Username</span>
              <input autoComplete="username" className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20" maxLength={20} minLength={3} onChange={(event) => setUsername(event.target.value)} required value={username} />
            </label>
          )}
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-300">Email</span>
            <input autoComplete="email" className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-300">Password</span>
            <input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
          </label>
          {error && <p aria-live="polite" className="text-sm text-rose-300">{error}</p>}
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
            {!submitting && <Icon name="arrow" size={16} />}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? 'New to Study Buddy?' : 'Already have an account?'}{' '}
          <button className="font-medium text-violet-300 hover:text-violet-200" onClick={() => { setError(''); setMode(mode === 'login' ? 'register' : 'login') }} type="button">
            {mode === 'login' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </section>
    </main>
  )
}

function SearchDashboard({ token, user, onCreateRoom, onOpenRoom, onLogout }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [rooms, setRooms] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loadingDashboard, setLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState('')
  const [respondingTo, setRespondingTo] = useState(null)

  const fetchDashboard = useCallback(() => Promise.all([
    apiRequest('/users/me/rooms', { headers: { Authorization: `Bearer ${token}` } }),
    apiRequest('/invitations', { headers: { Authorization: `Bearer ${token}` } }),
  ]), [token])

  useEffect(() => {
    let active = true
    fetchDashboard().then(([userRooms, pendingInvitations]) => {
      if (!active) return
      setDashboardError('')
      setRooms(userRooms)
      setInvitations(pendingInvitations)
    }).catch((requestError) => {
      if (active) setDashboardError(requestError.message)
    }).finally(() => {
      if (active) setLoadingDashboard(false)
    })
    return () => { active = false }
  }, [fetchDashboard])

  async function respondToInvitation(invitation, action) {
    setRespondingTo(invitation.id)
    setDashboardError('')
    try {
      await apiRequest(`/invitations/${invitation.id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const [userRooms, pendingInvitations] = await fetchDashboard()
      setRooms(userRooms)
      setInvitations(pendingInvitations)
    } catch (requestError) {
      setDashboardError(requestError.message)
    } finally {
      setRespondingTo(null)
    }
  }

  async function searchUsers(event) {
    event.preventDefault()
    const term = query.trim().replace(/^@/, '')
    if (!term) {
      setResult(null)
      return
    }
    setSearching(true)
    setError('')
    setResult(null)
    try {
      const profile = await apiRequest(`/users/search?user=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (profile.id === user.id) {
        setError('Search for another user to create a study room.')
      } else {
        setResult(profile)
      }
    } catch (requestError) {
      if (requestError.status === 404) setResult(false)
      else setError(requestError.message)
    } finally {
      setSearching(false)
    }
  }

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between">
        <Brand />
        <div className="flex items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
          <span className="max-w-36 truncate text-slate-300">{user.username}</span>
          <button aria-label="Sign out" className="ml-2 text-slate-500 transition hover:text-white" onClick={onLogout} type="button">Sign out</button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col pt-12 sm:pt-16">
        <div className="text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-400/[0.06] px-3 py-1.5 text-[10px] font-medium tracking-[0.18em] text-violet-200/80">
          <Icon name="sparkles" size={14} />
          MAKE SPACE FOR BIG IDEAS
        </div>
        <h1 className="text-balance bg-gradient-to-r from-white via-violet-100 to-violet-300 bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-6xl">
          Better together.
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-slate-400 sm:text-base">
          Find a study buddy and turn a little focus into real momentum.
        </p>

        <form onSubmit={searchUsers} className="mx-auto mt-10 flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-white/5 bg-[#140C20]/65 p-2 pl-4 text-left shadow-[0_0_30px_rgba(139,92,246,0.1)] backdrop-blur-xl transition focus-within:border-violet-400/30 focus-within:ring-2 focus-within:ring-violet-500/30 sm:mt-12 sm:p-2.5 sm:pl-5">
          <Icon name="search" size={20} className="shrink-0 text-violet-300/60" />
          <input
            aria-label="Search for users"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-600 sm:text-base"
            onChange={(event) => {
              setQuery(event.target.value)
              if (!event.target.value.trim()) {
                setResult(null)
                setError('')
              }
            }}
            placeholder="Search by username..."
            value={query}
          />
          <button className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 sm:px-5 sm:text-sm" disabled={searching} type="submit">
            {searching ? 'Searching...' : 'Find a buddy'} {!searching && <Icon name="arrow" size={16} />}
          </button>
        </form>
        {error && <p aria-live="polite" className="mt-4 text-sm text-rose-300">{error}</p>}

        <div aria-live="polite" className="mx-auto mt-8 w-full max-w-3xl">
          {result === false && (
            <div className="mx-auto flex max-w-sm flex-col items-center py-9">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.025] text-violet-300/50">
                <Icon name="search" size={30} />
              </div>
              <p className="text-sm font-medium text-slate-300">User not found</p>
              <p className="mt-1 text-xs text-slate-600">Try checking the username and searching again.</p>
            </div>
          )}
          {result && result !== false && (
            <article className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-violet-500/15 bg-[#140C20]/70 p-7 shadow-[0_0_30px_rgba(139,92,246,0.1)] backdrop-blur-xl sm:flex-row sm:gap-5 sm:p-6 sm:text-left">
              <div className="mb-4 grid h-20 w-20 shrink-0 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-violet-400 to-fuchsia-500 text-xl font-semibold text-white shadow-[0_0_32px_rgba(139,92,246,0.25)] sm:mb-0">
                {result.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-white">{result.username}</h2>
                <p className="mt-1 text-sm text-slate-500">@{result.username}</p>
                <p className="mt-2 text-xs text-violet-200/70">Ready to find a better study rhythm.</p>
              </div>
              <button onClick={() => onCreateRoom(result)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 sm:mt-0 sm:w-auto">
                <Icon name="plus" size={17} /> Add to Group
              </button>
            </article>
          )}
        </div>
        </div>

        <div className="mt-12 space-y-10">
          {dashboardError && <p aria-live="polite" className="rounded-xl border border-rose-400/10 bg-rose-400/[0.04] px-4 py-3 text-sm text-rose-300">{dashboardError}</p>}

          {invitations.length > 0 && (
            <section aria-labelledby="invitations-heading">
              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-medium tracking-[0.16em] text-violet-300/70">YOUR BUDDIES INVITED YOU</p>
                  <h2 className="mt-1 text-lg font-semibold text-white" id="invitations-heading">Room invitations</h2>
                </div>
                <span className="rounded-full border border-violet-300/10 bg-violet-400/[0.06] px-2.5 py-1 text-xs text-violet-200">{invitations.length} pending</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {invitations.map((invitation) => (
                  <article className="rounded-2xl border border-violet-400/15 bg-[#140C20]/65 p-5 shadow-[0_0_30px_rgba(139,92,246,0.08)]" key={invitation.id}>
                    <p className="text-xs text-violet-200/70">@{invitation.inviter_username} invited you</p>
                    <h3 className="mt-2 font-semibold text-white">{invitation.room_topic}</h3>
                    <p className="mt-1 text-xs text-slate-500">#{invitation.room_name}</p>
                    <div className="mt-5 flex gap-2">
                      <button className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50" disabled={respondingTo === invitation.id} onClick={() => respondToInvitation(invitation, 'accept')} type="button">Accept &amp; join</button>
                      <button className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-slate-400 transition hover:text-white disabled:opacity-50" disabled={respondingTo === invitation.id} onClick={() => respondToInvitation(invitation, 'decline')} type="button">Decline</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="rooms-heading">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium tracking-[0.16em] text-violet-300/70">YOUR SHARED SPACES</p>
                <h2 className="mt-1 text-lg font-semibold text-white" id="rooms-heading">My study rooms</h2>
              </div>
              {!loadingDashboard && rooms.length > 0 && <span className="text-xs text-slate-500">{rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}</span>}
            </div>
            {loadingDashboard ? (
              <p className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-8 text-center text-sm text-slate-500">Loading your study rooms...</p>
            ) : rooms.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-8 text-center">
                <p className="text-sm font-medium text-slate-300">No study rooms yet</p>
                <p className="mt-1 text-xs text-slate-600">Create a room with a buddy or accept an invitation to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rooms.map((studyRoom) => (
                  <button className="group rounded-2xl border border-white/[0.07] bg-[#140C20]/65 p-5 text-left shadow-[0_0_30px_rgba(139,92,246,0.06)] transition hover:border-violet-400/25 hover:bg-violet-500/[0.06]" key={studyRoom.id} onClick={() => onOpenRoom(studyRoom)} type="button">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl border border-violet-300/10 bg-violet-500/10 text-violet-200"><Icon name="book" size={18} /></span>
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[10px] text-slate-400">{studyRoom.members.length} / {studyRoom.total_members} members</span>
                    </div>
                    <h3 className="mt-5 font-semibold text-white">{studyRoom.topic}</h3>
                    <p className="mt-1 truncate text-xs text-slate-500">#{studyRoom.name}</p>
                    <p className="mt-4 flex items-center justify-between text-xs text-violet-200/80">
                      <span>{studyRoom.members.filter((member) => member !== user.username).map((member) => `@${member}`).join(', ') || 'Just you'}</span>
                      <Icon className="transition group-hover:translate-x-1" name="arrow" size={15} />
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <footer className="py-5 text-center text-[11px] tracking-wide text-slate-700">A quieter place to get a little further.</footer>
    </main>
  )
}

function RoomModal({ buddy, onClose, onCreate }) {
  const [topic, setTopic] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await onCreate(topic.trim(), password)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-black/40 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section aria-labelledby="room-modal-title" aria-modal="true" className="w-full max-w-md rounded-3xl border border-violet-500/20 bg-[#140C20]/90 p-6 shadow-[0_0_60px_rgba(139,92,246,0.18)] backdrop-blur-2xl sm:p-8" role="dialog">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/15 bg-violet-500/15 text-violet-200">
              <Icon name="users" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white" id="room-modal-title">Configure Study Room</h2>
            <p className="mt-1 text-sm text-slate-500">Create a focused space and send an invitation to @{buddy.username}.</p>
          </div>
          <button aria-label="Close dialog" className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-white/5 hover:text-white" onClick={onClose} type="button">
            <Icon name="close" size={18} />
          </button>
        </div>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-300">Study Topic</span>
            <input autoFocus className="w-full rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20" maxLength={25} minLength={3} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Calculus midterm prep" required value={topic} />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-slate-300">Room Password</span>
            <span className="relative block">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-violet-300/50" name="lock" size={17} />
              <input className="w-full rounded-xl border border-white/[0.08] bg-black/25 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:ring-2 focus:ring-violet-500/20" onChange={(event) => setPassword(event.target.value)} placeholder="Choose a room password" required type="password" value={password} />
            </span>
          </label>
          {error && <p aria-live="polite" className="text-sm text-rose-300">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white" onClick={onClose} type="button">Cancel</button>
            <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" disabled={submitting} type="submit">{submitting ? 'Creating...' : 'Create & Join'} {!submitting && <Icon name="arrow" size={16} />}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function PomodoroTimer({ onComplete, completionStatus }) {
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || seconds === 0) return undefined
    const timeout = window.setTimeout(() => {
      setSeconds(seconds - 1)
      if (seconds === 1) {
        setRunning(false)
        onComplete(25)
      }
    }, 1000)
    return () => window.clearTimeout(timeout)
  }, [onComplete, running, seconds])

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
  const remainder = String(seconds % 60).padStart(2, '0')
  const progress = ((25 * 60 - seconds) / (25 * 60)) * 100

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-300/10 bg-violet-400/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-wide text-violet-200/80"><Icon name="clock" size={14} /> FOCUS SESSION <span className="text-violet-200/40">·</span> 25 MIN</div>
      <div className="relative grid h-64 w-64 place-items-center rounded-full p-2" style={{ background: `conic-gradient(#a78bfa ${progress}%, rgba(255,255,255,0.06) ${progress}% 100%)` }}>
        <div className="grid h-full w-full place-items-center rounded-full border border-white/[0.04] bg-[#11091a] shadow-[inset_0_0_40px_rgba(139,92,246,0.08)]">
          <div>
            <p className="font-mono text-6xl font-light tracking-tight text-white">{minutes}<span className="text-violet-300/70">:</span>{remainder}</p>
            <p className="mt-2 text-xs tracking-[0.18em] text-slate-500">TIME TO FOCUS</p>
          </div>
        </div>
      </div>
      <div className="mt-8 flex items-center gap-3">
        <button className="flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:brightness-110" onClick={() => setRunning((value) => !value)} type="button"><Icon name={running ? 'pause' : 'play'} size={17} /> {running ? 'Pause focus' : 'Start focusing'}</button>
        <button aria-label="Reset timer" className="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.07] hover:text-white" onClick={() => { setRunning(false); setSeconds(25 * 60) }} type="button"><Icon name="reset" size={18} /></button>
      </div>
      <p aria-live="polite" className={`mt-5 text-xs ${completionStatus?.type === 'error' ? 'text-rose-300' : completionStatus?.type === 'success' ? 'text-emerald-300' : 'text-slate-600'}`}>
        {completionStatus?.message || 'One small step at a time. You’ve got this.'}
      </p>
    </div>
  )
}

function TaskList({ roomId, token }) {
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest(`/rooms/${roomId}/tasks`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((roomTasks) => {
      if (active) setTasks(roomTasks)
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [roomId, token])

  async function addTask(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setError('')
    try {
      const task = await apiRequest(`/rooms/${roomId}/tasks`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task: text }),
      })
      setTasks((items) => [...items, task])
      setDraft('')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  async function toggleTask(task) {
    setError('')
    try {
      const updatedTask = await apiRequest(`/rooms/${roomId}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      })
      setTasks((items) => items.map((item) => item.id === updatedTask.id ? updatedTask : item))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const completed = tasks.filter((task) => task.is_completed).length
  return (
    <div className="mx-auto min-h-[420px] w-full max-w-2xl px-5 py-8 sm:px-10 sm:py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-violet-300/70">SHARED CHECKLIST</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Small steps, big progress.</h2>
        </div>
        <span className="shrink-0 rounded-full border border-violet-300/10 bg-violet-400/[0.06] px-3 py-1.5 text-xs text-violet-200">{completed} / {tasks.length} done</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <button aria-pressed={task.is_completed} className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4 text-left transition hover:border-violet-400/20 hover:bg-violet-400/[0.04]" key={task.id} onClick={() => toggleTask(task)} type="button">
            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border ${task.is_completed ? 'border-violet-400 bg-violet-500 text-white' : 'border-slate-600 text-transparent'}`}><Icon name="check" size={14} /></span>
            <span className={`text-sm ${task.is_completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.task}</span>
          </button>
        ))}
      </div>
      {loading && <p className="mt-4 text-xs text-slate-500">Loading shared tasks...</p>}
      {!loading && tasks.length === 0 && <p className="mt-5 text-sm text-slate-500">No tasks yet. Add the first step for your group.</p>}
      {error && <p aria-live="polite" className="mt-4 text-sm text-rose-300">{error}</p>}
      <form className="mt-5 flex gap-2 rounded-2xl border border-white/[0.07] bg-black/20 p-2 pl-4 transition focus-within:border-violet-400/30" onSubmit={addTask}>
        <input aria-label="Add a task" className="min-w-0 flex-1 bg-transparent py-2 text-sm text-white outline-none placeholder:text-slate-600" maxLength={200} onChange={(event) => setDraft(event.target.value)} placeholder="Add a task to your list..." value={draft} />
        <button aria-label="Add task" className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-violet-200 transition hover:bg-violet-500/35 disabled:opacity-50" disabled={!draft.trim()} type="submit"><Icon name="plus" size={18} /></button>
      </form>
    </div>
  )
}

function ChatSidebar({ roomId, token, user, onPresenceChange }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [activeMembers, setActiveMembers] = useState(0)
  const [error, setError] = useState('')
  const socketRef = useRef(null)
  const nextSystemMessage = useRef(0)

  useEffect(() => {
    let active = true
    apiRequest(`/rooms/${roomId}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((history) => {
      if (!active) return
      const storedMessages = history.map((item) => ({
        id: item.message_id,
        author: item.sender_username,
        text: item.text,
        time: new Date(item.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        own: item.sender_username === user.username,
      }))
      setMessages((current) => {
        const storedIds = new Set(storedMessages.map((item) => item.id))
        return [...storedMessages, ...current.filter((item) => !storedIds.has(item.id))]
      })
    }).catch((requestError) => {
      if (active) setError(requestError.message)
    })
    return () => { active = false }
  }, [roomId, token, user.username])

  useEffect(() => {
    const endpoint = new URL(`/ws/rooms/${roomId}`, API_BASE_URL)
    endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:'
    endpoint.searchParams.set('token', token)
    let socket
    const connectTimer = window.setTimeout(() => {
      socket = new WebSocket(endpoint.toString())
      socketRef.current = socket

      socket.onopen = () => {
        if (socketRef.current === socket) setConnectionStatus('connected')
      }
      socket.onmessage = (event) => {
        if (socketRef.current !== socket) return
        let payload
        try {
          payload = JSON.parse(event.data)
        } catch {
          setError('Received an unreadable message from the server.')
          return
        }
        if (payload.type === 'presence') {
          setActiveMembers(payload.active_members)
          onPresenceChange(payload.active_members)
          return
        }
        if (payload.type === 'error') {
          setError(payload.text)
          return
        }
        const sender = payload.sender || payload.sender_username || 'System'
        const id = payload.message_id ?? `system-${nextSystemMessage.current++}`
        setMessages((items) => {
          if (items.some((item) => item.id === id)) return items
          return [...items, {
            id,
            author: sender,
            text: payload.text,
            time: payload.sent_at
              ? new Date(payload.sent_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
              : 'Just now',
            own: sender === user.username,
          }]
        })
      }
      socket.onerror = () => {
        if (socketRef.current !== socket) return
        setConnectionStatus('error')
        setError('The chat connection failed. Check that the API server is running.')
      }
      socket.onclose = (event) => {
        if (socketRef.current !== socket) return
        setConnectionStatus('disconnected')
        socketRef.current = null
        if (event.code === 1008) setError('You are not authorized to enter this study room.')
        if (event.code === 1011) setError('The server could not save your message.')
      }
    }, 0)

    return () => {
      window.clearTimeout(connectTimer)
      if (socket) {
        socket.onopen = null
        socket.onmessage = null
        socket.onerror = null
        socket.onclose = null
        if (socketRef.current === socket) socketRef.current = null
        socket.close()
      }
    }
  }, [roomId, token, user.username, onPresenceChange])

  function sendMessage(event) {
    event.preventDefault()
    const text = message.trim()
    const socket = socketRef.current
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) {
      if (text) setError('Chat is not connected yet. Try sending again in a moment.')
      return
    }
    socket.send(text)
    setError('')
    setMessage('')
  }

  return (
    <aside className="flex min-h-[360px] min-w-0 flex-col border-t border-white/[0.06] bg-black/20 lg:min-h-0 lg:border-l lg:border-t-0">
      <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-white/[0.06] px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl border border-violet-300/10 bg-violet-500/15 text-violet-200"><Icon name="message" size={17} /></div>
        <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-white">Room chat</h2><p className="flex items-center gap-1.5 text-[11px] text-slate-500"><span className={`h-1.5 w-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-400' : connectionStatus === 'error' ? 'bg-rose-400' : 'bg-amber-400'}`} />{connectionStatus === 'connected' ? `${activeMembers} online` : connectionStatus === 'connecting' ? 'Connecting...' : connectionStatus === 'error' ? 'Connection error' : 'Disconnected'}</p></div>
      </header>
      <div aria-live="polite" className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        {messages.map((item) => (
          <article className={`flex flex-col ${item.own ? 'items-end' : 'items-start'}`} key={item.id}>
            <div className="mb-1.5 flex items-center gap-2 px-1"><span className="text-[11px] font-medium text-slate-300">{item.author}</span><span className="text-[10px] text-slate-600">{item.time}</span></div>
            <p className={`max-w-[90%] rounded-2xl px-3.5 py-3 text-[13px] leading-5 ${item.own ? 'rounded-tr-sm bg-gradient-to-br from-violet-600 to-indigo-700 text-white' : 'rounded-tl-sm border border-white/[0.05] bg-white/[0.045] text-slate-300'}`}>{item.text}</p>
          </article>
        ))}
        {messages.length === 0 && connectionStatus === 'connected' && <p className="py-8 text-center text-xs text-slate-600">No messages yet. Start the conversation.</p>}
        {error && <p aria-live="polite" className="rounded-xl border border-rose-400/10 bg-rose-400/[0.04] p-3 text-xs text-rose-300">{error}</p>}
      </div>
      <form className="shrink-0 border-t border-white/[0.06] p-3 sm:p-4" onSubmit={sendMessage}>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0d0815]/80 p-1.5 pl-3 transition focus-within:border-violet-400/30 focus-within:ring-2 focus-within:ring-violet-400/[0.07]">
          <input aria-label="Write a message" className="min-w-0 flex-1 bg-transparent py-2 text-[13px] text-slate-100 outline-none placeholder:text-slate-600" maxLength={2000} onChange={(event) => setMessage(event.target.value)} placeholder="Write a message..." value={message} />
          <button aria-label="Send message" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-500/20 text-violet-200 transition hover:bg-violet-500/35 disabled:cursor-not-allowed disabled:opacity-40" disabled={!message.trim() || connectionStatus !== 'connected'} type="submit"><Icon name="send" size={16} /></button>
        </div>
      </form>
    </aside>
  )
}

function StudyRoom({ room, buddy, token, user, onBack, onExit, leavingRoom, leaveError }) {
  const [activeTool, setActiveTool] = useState('timer')
  const [activeMembers, setActiveMembers] = useState(0)
  const [completionStatus, setCompletionStatus] = useState(null)
  const [loggingSession, setLoggingSession] = useState(false)
  const logPomodoro = useCallback(async (focusMinutes) => {
    setLoggingSession(true)
    setCompletionStatus({ type: 'pending', message: 'Saving your completed focus session...' })
    try {
      const response = await apiRequest(`/rooms/${room.id}/pomodoro`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ focus_minutes: focusMinutes }),
      })
      setCompletionStatus({
        type: 'success',
        message: `${response.minutes} focus minutes logged. Nice work!`,
      })
    } catch (error) {
      setCompletionStatus({
        type: 'error',
        message: `Session finished, but saving it failed: ${error.message}`,
      })
    } finally {
      setLoggingSession(false)
    }
  }, [room.id, token])
  const tools = [
    { id: 'timer', label: 'Timer', icon: 'clock' },
    { id: 'tasks', label: 'Tasks', icon: 'list' },
  ]

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] flex-col p-0 sm:p-5 lg:p-8">
      <div className="grid min-h-screen flex-1 overflow-hidden border-white/[0.07] bg-[#140C20]/65 shadow-[0_0_30px_rgba(139,92,246,0.1)] backdrop-blur-2xl sm:min-h-0 sm:rounded-3xl sm:border lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
        <section className="flex min-h-[620px] min-w-0 flex-col lg:min-h-0">
          <header className="flex min-h-[78px] items-center justify-between gap-4 border-b border-white/[0.06] px-4 py-3 sm:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button aria-label="Back to home" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-slate-400 transition hover:text-white disabled:cursor-wait disabled:opacity-50" disabled={leavingRoom} onClick={onBack} title="Back to home" type="button"><Icon name="back" size={17} /></button>
              <div className="min-w-0">
                <p className="text-[10px] font-medium tracking-[0.16em] text-violet-300/70">STUDY ROOM</p>
                <h1 className="truncate text-base font-semibold text-white sm:text-lg">{room.topic}</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 sm:gap-3 sm:px-3">
                <span className="flex -space-x-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#17101f] bg-gradient-to-br from-violet-400 to-indigo-500 text-[9px] font-bold text-white">{user.username.slice(0, 2).toUpperCase()}</span>
                  <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#17101f] bg-gradient-to-br from-fuchsia-400 to-violet-500 text-[9px] font-bold text-white">{buddy.username.slice(0, 2).toUpperCase()}</span>
                </span>
                <span className="text-[11px] text-slate-400"><strong className="text-slate-200">{activeMembers}</strong> active</span>
              </div>
              <button className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2 text-xs font-medium text-rose-300 transition hover:border-rose-400/40 hover:bg-rose-400/[0.12] disabled:cursor-wait disabled:opacity-50 sm:px-4" disabled={leavingRoom} onClick={onExit} type="button">
                {leavingRoom ? 'Exiting...' : 'Exit room'}
              </button>
            </div>
          </header>
          {leaveError && <p aria-live="polite" className="mx-4 mt-4 rounded-xl border border-rose-400/10 bg-rose-400/[0.04] px-4 py-3 text-sm text-rose-300 sm:mx-7">{leaveError}</p>}
          <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-200">Your shared workspace</p>
                <p className="mt-1 text-xs text-slate-500">Stay present, make progress, and help each other out.</p>
              </div>
              <div aria-label="Study tools" className="flex gap-1 rounded-xl border border-white/[0.06] bg-black/20 p-1" role="tablist">
                {tools.map((tool) => (
                  <button aria-selected={activeTool === tool.id} className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${activeTool === tool.id ? 'bg-violet-500/20 text-violet-100 shadow-inner shadow-violet-300/5' : 'text-slate-500 hover:text-slate-200'}`} key={tool.id} onClick={() => setActiveTool(tool.id)} role="tab" type="button">
                    <Icon name={tool.icon} size={15} /> {tool.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-[#0d0714]/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]" role="tabpanel">
              {activeTool === 'timer' ? (
                <PomodoroTimer completionStatus={completionStatus} onComplete={logPomodoro} />
              ) : (
                <TaskList roomId={room.id} token={token} />
              )}
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-600"><Icon name="sparkles" size={13} /> {loggingSession ? 'Recording your completed session...' : 'A little progress is still progress.'}</p>
          </div>
        </section>
        <ChatSidebar onPresenceChange={setActiveMembers} roomId={room.id} token={token} user={user} />
      </div>
    </main>
  )
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('study-buddy-token'))
  const [user, setUser] = useState(null)
  const [checkingSession, setCheckingSession] = useState(Boolean(token))
  const [authNotice, setAuthNotice] = useState('')
  const [buddy, setBuddy] = useState(null)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [room, setRoom] = useState(null)
  const [leavingRoom, setLeavingRoom] = useState(false)
  const [leaveError, setLeaveError] = useState('')

  useEffect(() => {
    if (!token) return undefined
    let active = true
    apiRequest('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((profile) => {
      if (active) setUser(profile)
    }).catch((requestError) => {
      if (!active) return
      localStorage.removeItem('study-buddy-token')
      setToken(null)
      setAuthNotice(`Your saved session could not be restored: ${requestError.message}`)
    }).finally(() => {
      if (active) setCheckingSession(false)
    })
    return () => { active = false }
  }, [token])

  function completeAuthentication(accessToken, profile) {
    localStorage.setItem('study-buddy-token', accessToken)
    setToken(accessToken)
    setUser(profile)
    setAuthNotice('')
  }

  function logout() {
    localStorage.removeItem('study-buddy-token')
    setToken(null)
    setUser(null)
    setRoom(null)
    setBuddy(null)
  }

  async function createRoom(topic, password) {
    const roomName = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 25)
    const createdRoom = await apiRequest('/rooms', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: roomName.length >= 3 ? roomName : 'study-room',
        password,
        topic,
        total_members: 12,
        invite_username: buddy.username,
      }),
    })
    setRoom({ id: createdRoom.id, topic })
    setRoomModalOpen(false)
  }

  function openRoom(studyRoom) {
    setLeaveError('')
    const otherMember = studyRoom.members.find((member) => member !== user.username)
    setBuddy({
      username: otherMember || user.username,
      initials: (otherMember || user.username).slice(0, 2).toUpperCase(),
    })
    setRoom(studyRoom)
  }

  function backToHome() {
    setRoom(null)
    setBuddy(null)
    setLeaveError('')
  }

  async function leaveRoom() {
    setLeavingRoom(true)
    setLeaveError('')
    try {
      await apiRequest(`/rooms/${room.id}/leave`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      })
      setRoom(null)
      setBuddy(null)
      setLeaveError('')
    } catch (requestError) {
      setLeaveError(requestError.message)
    } finally {
      setLeavingRoom(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0014] font-sans text-slate-200 selection:bg-violet-500/30">
      <AmbientGlow />
      {checkingSession ? (
        <div className="relative z-10 grid min-h-screen place-items-center text-sm text-violet-200/70">Restoring your session...</div>
      ) : !token || !user ? (
        <AuthView notice={authNotice} onAuthenticated={completeAuthentication} />
      ) : room ? (
        <StudyRoom buddy={buddy} leaveError={leaveError} leavingRoom={leavingRoom} onBack={backToHome} onExit={leaveRoom} room={room} token={token} user={user} />
      ) : (
        <SearchDashboard
          onCreateRoom={(selectedBuddy) => { setBuddy(selectedBuddy); setRoomModalOpen(true) }}
          onLogout={logout}
          onOpenRoom={openRoom}
          token={token}
          user={user}
        />
      )}
      {roomModalOpen && buddy && <RoomModal buddy={buddy} onClose={() => setRoomModalOpen(false)} onCreate={createRoom} />}
    </div>
  )
}

export default App
