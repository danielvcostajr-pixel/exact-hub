import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const maxDuration = 60 // seconds
export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Voce e um assistente especializado em gestao de projetos e acompanhamento de reunioes de consultoria empresarial.

Sua tarefa e analisar transcricoes de reunioes e gerar uma ata estruturada completa. Voce deve retornar um JSON com a seguinte estrutura:

{
  "resumo": "Resumo executivo da reuniao em 2-4 frases, incluindo participantes, objetivo e contexto",
  "pauta": ["Item 1 discutido", "Item 2 discutido", ...],
  "decisoes": ["Decisao 1 tomada na reuniao", "Decisao 2", ...],
  "tarefas": [
    {
      "titulo": "Descricao concisa da tarefa (max 100 caracteres)",
      "descricao": "Detalhamento completo do que precisa ser feito, incluindo contexto da reuniao",
      "responsavel": "Nome da pessoa responsavel (se mencionado, senao null)",
      "prazo": "YYYY-MM-DD (se mencionado ou inferivel, senao null)",
      "prioridade": "BAIXA | MEDIA | ALTA | URGENTE",
      "categoria": "Nome do grupo/tema desta tarefa (ex: Onboarding, Infraestrutura, Comercial)"
    }
  ],
  "proximosPassos": ["Proximo passo 1", "Proximo passo 2", ...]
}

Regras:
1. Extraia TODAS as atividades, tarefas e compromissos mencionados - nao perca nenhum
2. Para prazos relativos como "amanha", "sexta-feira", "semana que vem", converta para data absoluta YYYY-MM-DD usando a data de hoje como referencia
3. Infira a prioridade do contexto: urgente/hoje/ASAP = URGENTE, importante/critico = ALTA, normal = MEDIA, pode esperar = BAIXA
4. Agrupe tarefas por categoria/tema quando possivel
5. Inclua contexto relevante na descricao de cada tarefa
6. Se alguem "ficou de fazer" algo, isso e uma tarefa
7. Se houve uma decisao que gera uma acao, extraia como tarefa
8. Responda SOMENTE com JSON valido, sem texto adicional fora do JSON`

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
      const { extractText } = await import('unpdf')
      const uint8 = new Uint8Array(buffer)
      const { text } = await extractText(uint8)
      return text
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
          { error: 'Nao foi possivel extrair texto do arquivo. Tente copiar e colar o conteudo diretamente.' },
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

    // Truncate if too long (avoid token limits)
    const MAX_CHARS = 80000
    if (transcricao.length > MAX_CHARS) {
      transcricao = transcricao.slice(0, MAX_CHARS)
    }

    // Get today's date for relative date conversion
    const hoje = new Date().toISOString().split('T')[0]
    const diaSemana = new Date().toLocaleDateString('pt-BR', { weekday: 'long' })

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json(fallbackParse(transcricao))
    }

    // Qwen 3.6 Plus Free via OpenRouter (custo $0, rapido, suporta JSON)
    const openrouter = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
    })

    const completion = await openrouter.chat.completions.create({
      model: 'qwen/qwen3.6-plus:free',
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Data de hoje: ${hoje} (${diaSemana})\n\nAnalise a seguinte transcricao de reuniao, gere a ata completa e extraia todas as tarefas e atividades:\n\n${transcricao}`,
        },
      ],
    })

    const responseText = completion.choices[0]?.message?.content?.trim()
    if (!responseText) {
      return NextResponse.json({ error: 'Resposta vazia do modelo' }, { status: 500 })
    }

    // Extract JSON from response (handle possible markdown code blocks)
    let jsonText = responseText
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonText = jsonMatch[1].trim()

    // Remove /no_think tags if present (Qwen thinking mode)
    jsonText = jsonText.replace(/<\/?think>/g, '').trim()

    const parsed = JSON.parse(jsonText)

    // Ensure required fields exist
    if (!parsed.tarefas) parsed.tarefas = []
    if (!parsed.resumo) parsed.resumo = 'Analise concluida.'
    if (!parsed.pauta) parsed.pauta = []
    if (!parsed.decisoes) parsed.decisoes = []
    if (!parsed.proximosPassos) parsed.proximosPassos = []

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Erro na analise de reuniao:', err)
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ error: `Erro ao processar transcricao: ${message}` }, { status: 500 })
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
    categoria: string
  }> = []

  const lines = text.split(/[\n]+/).map((l) => l.trim()).filter((l) => l.length > 10)

  const taskPatterns = [
    /(?:precisa|deve|devemos|tem que|temos que|vai|vamos|ficou de|fica responsável|ação|tarefa|pendência|próximo passo|definir|criar|implementar|enviar|preparar|revisar|organizar|agendar|marcar|fazer|resolver|verificar|atualizar|montar|elaborar|entregar|concluir)\b/i,
  ]

  const responsavelPattern =
    /(?:responsável|responsavel|encarregado|atribuído a|assignado):?\s*(\w+(?:\s+\w+)?)/i

  const datePattern =
    /(?:prazo|até|data|deadline|para o dia|para dia|até dia):?\s*([\d]{1,2}[\/.]\d{1,2}(?:[\/.]\d{2,4})?)/i

  for (const line of lines) {
    const isTask = taskPatterns.some((p) => p.test(line))
    if (!isTask) continue

    const respMatch = responsavelPattern.exec(line)
    const responsavel = respMatch ? respMatch[1].trim() : null

    const dateMatch = datePattern.exec(line)
    let prazo: string | null = null
    if (dateMatch) {
      const parts = dateMatch[1].split(/[\/.]+/)
      if (parts.length >= 2) {
        const day = parts[0].padStart(2, '0')
        const month = parts[1].padStart(2, '0')
        const year = parts[2]
          ? parts[2].length === 2 ? `20${parts[2]}` : parts[2]
          : new Date().getFullYear().toString()
        prazo = `${year}-${month}-${day}`
      }
    }

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
      categoria: 'Geral',
    })
  }

  if (tarefas.length === 0) {
    const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter((s) => s.length > 20).slice(0, 10)
    for (const s of sentences) {
      tarefas.push({
        titulo: s.slice(0, 100),
        descricao: s,
        responsavel: null,
        prazo: null,
        prioridade: 'MEDIA',
        categoria: 'Geral',
      })
    }
  }

  return {
    resumo: 'Analise realizada por extracao de padroes (configure a OPENROUTER_API_KEY para analise com IA). Revise as tarefas extraidas.',
    pauta: [],
    decisoes: [],
    tarefas,
    proximosPassos: [],
  }
}
