import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import { extractText } from 'unpdf'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Recebe um arquivo (PDF/DOCX/TXT) via FormData e devolve APENAS o texto extraído.
 * O client (com contexto de empresa/usuário) se encarrega de persistir via Supabase.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('arquivo') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Envie o campo "arquivo".' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const nome = file.name.toLowerCase()

    let texto = ''
    if (nome.endsWith('.pdf')) {
      const result = await extractText(new Uint8Array(buffer), { mergePages: true })
      texto = Array.isArray(result.text) ? result.text.join('\n') : result.text
    } else if (nome.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
      texto = result.value
    } else if (nome.endsWith('.txt') || file.type === 'text/plain') {
      texto = new TextDecoder().decode(buffer)
    } else {
      return NextResponse.json(
        { error: `Formato não suportado: ${file.name}. Use PDF, DOCX ou TXT.` },
        { status: 400 }
      )
    }

    if (!texto.trim()) {
      return NextResponse.json(
        { error: 'Não foi possível extrair texto do arquivo.' },
        { status: 400 }
      )
    }

    return NextResponse.json({ nomeArquivo: file.name, texto })
  } catch (err) {
    console.error('[extrair-texto] erro:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Erro ao extrair texto.' },
      { status: 500 }
    )
  }
}
