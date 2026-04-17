import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 120

type Mensagem = { role: 'user' | 'assistant'; content: string }
type EntrevistaContexto = {
  respondente: string
  cargo?: string | null
  area?: string | null
  texto: string
}

const SYSTEM_PROMPT = `Você é um consultor senior da Exact BI analisando entrevistas com funcionários de empresas clientes.

Você vai receber uma ou mais transcrições de entrevistas reais e o usuário (consultor) vai fazer perguntas sobre elas. Sua missão é responder com base EXCLUSIVAMENTE no que está nas transcrições.

Regras:
1. NUNCA invente informações que não estão nas entrevistas.
2. Quando citar algo que alguém disse, use aspas e indique quem disse: Ex: "[...]" — fulano, gerente.
3. Se a pergunta não puder ser respondida com base nas entrevistas, diga isso claramente em vez de inventar.
4. Seja direto. Responda em português de forma objetiva e útil.
5. Se o consultor pedir uma análise, siga a metodologia Exact BI: convergências, divergências, sinais fracos, priorização 80/20.
6. Quando houver sinais de problemas graves (assédio, discriminação, ética), destaque claramente.
7. Não use linguagem corporativa vazia ("engajamento", "fit cultural") — fale como consultor que entende de gente e negócio.`

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'placeholder') {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY não configurada no servidor.' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const entrevistas: EntrevistaContexto[] = body.entrevistas ?? []
    const historico: Mensagem[] = body.historico ?? []
    const pergunta: string = body.pergunta ?? ''

    if (!entrevistas.length) {
      return NextResponse.json(
        { error: 'Selecione ao menos uma entrevista para conversar.' },
        { status: 400 }
      )
    }
    if (!pergunta.trim()) {
      return NextResponse.json({ error: 'Pergunta vazia.' }, { status: 400 })
    }

    const contextoEntrevistas = entrevistas
      .map((e, i) => {
        const cab = `Entrevistado ${i + 1}: ${e.respondente}${
          e.cargo ? ' — ' + e.cargo : ''
        }${e.area ? ' — ' + e.area : ''}`
        return `===== ${cab} =====\n${e.texto}\n===== fim =====`
      })
      .join('\n\n')

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Transcrições disponíveis para consulta:\n\n${contextoEntrevistas}`,
      },
      ...historico.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: pergunta },
    ]

    const modelo = (body.modelo as string) || 'gpt-4o-mini'

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelo,
        temperature: 0.4,
        messages,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[chat entrevistas] OpenAI error:', res.status, errBody)
      return NextResponse.json(
        { error: `Erro na OpenAI: ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const resposta = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({
      resposta,
      metadata: {
        modelo,
        entrevistasConsultadas: entrevistas.length,
        tokensUsados: data.usage ?? null,
      },
    })
  } catch (err) {
    console.error('[chat entrevistas] erro:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno.' },
      { status: 500 }
    )
  }
}
