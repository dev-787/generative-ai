import React from 'react'

// Renders inline markdown: **bold**, *italic*, `code`, [link](url)
function renderInline(text) {
  const parts = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g
  let last = 0, match, key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2]) parts.push(<strong key={key++}>{match[2]}</strong>)
    else if (match[3]) parts.push(<em key={key++}>{match[3]}</em>)
    else if (match[4]) parts.push(<code key={key++}>{match[4]}</code>)
    else if (match[5]) parts.push(<a key={key++} href={match[6]} target="_blank" rel="noreferrer">{match[5]}</a>)
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

export default function MarkdownMessage({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let i = 0, key = 0

  while (i < lines.length) {
    const line = lines[i]

    // Code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={key++} className="md-pre">
          {lang && <span className="md-lang">{lang}</span>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // Headings
    const h3 = line.match(/^###\s+(.+)/)
    const h2 = line.match(/^##\s+(.+)/)
    const h1 = line.match(/^#\s+(.+)/)
    if (h3) { elements.push(<h3 key={key++}>{renderInline(h3[1])}</h3>); i++; continue }
    if (h2) { elements.push(<h2 key={key++}>{renderInline(h2[1])}</h2>); i++; continue }
    if (h1) { elements.push(<h1 key={key++}>{renderInline(h1[1])}</h1>); i++; continue }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) { elements.push(<hr key={key++} />); i++; continue }

    // Unordered list
    if (/^[\*\-]\s/.test(line)) {
      const items = []
      while (i < lines.length && /^[\*\-]\s/.test(lines[i])) {
        items.push(<li key={i}>{renderInline(lines[i].replace(/^[\*\-]\s/, ''))}</li>)
        i++
      }
      elements.push(<ul key={key++}>{items}</ul>)
      continue
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\.\s/, ''))}</li>)
        i++
      }
      elements.push(<ol key={key++}>{items}</ol>)
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(<blockquote key={key++}>{renderInline(line.slice(2))}</blockquote>)
      i++
      continue
    }

    // Empty line
    if (line.trim() === '') { i++; continue }

    // Paragraph
    elements.push(<p key={key++}>{renderInline(line)}</p>)
    i++
  }

  return <div className="md-body">{elements}</div>
}
