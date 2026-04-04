import React, { useEffect, useMemo, useRef, useState } from 'react'
import './SearchOverlay.scss'
import api from '../services/api'

function highlight(text, query) {
  if (!query) return text
  try {
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + query.length)
    const after = text.slice(idx + query.length)
    return (
      <>
        {before}
        <mark>{match}</mark>
        {after}
      </>
    )
  } catch {
    return text
  }
}

const SearchOverlay = ({
  isOpen,
  onClose,
  currentChat,
  currentMessages,
  onNavigateToChat,
}) => {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [otherResults, setOtherResults] = useState([]) // [{ chat, hits: [{message, index}]}]
  const [currentResults, setCurrentResults] = useState([])
  const inputRef = useRef(null)

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setQuery('')
      setCurrentResults([])
      setOtherResults([])
      setLoading(false)
    }
  }, [isOpen])

  // Search in current chat
  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    if (!q) {
      setCurrentResults([])
      return
    }
    const hits = []
    for (let i = 0; i < currentMessages.length; i++) {
      const m = currentMessages[i]
      if (m?.content?.toLowerCase().includes(q.toLowerCase())) {
        hits.push({ message: m, index: i })
        if (hits.length >= 10) break
      }
    }
    setCurrentResults(hits)
  }, [query, currentMessages, isOpen])

  // Debounced search across other chats
  useEffect(() => {
    if (!isOpen) return
    const q = query.trim()
    if (!q) {
      setOtherResults([])
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        // get all chats
        const { chats } = await api.getChats()
        const others = chats.filter(c => currentChat && c._id !== currentChat._id)

        const results = []
        // Limit to first 8 chats for MVP performance
        for (const chat of others.slice(0, 8)) {
          const { messages } = await api.getChatMessages(chat._id)
          const hits = []
          for (let i = 0; i < messages.length; i++) {
            const m = messages[i]
            if (m?.content?.toLowerCase().includes(q.toLowerCase())) {
              hits.push({ message: m, index: i })
              if (hits.length >= 3) break
            }
          }
          if (hits.length) {
            results.push({ chat, hits })
          }
          if (cancelled) return
        }
        if (!cancelled) setOtherResults(results)
      } catch (e) {
        if (!cancelled) setOtherResults([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query, isOpen, currentChat])

  const handleClose = (e) => {
    e?.stopPropagation()
    onClose?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose?.()
    }
  }

  if (!isOpen) return null

  return (
    <div className="search-overlay" onKeyDown={handleKeyDown}>
      <div className="backdrop" onClick={handleClose} />

      <div className="search-panel" role="dialog" aria-modal="true">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="results">
          <div className="section">
            <div className="section-title">In this chat</div>
            {query && currentResults.length === 0 && (
              <div className="empty">No results in current chat</div>
            )}
            {currentResults.map((hit, idx) => (
              <div key={`curr-${idx}`} className="result-item">
                <div className={`pill ${hit.message.type || (hit.message.role === 'user' ? 'user' : 'assistant')}`}>
                  {hit.message.type || hit.message.role}
                </div>
                <div className="snippet">
                  {highlight(hit.message.content, query)}
                </div>
                <div className="time">
                  {new Date(hit.message.timestamp || hit.message.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="section">
            <div className="section-title">Other chats {loading ? '(searching...)' : ''}</div>
            {!loading && query && otherResults.length === 0 && (
              <div className="empty">No results in other chats</div>
            )}
            {otherResults.map(({ chat, hits }) => (
              <div key={chat._id} className="chat-group">
                <div className="chat-header" onClick={() => onNavigateToChat?.(chat._id)}>
                  <span className="chat-title">{chat.title || 'Untitled chat'}</span>
                  <span className="hit-count">{hits.length} match{hits.length > 1 ? 'es' : ''}</span>
                </div>
                {hits.map((hit, idx) => (
                  <div key={`${chat._id}-${idx}`} className="result-item other" onClick={() => onNavigateToChat?.(chat._id)}>
                    <div className="pill small">{hit.message.role || hit.message.type}</div>
                    <div className="snippet">{highlight(hit.message.content, query)}</div>
                    <div className="time">{new Date(hit.message.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchOverlay
