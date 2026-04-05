import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60 // seconds
export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Você é um assistente especializado em gestão de projetos e acompanhamento de reuniões.

Sua tarefa é analisar transcrições de reuniões e extrair TODAS as atividades, tarefas e compromissos mencionados.

Para cada atividade identificada, extraia:
- titulo: descrição concisa da tarefa (máx 100 caracteres)
- descricao: detalhamento do que precisa ser feito
- responsavel: nome da pessoa responsável (se mencionado, senão null)
- prazo: data limite no formato YYYY-MM-DD (se mencionada, senão null)
- prioridade: BAIXA, MEDIA, ALTA ou URGENTE (inferir do contexto)

Responda SOMENTE com um JSON válido no formato:
{
  "resumo": "breve resumo da reunião em 2-3 frases",
  "tarefas": [
    {
      "titulo": "...",
      "descricao": "...",
      "responsavel": "...",
      "prazo": "YYYY-MM-DD",
      "prioridade": "MEDIA"
    }
  ]
}

Se não conseguir identificar tarefas, retorne o array vazio. Nunca inclua texto fora do JSON.`

// ── Extract text from file ───────────────────────────────────────────────

async function extractTextFromFile(
  fileBase64: string,
  fileName: string,
): Promise<string> {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const buffer = Buffer.from(fileBase64, 'base64')

  if (ext === 'txt' || ext === 'csv' || ext === 'md') {
    return buffer.toString('utf-8')
  }

  if (ext === 'pdf') {
    try {
      // pdf-parse requires buffer
      const pdfParse = (await import('pdf-parse')).default
      const result = await pdfParse(buffer)
      return result.text
    } catch (err) {
      console.error('Erro ao parsear PDF:', err)
      return ''
    }
  }

  if (ext === 'docx' || ext === 'doc') {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (err) {
      console.error('Erro ao parsear DOCX:', err)
      return ''
    }
  }

  // Fallback: try as UTF-8 text
  return buffer.toString('utf-8')
}

// ── POST handler ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    let transcricao: string

    // Accept either raw text or file (base64)
    if (body.fileBase64 && body.fileName) {
      transcricao = await extractTextFromFile(body.fileBase64, body.fileName)
      if (!transcricao || transcricao.trim().length < 20) {
        return NextResponse.json(
          {
            error:
              'Nao foi possivel extrair texto do arquivo. Tente copiar e colar o conteudo diretamente.',
          },
          { status: 400 },
        )
      }
    } else if (body.transcricao && typeof body.transcricao === 'string') {
      transcricao = body.transcricao
    } else {
      return NextResponse.json(
        { error: 'Envie uma transcricao (texto) ou um arquivo (fileBase64 + fileName).' },
        { status: 400 },
      )
    }

    if (transcricao.trim().length < 20) {
      return NextResponse.json({ error: 'Transcricao muito curta.' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json(fallbackParse(transcricao))
    }

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analise a seguinte transcrição de reunião e extraia todas as tarefas e atividades:\n\n${transcricao}`,
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'Resposta vazia do modelo' }, { status: 500 })
    }

    // Extract JSON from response (handle possible markdown code blocks)
    let jsonText = textBlock.text.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonText = jsonMatch[1].trim()

    const parsed = JSON.parse(jsonText)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Erro na análise de reunião:', err)
    return NextResponse.json({ error: 'Erro ao processar transcricao' }, { status: 500 })
  }
}

// ── Fallback parser (no AI) ──────────────────────────────────────────────

function fallbackParse(text: string) {
  const tarefas: Array<{
    titulo: string
    descricao: string
    responsavel: string | null
    prazo: string | null
    prioridade: string
  }> = []

  const lines = text.split(/[\n]+/).map((l) => l.trim()).filter((l) => l.length > 10)

  // Patterns that indicate a task or action item
  const taskPatterns = [
    /(?:precisa|deve|devemos|tem que|temos que|vai|vamos|ficou de|fica responsável|ação|tarefa|pendência|próximo passo|definir|criar|implementar|enviar|preparar|revisar|organizar|agendar|marcar|fazer|resolver|verificar|atualizar|montar|elaborar|entregar|concluir)\b/i,
  ]

  // Extract responsible person pattern
  const responsavelPattern =
    /(?:responsável|responsavel|encarregado|atribuído a|assignado):?\s*(\w+(?:\s+\w+)?)/i

  // Extract date pattern
  const datePattern =
    /(?:prazo|até|data|deadline|para o dia|para dia|até dia):?\s*([\d]{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?)/i

  for (const line of lines) {
    const isTask = taskPatterns.some((p) => p.test(line))
    if (!isTask) continue

    // Extract responsible
    const respMatch = responsavelPattern.exec(line)
    const responsavel = respMatch ? respMatch[1].trim() : null

    // Extract date
    const dateMatch = datePattern.exec(line)
    let prazo: string | null = null
    if (dateMatch) {
      const parts = dateMatch[1].split(/[\/.]+/)
      if (parts.length >= 2) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        const year = parts[2]
          ? parts[2].length === 2
            ? `20${parts[2]}`
            : parts[2]
          : new Date().getFullYear().toString()
        prazo = `${year}-${month}-${day}`
      }
    }

    // Infer priority
    let prioridade = 'MEDIA'
    if (/urgent|imediato|hoje|asap|crítico/i.test(line)) prioridade = 'URGENTE'
    else if (/importante|prioridade alta|essencial/i.test(line)) prioridade = 'ALTA'
    else if (/pode esperar|baixa prioridade|quando possível/i.test(line)) prioridade = 'BAIXA'

    tarefas.push({
      titulo: line.replace(/^[-•*\d.)\s]+/, '').slice(0, 100),
      descricao: line,
      responsavel,
      prazo,
      prioridade,
    })
  }

  // If no task patterns found, extract sentence-like segments
  if (tarefas.length === 0) {
    const sentences = text
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20)
      .slice(0, 10)
    for (const s of sentences) {
      tarefas.push({
        titulo: s.slice(0, 100),
        descricao: s,
        responsavel: null,
        prazo: null,
        prioridade: 'MEDIA',
      })
    }
  }

  return {
    resumo:
      'Analise realizada por extracao de padroes (configure a ANTHROPIC_API_KEY para analise com IA). Revise as tarefas extraidas.',
    tarefas,
  }
}
