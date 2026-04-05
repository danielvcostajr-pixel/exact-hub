import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60 // seconds
export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Voce e um consultor senior especializado em gestao de projetos e pos-reuniao. Voce tem experiencia real em consultoria empresarial e sabe diferenciar CONVERSA de ACTION ITEM.

Sua tarefa e analisar transcricoes de reunioes e gerar uma ata estruturada. Voce deve INTERPRETAR o conteudo da reuniao com inteligencia — NAO e para tratar cada frase ou paragrafo como uma tarefa.

IMPORTANTE — O que NAO e tarefa:
- Contexto ou informacoes compartilhadas (ex: "o faturamento cresceu 10%")
- Opinioes ou comentarios (ex: "acho que deveriamos melhorar isso")
- Descricoes de problemas sem acao definida (ex: "o sistema esta lento")
- Informacoes de background ou historico
- Saudacoes, agradecimentos, encerramento

O que E tarefa/action item:
- Alguem FICOU DE FAZER algo especifico (ex: "Marcos vai puxar os dados ate amanha")
- Uma DECISAO que gera uma ACAO concreta (ex: "decidimos contratar um novo dev — Daniel vai abrir a vaga")
- Um COMPROMISSO assumido por alguem (ex: "eu mando o email hoje")
- Um PROXIMO PASSO com responsavel claro ou inferivel
- Algo que precisa ser ENTREGUE com prazo (ex: "a proposta precisa estar pronta ate sexta")

Retorne um JSON com esta estrutura:

{
  "resumo": "Resumo executivo da reuniao em 2-4 frases. Inclua: quem participou, qual era o objetivo, quais foram as principais conclusoes. Seja conciso mas informativo.",
  "pauta": ["Tema 1 efetivamente discutido", "Tema 2 discutido", ...],
  "decisoes": ["Decisao concreta 1 tomada pelo grupo", "Decisao 2", ...],
  "tarefas": [
    {
      "titulo": "Verbo no infinitivo + o que fazer (max 100 chars). Ex: Mapear fluxo atual de onboarding",
      "descricao": "Contexto completo: por que essa tarefa existe, o que motivou na reuniao, qual o entregavel esperado, e quaisquer dependencias",
      "responsavel": "Nome da pessoa que ficou responsavel (se mencionado ou claramente inferivel, senao null)",
      "prazo": "YYYY-MM-DD (converta prazos relativos usando a data de hoje. Se nao mencionado, null)",
      "prioridade": "URGENTE (hoje/ASAP/bloqueador) | ALTA (essa semana/critico) | MEDIA (prazo normal) | BAIXA (quando possivel/sem urgencia)",
      "categoria": "Tema/area desta tarefa (ex: Onboarding, Comercial, Infraestrutura, Produto, Financeiro, RH)"
    }
  ],
  "proximosPassos": ["Proximo passo 1 com contexto", "Proximo passo 2", ...]
}

Regras de ouro:
1. QUALIDADE > QUANTIDADE: Extraia apenas action items REAIS. Se a reuniao teve 30 minutos de conversa e 3 tarefas concretas, retorne 3 tarefas — nao 30.
2. INTERPRETE o contexto: entenda o que foi discutido e o que realmente virou compromisso.
3. AGRUPE por categoria/tema: se ha multiplas tarefas sobre o mesmo assunto, use a mesma categoria.
4. CONTEXTO na descricao: cada tarefa deve ter contexto suficiente para alguem que nao estava na reuniao entender o que fazer e por que.
5. PRAZOS: converta "amanha", "sexta", "semana que vem", "fim do mes" para datas absolutas YYYY-MM-DD.
6. PRIORIDADE: infira da urgencia expressa na reuniao, nao invente urgencia.
7. Se o texto NAO parece ser uma transcricao de reuniao (ex: texto aleatorio, lista de compras, etc), retorne resumo explicando isso e array de tarefas vazio.
8. Responda SOMENTE com JSON valido, sem texto adicional.`

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
      const extracted = await extractTextFromFile(body.fileBase64, body.fileName)
      transcricao = String(extracted || '')
      if (transcricao.trim().length < 20) {
        return NextResponse.json(
          { error: 'Nao foi possivel extrair texto do arquivo. Tente copiar e colar o conteudo diretamente.' },
          { status: 400 },
        )
      }
    } else if (body.transcricao) {
      transcricao = String(body.transcricao)
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

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json(fallbackParse(transcricao))
    }

    // OpenAI GPT-5.4 Nano via native fetch (avoids SDK "t.trim" crash)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-nano',
        temperature: 0.3,
        max_completion_tokens: 8192,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Data de hoje: ${hoje} (${diaSemana})\n\nAnalise a seguinte transcricao de reuniao, gere a ata completa e extraia todas as tarefas e atividades:\n\n${transcricao}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('OpenAI API error:', res.status, errBody)
      return NextResponse.json(
        { error: `Erro na API OpenAI: ${res.status}` },
        { status: 502 },
      )
    }

    const data = await res.json()
    const responseText = data.choices[0]?.message?.content || ''

    if (!responseText) {
      return NextResponse.json({ error: 'Resposta vazia do modelo' }, { status: 500 })
    }

    // Extract JSON from response (handle possible markdown code blocks)
    let jsonText = responseText
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) jsonText = jsonMatch[1].trim()

    // Remove thinking tags if present
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
