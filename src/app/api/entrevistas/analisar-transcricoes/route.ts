import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import mammoth from 'mammoth'
import { extractText } from 'unpdf'
import { montarSystemPrompt } from '@/lib/entrevistas/skill-references'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min — análises podem ser longas

type ContextoCliente = {
  nomeEmpresa?: string
  segmento?: string
  porte?: string
  desafiosConhecidos?: string
}

async function extrairTextoPDF(buffer: ArrayBuffer): Promise<string> {
  const result = await extractText(new Uint8Array(buffer), { mergePages: true })
  return Array.isArray(result.text) ? result.text.join('\n') : result.text
}

async function extrairTextoDOCX(buffer: ArrayBuffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
  return result.value
}

async function extrairTextoDoArquivo(file: File): Promise<{ nome: string; texto: string }> {
  const buffer = await file.arrayBuffer()
  const nomeLower = file.name.toLowerCase()

  if (nomeLower.endsWith('.pdf')) {
    return { nome: file.name, texto: await extrairTextoPDF(buffer) }
  }
  if (nomeLower.endsWith('.docx')) {
    return { nome: file.name, texto: await extrairTextoDOCX(buffer) }
  }
  if (nomeLower.endsWith('.txt') || file.type === 'text/plain') {
    return { nome: file.name, texto: new TextDecoder().decode(buffer) }
  }
  throw new Error(`Formato não suportado: ${file.name}. Use PDF, DOCX ou TXT.`)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const arquivos = formData.getAll('arquivos') as File[]

    if (!arquivos.length) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    // API key: preferência pro header do usuário; fallback pro env
    const apiKeyHeader = req.headers.get('x-openai-key') ?? ''
    const apiKey = apiKeyHeader || process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key ausente. Informe no campo ou configure OPENAI_API_KEY no .env.' },
        { status: 400 }
      )
    }

    const modelo = (formData.get('modelo') as string) || 'gpt-4o-mini'

    const contexto: ContextoCliente = {
      nomeEmpresa: (formData.get('nomeEmpresa') as string) || undefined,
      segmento: (formData.get('segmento') as string) || undefined,
      porte: (formData.get('porte') as string) || undefined,
      desafiosConhecidos: (formData.get('desafiosConhecidos') as string) || undefined,
    }

    // 1) Extrair texto de cada arquivo
    const transcricoes: { nome: string; texto: string }[] = []
    for (const file of arquivos) {
      try {
        const { nome, texto } = await extrairTextoDoArquivo(file)
        if (!texto.trim()) {
          return NextResponse.json(
            { error: `Arquivo "${nome}" está vazio ou não foi possível extrair texto.` },
            { status: 400 }
          )
        }
        transcricoes.push({ nome, texto })
      } catch (err) {
        return NextResponse.json(
          { error: `Erro ao processar "${file.name}": ${(err as Error).message}` },
          { status: 400 }
        )
      }
    }

    // 2) Montar prompt
    const systemPrompt = montarSystemPrompt(contexto)
    const userPrompt = [
      `Abaixo estão ${transcricoes.length} transcrição(ões) de entrevistas realizadas com a equipe${
        contexto.nomeEmpresa ? ' da empresa ' + contexto.nomeEmpresa : ''
      }. Analise seguindo a metodologia e retorne o JSON estruturado conforme especificado.`,
      '',
      ...transcricoes.map(
        (t, i) =>
          `===== ENTREVISTA ${i + 1} — arquivo: ${t.nome} =====\n\n${t.texto}\n\n===== FIM DA ENTREVISTA ${i + 1} =====`
      ),
    ].join('\n')

    // 3) Chamar OpenAI
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: modelo,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const conteudo = completion.choices[0]?.message?.content
    if (!conteudo) {
      return NextResponse.json({ error: 'Resposta vazia da OpenAI.' }, { status: 500 })
    }

    let analise: unknown
    try {
      analise = JSON.parse(conteudo)
    } catch {
      return NextResponse.json(
        { error: 'A IA retornou um JSON inválido. Tente novamente ou troque o modelo.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      analise,
      metadata: {
        modelo,
        totalArquivos: transcricoes.length,
        arquivosProcessados: transcricoes.map((t) => t.nome),
        tokensUsados: completion.usage ?? null,
      },
    })
  } catch (err) {
    console.error('[analisar-transcricoes] erro:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Erro interno ao analisar transcrições.' },
      { status: 500 }
    )
  }
}
