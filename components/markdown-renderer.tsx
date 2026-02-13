"use client"

import { useMemo } from "react"

interface MarkdownRendererProps {
  content: string
}

/**
 * Lightweight markdown renderer that handles common patterns
 * without requiring react-markdown dependency.
 */
export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const html = useMemo(() => renderMarkdown(content), [content])

  return (
    <div
      className="prose"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function renderMarkdown(md: string): string {
  if (!md) return ""

  let html = md

  // Code blocks (fenced)
  html = html.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_match, _lang, code) =>
      `<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`
  )

  // Inline code
  html = html.replace(
    /`([^`]+)`/g,
    (_match, code) => `<code>${escapeHtml(code)}</code>`
  )

  // Headers
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>")
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>")

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")

  // Blockquote
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")

  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />")

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )

  // Unordered lists
  html = html.replace(/^(\s*)[-*] (.+)$/gm, "$1<li>$2</li>")

  // Ordered lists
  html = html.replace(/^(\s*)\d+\. (.+)$/gm, "$1<li>$2</li>")

  // Wrap consecutive <li> tags in <ul>
  html = html.replace(
    /(<li>[\s\S]*?<\/li>\n?)+/g,
    (match) => `<ul>${match}</ul>`
  )

  // Paragraphs - wrap text not already in tags
  const lines = html.split("\n")
  const result: string[] = []
  let inPre = false

  for (const line of lines) {
    if (line.includes("<pre>")) inPre = true
    if (line.includes("</pre>")) {
      inPre = false
      result.push(line)
      continue
    }
    if (inPre) {
      result.push(line)
      continue
    }

    const trimmed = line.trim()
    if (
      !trimmed ||
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("<ol") ||
      trimmed.startsWith("<li") ||
      trimmed.startsWith("<blockquote") ||
      trimmed.startsWith("<hr") ||
      trimmed.startsWith("<pre") ||
      trimmed.startsWith("</")
    ) {
      result.push(line)
    } else {
      result.push(`<p>${line}</p>`)
    }
  }

  return result.join("\n")
}
