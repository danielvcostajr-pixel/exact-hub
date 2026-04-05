import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

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

export async function POST(request: NextRequest) {
  try {
    const { transcricao } = await request.json()

    if (!transcricao || typeof transcricao !== 'string' || transcricao.trim().length < 20) {
      return NextResponse.json(
        { error: 'Transcrição muito curta ou inválida' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey || apiKey === 'placeholder') {
      // Fallback: parse basic patterns without AI
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

    const parsed = JSON.parse(textBlock.text)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Erro na análise de reunião:', err)
    return NextResponse.json(
      { error: 'Erro ao processar transcrição' },
      { status: 500 }
    )
  }
}

function fallbackParse(text: string) {
  const tarefas: Array<{
    titulo: string
    descricao: string
    responsavel: string | null
    prazo: string | null
    prioridade: string
  }> = []

  // Simple pattern matching for common task indicators
  const patterns = [
    /(?:precisa|deve|tem que|vai|ficou de|fica responsável por|ação:?|tarefa:?|todo:?|pendência:?)\s*[:\-–]?\s*(.+)/gi,
    /(?:responsável|responsavel):?\s*(\w+).*?(?:prazo|até|data):?\s*([\d\/\-]+)/gi,
  ]

  const lines = text.split(/[.\n]+/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.length < 10) continue

    for (const pattern of patterns) {
      pattern.lastIndex = 0
      const match = pattern.exec(trimmed)
      if (match) {
        tarefas.push({
          titulo: match[1]?.trim().slice(0, 100) || trimmed.slice(0, 100),
          descricao: trimmed,
          responsavel: null,
          prazo: null,
          prioridade: 'MEDIA',
        })
        break
      }
    }
  }

  // If no patterns found, suggest the whole text as context
  if (tarefas.length === 0) {
    const sentences = text.split(/[.!?\n]+/).filter(s => s.trim().length > 15).slice(0, 10)
    for (const s of sentences) {
      tarefas.push({
        titulo: s.trim().slice(0, 100),
        descricao: s.trim(),
        responsavel: null,
        prazo: null,
        prioridade: 'MEDIA',
      })
    }
  }

  return {
    resumo: 'Análise realizada por extração de padrões (sem IA). Revise as tarefas extraídas.',
    tarefas,
  }
}
