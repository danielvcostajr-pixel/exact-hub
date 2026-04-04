'use client'

import { useState, useRef } from 'react'
import { Printer, List, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MemoriaViewerProps {
  conteudo: string
  versao: number
}

interface TocItem {
  id: string
  text: string
  level: number
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function parseMarkdown(md: string): string {
  return md
    // h1
    .replace(/^# (.+)$/gm, (_, t) => {
      const id = slugify(t)
      return `<h1 id="${id}" class="text-2xl font-bold text-foreground mt-8 mb-3 pb-2 border-b border-border">${t}</h1>`
    })
    // h2
    .replace(/^## (.+)$/gm, (_, t) => {
      const id = slugify(t)
      return `<h2 id="${id}" class="text-lg font-semibold text-foreground mt-6 mb-2">${t}</h2>`
    })
    // h3
    .replace(/^### (.+)$/gm, (_, t) => {
      const id = slugify(t)
      return `<h3 id="${id}" class="text-base font-semibold text-primary mt-4 mb-1.5">${t}</h3>`
    })
    // bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    // italic
    .replace(/\*(.+?)\*/g, '<em class="text-muted-foreground italic">$1</em>')
    // horizontal rule
    .replace(/^---$/gm, '<hr class="border-border my-4" />')
    // unordered list items
    .replace(/^- (.+)$/gm, '<li class="text-muted-foreground text-sm mb-1 pl-1">$1</li>')
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, (_, t) => `<li class="text-muted-foreground text-sm mb-1 list-decimal pl-1">${t}</li>`)
    // wrap consecutive li into ul
    .replace(/(<li.*<\/li>\n?)+/g, (match) => {
      if (match.includes('list-decimal')) {
        return `<ol class="pl-5 mb-3 space-y-1 list-decimal">${match}</ol>`
      }
      return `<ul class="pl-5 mb-3 space-y-1 list-disc">${match}</ul>`
    })
    // blockquote
    .replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-4 border-primary pl-4 py-1 my-3 text-muted-foreground text-sm italic bg-primary/5 rounded-r">$1</blockquote>'
    )
    // inline code
    .replace(
      /`(.+?)`/g,
      '<code class="bg-secondary text-primary px-1.5 py-0.5 rounded text-xs font-mono">$1</code>'
    )
    // table
    .replace(
      /(\|.+\|\n)+/g,
      (match) => {
        const rows = match.trim().split('\n')
        const headerRow = rows[0]
        const bodyRows = rows.slice(2)
        const headers = headerRow
          .split('|')
          .filter(Boolean)
          .map((h) => `<th class="px-3 py-2 text-left text-xs font-semibold text-primary border-b border-border">${h.trim()}</th>`)
          .join('')
        const body = bodyRows
          .map((row) =>
            `<tr class="border-b border-border/50 hover:bg-secondary/30 transition-colors">${row
              .split('|')
              .filter(Boolean)
              .map((cell) => `<td class="px-3 py-2 text-xs text-muted-foreground">${cell.trim()}</td>`)
              .join('')}</tr>`
          )
          .join('')
        return `<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-sm"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></div>`
      }
    )
    // paragraph
    .replace(/^(?!<[a-z]).+$/gm, (line) => {
      if (!line.trim()) return ''
      return `<p class="text-muted-foreground text-sm leading-relaxed mb-3">${line}</p>`
    })
    // empty lines
    .replace(/\n{2,}/g, '\n')
}

function extractToc(md: string): TocItem[] {
  const items: TocItem[] = []
  const lines = md.split('\n')
  for (const line of lines) {
    const h1 = line.match(/^# (.+)$/)
    const h2 = line.match(/^## (.+)$/)
    const h3 = line.match(/^### (.+)$/)
    if (h1) items.push({ id: slugify(h1[1]), text: h1[1], level: 1 })
    else if (h2) items.push({ id: slugify(h2[1]), text: h2[1], level: 2 })
    else if (h3) items.push({ id: slugify(h3[1]), text: h3[1], level: 3 })
  }
  return items
}

export function MemoriaViewer({ conteudo, versao }: MemoriaViewerProps) {
  const [tocOpen, setTocOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)

  const toc = extractToc(conteudo)
  const html = parseMarkdown(conteudo)

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(id)
      setTocOpen(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="relative flex gap-4">
      {/* Table of Contents Sidebar */}
      <aside
        className={`
          ${tocOpen ? 'flex' : 'hidden lg:flex'}
          fixed lg:sticky inset-0 lg:inset-auto top-0 left-0 z-40 lg:z-auto
          flex-col w-64 lg:w-52 shrink-0 h-screen lg:h-[calc(100vh-120px)]
          border-r lg:border lg:rounded-lg overflow-hidden
        `}
        style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
      >
        <div
          className="px-3 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sumario</span>
          <button
            onClick={() => setTocOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          {toc.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`
                w-full text-left px-2 py-1.5 rounded text-xs transition-colors
                ${item.level === 1 ? 'font-semibold' : item.level === 2 ? 'pl-4' : 'pl-6'}
                ${activeSection === item.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}
              `}
            >
              {item.level === 3 && <span className="mr-1 opacity-50">›</span>}
              {item.text}
            </button>
          ))}
        </nav>
        <div
          className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground/50"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          Versao {versao}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Toolbar */}
        <div
          className="flex items-center justify-between mb-4 rounded-lg border px-3 py-2"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
        >
          <button
            onClick={() => setTocOpen(true)}
            className="lg:hidden flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <List size={13} />
            Sumario
          </button>
          <span className="text-xs text-muted-foreground/50 hidden lg:block">
            {toc.length} secoes • Versao {versao}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrint}
            className="border-border bg-transparent text-muted-foreground hover:bg-secondary gap-1.5 text-xs"
          >
            <Printer size={12} />
            Imprimir
          </Button>
        </div>

        {/* Document content */}
        <div
          ref={contentRef}
          className="rounded-lg border p-6 lg:p-8 print:border-0 print:p-0"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  )
}
