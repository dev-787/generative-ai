import React, { useEffect, useRef, useState, useCallback } from 'react'
import './SearchOverlay.scss'
import api from '../services/api'

// Returns text split into before/match/after for highlighting
function getHighlightParts(text, query) {
  if (!query || !text) return [{ text, match: false }]
  const lower = text.toLowerCase()
  const q = query.toLowerCase()
  const parts = []
  let cursor = 0
  let idx
  while ((idx = lower.indexOf(q, cursor)) !== -1) {
    if (idx > cursor) parts.push({ text: text.slice(cursor, idx), match: false })
    parts.push({ text: text.slice(idx, idx + q.length), match: true })
    cursor = idx + q.length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })
  return parts
}

// Extracts a short context snippet around the first match
function getSnippet(content, query, radius = 80) {
  if (!content || !query) return content
  const idx = content.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return content.slice(0, radius * 2)
  const start = Math.max(0, idx - radius)
  const end = Math.min(content.length, idx + query.length + radius)
  return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
}

function Highlight({ text, query }) {
  const parts = getHighlightParts(text, query)
  return (
    <span>
      {parts.map((p, i) =>
        p.match ? <mark key={i}>{p.text}</mark> : <span key={i}>{p.text}</span>
      )}
    </span>
  )
}

const SearchOverlay = ({ isOpen, onClose, currentChat, currentMessages, onNavigateToChat }) => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [otherResults, setOtherResults] = useState([])
  const [currentResults, setCurrentResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setCurrentResults([])
      setOtherResults([])
      setLoading(false)
      setActiveIndex(0)
    }
  }, [isOpen])

  // Search current chat
  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    if (!q) { setCurrentResults([]); return }
    const hits = []
    for (let i = 0; i < currentMessages.length; i++) {
      const m = currentMessages[i]
      if (m?.content?.toLowerCase().includes(q.toLowerCase())) {
        hits.push({ message: m, index: i })
        if (hits.length >= 15) break
      }
    }
    setCurrentResults(hits)
    setActiveIndex(0)
  }, [query, currentMessages, isOpen])

  // Debounced search across other chats
  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    if (!q) { setOtherResults([]); return }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const { chats } = await api.getChats()
        const others = chats.filter(c => currentChat && c._id !== currentChat._id)
        const results = []
        for (const chat of others.slice(0, 10)) {
          const { messages } = await api.getChatMessages(chat._id)
          const hits = []
          for (let i = 0; i < messages.length; i++) {
            const m = messages[i]
            if (m?.content?.toLowerCase().includes(q.toLowerCase())) {
              hits.push({ message: m, index: i })
              if (hits.length >= 4) break
            }
          }
          if (hits.length) results.push({ chat, hits })
          if (cancelled) return
        }
        if (!cancelled) setOtherResults(results)
      } catch {
        if (!cancelled) setOtherResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 350)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [query, isOpen, currentChat])

  const totalCurrentHits = currentResults.length
  const totalOtherHits = otherResults.reduce((s, r) => s + r.hits.length, 0)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose?.() }
  }

  if (!isOpen) return null

  return (
    <div className="search-overlay" onKeyDown={handleKeyDown} role="dialog" aria-modal="true">
      <div className="search-backdrop" onClick={onClose} />

      <div className="search-modal">
        {/* Header */}
        <div className="search-header">
          <div className="search-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search across all chats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')} title="Clear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <button className="close-btn" onClick={onClose} title="Close (Esc)">
            <span>Esc</span>
          </button>
        </div>

        {/* Stats bar */}
        {query.trim() && (
          <div className="search-stats">
            {loading ? (
              <span className="stat-loading">
                <span className="dot-pulse" />
                Searching other chats...
              </span>
            ) : (
              <>
                <span className="stat-item current">{totalCurrentHits} in this chat</span>
                <span className="stat-sep">·</span>
                <span className="stat-item other">{totalOtherHits} in other chats</span>
              </>
            )}
          </div>
        )}

        {/* Results */}
        <div className="search-results" ref={resultsRef}>
          {!query.trim() && (
            <div className="search-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p>Type to search across all your conversations</p>
              <span>Matches will show with context</span>
            </div>
          )}

          {/* Current chat results */}
          {query.trim() && (
            <div className="results-section">
              <div className="results-section-header">
                <div className="section-label current-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Current chat
                  {currentChat?.title && currentChat.title !== 'New Chat' && (
                    <span className="chat-name-badge">{currentChat.title}</span>
                  )}
                </div>
                <span className="count-badge">{currentResults.length}</span>
              </div>

              {currentResults.length === 0 ? (
                <div className="no-results">No matches in this chat</div>
              ) : (
                currentResults.map((hit, idx) => {
                  const snippet = getSnippet(hit.message.content, query)
                  const role = hit.message.type || hit.message.role || 'user'
                  return (
                    <div key={`curr-${idx}`} className={`result-item ${role}`}>
                      <div className="result-role-tag">
                        {role === 'user' ? (
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                        )}
                        <span>{role === 'user' ? 'You' : 'Aurora'}</span>
                      </div>
                      <div className="result-snippet">
                        <Highlight text={snippet} query={query} />
                      </div>
                      <div className="result-meta">
                        <span>Message {hit.index + 1}</span>
                        {(hit.message.timestamp || hit.message.createdAt) && (
                          <span>{new Date(hit.message.timestamp || hit.message.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* Other chats results */}
          {query.trim() && (
            <div className="results-section">
              <div className="results-section-header">
                <div className="section-label other-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    <path d="M8 10h8M8 14h5" />
                  </svg>
                  Other chats
                </div>
                <span className="count-badge">{loading ? '…' : totalOtherHits}</span>
              </div>

              {loading && (
                <div className="searching-indicator">
                  <div className="spinner" />
                  <span>Searching conversations...</span>
                </div>
              )}

              {!loading && otherResults.length === 0 && (
                <div className="no-results">No matches in other chats</div>
              )}

              {otherResults.map(({ chat, hits }) => (
                <div key={chat._id} className="chat-group">
                  <div className="chat-group-header" onClick={() => { onNavigateToChat?.(chat._id); onClose?.() }}>
                    <div className="chat-group-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span>{chat.title || 'Untitled chat'}</span>
                    </div>
                    <div className="chat-group-right">
                      <span className="match-count">{hits.length} match{hits.length > 1 ? 'es' : ''}</span>
                      <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                  {hits.map((hit, idx) => {
                    const snippet = getSnippet(hit.message.content, query)
                    const role = hit.message.role || hit.message.type || 'user'
                    return (
                      <div
                        key={`${chat._id}-${idx}`}
                        className={`result-item other ${role}`}
                        onClick={() => { onNavigateToChat?.(chat._id); onClose?.() }}
                      >
                        <div className="result-role-tag">
                          {role === 'user' ? (
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                          )}
                          <span>{role === 'user' ? 'You' : 'Aurora'}</span>
                        </div>
                        <div className="result-snippet">
                          <Highlight text={snippet} query={query} />
                        </div>
                        <div className="result-meta">
                          <span>Message {hit.index + 1}</span>
                          {hit.message.createdAt && (
                            <span>{new Date(hit.message.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}

export default SearchOverlay
