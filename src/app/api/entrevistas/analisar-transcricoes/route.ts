import { NextRequest, NextResponse } from 'next/server'
import { montarSystemPrompt } from '@/lib/entrevistas/skill-references'

export const runtime = 'nodejs'
export const maxDuration = 300

type EntrevistaParaAnalise = {
  respondente: string
  cargo?: string | null
  area?: string | null
  texto: string
}

/**
 * Recebe transcrições já extraídas (texto puro) e devolve análise estruturada.
 * A chave da OpenAI vem EXCLUSIVAMENTE de process.env — NUNCA da UI.
 */
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
    const entrevistas: EntrevistaParaAnalise[] = body.entrevistas ?? []
    if (!entrevistas.length) {
      return NextResponse.json({ error: 'Envie ao menos uma entrevista.' }, { status: 400 })
    }

    const contexto = {
      nomeEmpresa: body.nomeEmpresa as string | undefined,
      segmento: body.segmento as string | undefined,
      porte: body.porte as string | undefined,
      desafiosConhecidos: body.desafiosConhecidos as string | undefined,
    }

    const systemPrompt = montarSystemPrompt(contexto)
    const userPrompt = [
      `Abaixo estão ${entrevistas.length} transcrição(ões) de entrevistas${
        contexto.nomeEmpresa ? ' da empresa ' + contexto.nomeEmpresa : ''
      }. Analise seguindo a metodologia e retorne o JSON estruturado.`,
      '',
      ...entrevistas.map((e, i) => {
        const cabec = `Entrevistado: ${e.respondente}${e.cargo ? ' — ' + e.cargo : ''}${
          e.area ? ' — ' + e.area : ''
        }`
        return `===== ENTREVISTA ${i + 1} — ${cabec} =====\n\n${e.texto}\n\n===== FIM ${i + 1} =====`
      }),
    ].join('\n')

    const modelo = (body.modelo as string) || 'gpt-4o-mini'

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelo,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[analisar-transcricoes] OpenAI error:', res.status, errBody)
      return NextResponse.json(
        { error: `Erro na OpenAI: ${res.status}` },
        { status: 502 }
      )
    }

    const data = await res.json()
    const conteudo = data.choices?.[0]?.message?.content
    if (!conteudo) {
      return NextResponse.json({ error: 'Resposta vazia.' }, { status: 500 })
    }

    let analise: unknown
    try {
      analise = JSON.parse(conteudo)
    } catch {
      return NextResponse.json(
        { error: 'JSON inválido retornado pela IA.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analise,
      metadata: {
        modelo,
        totalEntrevistas: entrevistas.length,
        tokensUsados: data.usage ?? null,
      },
    })
  } catch (err) {
    console.error('[analisar-transcricoes] erro:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno.' },
      { status: 500 }
    )
  }
}
