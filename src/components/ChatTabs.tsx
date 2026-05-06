import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useStore } from '../store'

function getSessionId(session: { id: string; key?: string }) {
  return session.key || session.id
}

function getSessionLabel(session: { id: string; key?: string; title?: string; agentId?: string }, agents: Array<{ id: string; name?: string }>) {
  const key = session.key || session.id || ''
  const title = session.title || ''
  if (title && title !== 'New Chat' && title !== key) return title
  const keyParts = key.match(/^agent:([^:]+):(.+)$/)
  const agentId = session.agentId || keyParts?.[1]
  const agent = agentId ? agents.find(a => a.id === agentId) : undefined
  return agent?.name || title || 'New Chat'
}

function isVisibleChatSession(session: { id: string; key?: string; spawned?: boolean; cron?: boolean }) {
  const key = session.key || session.id || ''
  if (!key) return false
  if (session.spawned || session.cron) return false
  if (key.includes(':subagent:') || key.includes(':cron:')) return false
  if (/^agent:[^:]+:cron(:|$)/.test(key)) return false
  return true
}

export function ChatTabs() {
  const {
    sessions,
    currentSessionId,
    agents,
    streamingSessions,
    unreadCounts,
    setCurrentSession,
    createNewSession,
    deleteSession,
  } = useStore(useShallow(state => ({
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    agents: state.agents,
    streamingSessions: state.streamingSessions,
    unreadCounts: state.unreadCounts,
    setCurrentSession: state.setCurrentSession,
    createNewSession: state.createNewSession,
    deleteSession: state.deleteSession,
  })))

  const visibleSessions = useMemo(() => {
    const seen = new Set<string>()
    return sessions.filter(session => {
      const id = getSessionId(session)
      if (seen.has(id) || !isVisibleChatSession(session)) return false
      seen.add(id)
      return true
    }).slice(0, 12)
  }, [sessions])

  return (
    <div className="chat-tabs" role="tablist" aria-label="Open chat sessions">
      <div className="chat-tabs-scroll">
        {visibleSessions.length === 0 ? (
          <div className="chat-tab empty" aria-disabled="true">No chats yet</div>
        ) : visibleSessions.map(session => {
          const id = getSessionId(session)
          const active = id === currentSessionId
          const busy = !!streamingSessions[id]
          const unread = unreadCounts[id] || 0
          return (
            <div key={id} className={`chat-tab${active ? ' active' : ''}${busy ? ' busy' : ''}`} role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={active}
                className="chat-tab-main"
                onClick={() => setCurrentSession(id)}
                title={id}
              >
                <span className="chat-tab-status" aria-hidden="true" />
                <span className="chat-tab-title">{getSessionLabel(session, agents)}</span>
                {unread > 0 && <span className="chat-tab-unread" aria-label={`${unread} unread`}>{unread > 99 ? '99+' : unread}</span>}
              </button>
              {!/^agent:[^:]+:(main|cron)(:|$)/.test(id) && (
                <button
                  type="button"
                  className="chat-tab-close"
                  aria-label="Close chat tab"
                  onClick={(event) => {
                    event.stopPropagation()
                    deleteSession(id)
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )
        })}
      </div>
      <button
        type="button"
        className="chat-tab-new"
        onClick={() => { void createNewSession() }}
        aria-label="New chat tab"
        title="New chat"
      >
        +
      </button>
    </div>
  )
}
