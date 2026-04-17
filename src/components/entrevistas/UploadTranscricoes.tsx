'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, Loader2, Sparkles, AlertCircle, X, Key, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type Prioridade = {
  titulo: string
  categoria: 'estrutural' | 'operacional' | 'cultural'
  descricao: string
  frequencia: number
  impactoSeNaoResolver: string
  impactoSeResolver: string
  primeiroPasso: string
  investigarMais: string
}

type Convergencia = {
  tema: string
  frequencia: number
  descricao: string
  citacoes: string[]
}

type Divergencia = {
  tema: string
  visaoA: string
  visaoB: string
  interpretacao: string
}

type SinalFraco = {
  tema: string
  descricao: string
  gravidade: 'baixa' | 'media' | 'alta' | 'critica'
  acaoInvestigativa: string
}

type AnaliseResult = {
  resumoExecutivo: string
  totalEntrevistados: number
  temperaturaEmocional: string
  convergencias: Convergencia[]
  divergencias: Divergencia[]
  sinaisFracos: SinalFraco[]
  ausenciasSignificativas: string[]
  prioridades: Prioridade[]
  oportunidades: {
    talentosSubutilizados: string[]
    quickWins: string[]
    forcasAPreservar: string[]
    ideiasColaboradores: string[]
  }
  alertasEticos: string[]
}

const CATEGORIA_COLORS: Record<Prioridade['categoria'], string> = {
  estrutural: '#EF4444',
  operacional: '#F17522',
  cultural: '#8B5CF6',
}

const GRAVIDADE_COLORS: Record<SinalFraco['gravidade'], string> = {
  baixa: '#6B7280',
  media: '#F59E0B',
  alta: '#F17522',
  critica: '#EF4444',
}

export function UploadTranscricoes({ nomeEmpresa }: { nomeEmpresa?: string }) {
  const [arquivos, setArquivos] = useState<File[]>([])
  const [apiKey, setApiKey] = useState('')
  const [modelo, setModelo] = useState('gpt-4o-mini')
  const [segmento, setSegmento] = useState('')
  const [porte, setPorte] = useState('')
  const [desafios, setDesafios] = useState('')
  const [mostrarContexto, setMostrarContexto] = useState(false)
  const [analisando, setAnalisando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<AnaliseResult | null>(null)
  const [metadata, setMetadata] = useState<{ modelo: string; totalArquivos: number } | null>(null)

  const onFilesSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const novos = Array.from(e.target.files).filter((f) => {
      const n = f.name.toLowerCase()
      return n.endsWith('.pdf') || n.endsWith('.docx') || n.endsWith('.txt')
    })
    setArquivos((prev) => [...prev, ...novos])
    e.target.value = ''
  }, [])

  const removerArquivo = (idx: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== idx))
  }

  const analisar = async () => {
    if (arquivos.length === 0) {
      setErro('Adicione pelo menos uma transcrição.')
      return
    }
    setAnalisando(true)
    setErro(null)
    setResultado(null)

    try {
      const formData = new FormData()
      arquivos.forEach((f) => formData.append('arquivos', f))
      formData.append('modelo', modelo)
      if (nomeEmpresa) formData.append('nomeEmpresa', nomeEmpresa)
      if (segmento) formData.append('segmento', segmento)
      if (porte) formData.append('porte', porte)
      if (desafios) formData.append('desafiosConhecidos', desafios)

      const res = await fetch('/api/entrevistas/analisar-transcricoes', {
        method: 'POST',
        headers: apiKey ? { 'x-openai-key': apiKey } : {},
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falha na análise')

      setResultado(data.analise as AnaliseResult)
      setMetadata(data.metadata)
    } catch (err) {
      setErro((err as Error).message)
    } finally {
      setAnalisando(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Config */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Análise de Transcrições com IA</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Envie transcrições (PDF, DOCX ou TXT) e a IA gerará um diagnóstico seguindo a metodologia
          da Exact BI: convergências, divergências, priorização Pareto 80/20 e mapa de oportunidades.
        </p>

        {/* API Key */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Key size={11} />
            OpenAI API Key <span className="text-muted-foreground/50">(sk-...)</span>
          </Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-... (ou deixe vazio se OPENAI_API_KEY estiver no .env)"
            className="bg-background border-border font-mono text-xs"
          />
          <p className="text-[10px] text-muted-foreground/60">
            A chave não é salva — ela é usada apenas nesta requisição.
          </p>
        </div>

        {/* Modelo */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Modelo</Label>
          <select
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            className="w-full rounded-md bg-background border border-border px-3 py-2 text-sm text-foreground"
          >
            <option value="gpt-4o-mini">gpt-4o-mini (rápido, barato — recomendado)</option>
            <option value="gpt-4o">gpt-4o (mais capaz)</option>
            <option value="gpt-4.1">gpt-4.1 (top-tier)</option>
          </select>
        </div>

        {/* Contexto opcional */}
        <button
          type="button"
          onClick={() => setMostrarContexto(!mostrarContexto)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {mostrarContexto ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Contexto do cliente (opcional — melhora a análise)
        </button>
        {mostrarContexto && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-4 border-l border-border">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Segmento</Label>
              <Input
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                placeholder="Ex: varejo, indústria, serviços..."
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Porte</Label>
              <Input
                value={porte}
                onChange={(e) => setPorte(e.target.value)}
                placeholder="Ex: 25 funcionários"
                className="bg-background border-border text-xs"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">Desafios conhecidos</Label>
              <Textarea
                value={desafios}
                onChange={(e) => setDesafios(e.target.value)}
                placeholder="O que o dono já mencionou como problema?"
                className="bg-background border-border text-xs min-h-[60px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Upload */}
      <div className="rounded-lg border border-dashed border-border bg-card p-5">
        <div className="flex flex-col items-center gap-3">
          <Upload size={20} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Adicione as transcrições</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aceita PDF, DOCX e TXT — múltiplos arquivos permitidos
            </p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              onChange={onFilesSelected}
              className="hidden"
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 transition">
              <FileText size={12} />
              Selecionar arquivos
            </span>
          </label>
        </div>

        {arquivos.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {arquivos.map((f, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-1.5 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={12} className="text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground">{f.name}</span>
                  <span className="text-muted-foreground/50 shrink-0">
                    ({(f.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  onClick={() => removerArquivo(i)}
                  className="text-muted-foreground hover:text-red-500 shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão analisar */}
      <Button
        onClick={analisar}
        disabled={analisando || arquivos.length === 0}
        className="bg-primary hover:bg-primary/90 text-white gap-2"
      >
        {analisando ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Analisando {arquivos.length} transcrição(ões)...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Analisar com IA
          </>
        )}
      </Button>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* Resultado */}
      {resultado && <ResultadoAnalise analise={resultado} metadata={metadata} />}
    </div>
  )
}

function ResultadoAnalise({
  analise,
  metadata,
}: {
  analise: AnaliseResult
  metadata: { modelo: string; totalArquivos: number } | null
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
        <Sparkles size={18} className="text-primary" />
        <div>
          <p className="text-sm font-semibold text-foreground">Análise concluída</p>
          <p className="text-xs text-muted-foreground">
            {metadata?.totalArquivos} transcrição(ões) processada(s) com {metadata?.modelo}
          </p>
        </div>
      </div>

      {/* Alertas éticos */}
      {analise.alertasEticos?.length > 0 && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-red-500" />
            <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Alertas éticos — exigem ação imediata
            </h3>
          </div>
          <ul className="space-y-1 pl-5 list-disc text-xs text-red-700 dark:text-red-400">
            {analise.alertasEticos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Resumo executivo */}
      <Card titulo="Resumo Executivo">
        <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">
          {analise.resumoExecutivo}
        </p>
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border">
          <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
            {analise.totalEntrevistados} entrevistados
          </Badge>
          <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
            {analise.temperaturaEmocional}
          </Badge>
        </div>
      </Card>

      {/* Prioridades */}
      {analise.prioridades?.length > 0 && (
        <Card titulo="Prioridades (Pareto 80/20)">
          <div className="space-y-3">
            {analise.prioridades.map((p, i) => (
              <div key={i} className="rounded-md border border-border bg-background p-3 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <h4 className="text-sm font-semibold text-foreground">
                    {i + 1}. {p.titulo}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge
                      className="text-[10px] text-white"
                      style={{ backgroundColor: CATEGORIA_COLORS[p.categoria] }}
                    >
                      {p.categoria}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                      {p.frequencia} menções
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{p.descricao}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded bg-red-500/5 border border-red-500/20 p-2">
                    <p className="font-semibold text-red-600 dark:text-red-400 mb-0.5">Se NÃO resolver</p>
                    <p className="text-muted-foreground">{p.impactoSeNaoResolver}</p>
                  </div>
                  <div className="rounded bg-green-500/5 border border-green-500/20 p-2">
                    <p className="font-semibold text-green-600 dark:text-green-400 mb-0.5">Se resolver</p>
                    <p className="text-muted-foreground">{p.impactoSeResolver}</p>
                  </div>
                </div>
                <div className="rounded bg-primary/5 border border-primary/20 p-2 text-[11px]">
                  <p className="font-semibold text-primary mb-0.5">Primeiro passo</p>
                  <p className="text-foreground">{p.primeiroPasso}</p>
                </div>
                {p.investigarMais && (
                  <p className="text-[10px] text-muted-foreground italic">
                    A investigar: {p.investigarMais}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Convergências */}
      {analise.convergencias?.length > 0 && (
        <Card titulo="Convergências — O que todos dizem">
          <div className="space-y-2">
            {analise.convergencias.map((c, i) => (
              <div key={i} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{c.tema}</h4>
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                    {c.frequencia} menções
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{c.descricao}</p>
                {c.citacoes?.length > 0 && (
                  <div className="space-y-1 pl-3 border-l-2 border-primary/30">
                    {c.citacoes.map((cit, j) => (
                      <p key={j} className="text-[11px] text-foreground italic">
                        &ldquo;{cit}&rdquo;
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Divergências */}
      {analise.divergencias?.length > 0 && (
        <Card titulo="Divergências — Onde as visões se chocam">
          <div className="space-y-3">
            {analise.divergencias.map((d, i) => (
              <div key={i} className="rounded-md border border-border bg-background p-3 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{d.tema}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="rounded bg-blue-500/5 border border-blue-500/20 p-2 text-xs">
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mb-0.5">Visão A</p>
                    <p className="text-foreground">{d.visaoA}</p>
                  </div>
                  <div className="rounded bg-amber-500/5 border border-amber-500/20 p-2 text-xs">
                    <p className="font-semibold text-amber-600 dark:text-amber-400 mb-0.5">Visão B</p>
                    <p className="text-foreground">{d.visaoB}</p>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  Interpretação: {d.interpretacao}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sinais fracos */}
      {analise.sinaisFracos?.length > 0 && (
        <Card titulo="Sinais fracos — Merecem investigação">
          <div className="space-y-2">
            {analise.sinaisFracos.map((s, i) => (
              <div key={i} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-foreground">{s.tema}</h4>
                  <Badge
                    className="text-[10px] text-white"
                    style={{ backgroundColor: GRAVIDADE_COLORS[s.gravidade] }}
                  >
                    {s.gravidade}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{s.descricao}</p>
                <p className="text-[11px] text-primary">→ {s.acaoInvestigativa}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ausências */}
      {analise.ausenciasSignificativas?.length > 0 && (
        <Card titulo="O que ninguém disse">
          <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground">
            {analise.ausenciasSignificativas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Oportunidades */}
      <Card titulo="Oportunidades">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OpList titulo="Talentos subutilizados" items={analise.oportunidades?.talentosSubutilizados} />
          <OpList titulo="Quick wins" items={analise.oportunidades?.quickWins} />
          <OpList titulo="Forças a preservar" items={analise.oportunidades?.forcasAPreservar} />
          <OpList titulo="Ideias dos colaboradores" items={analise.oportunidades?.ideiasColaboradores} />
        </div>
      </Card>
    </div>
  )
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">{titulo}</h3>
      {children}
    </div>
  )
}

function OpList({ titulo, items }: { titulo: string; items?: string[] }) {
  if (!items || items.length === 0) {
    return (
      <div>
        <p className="text-xs font-semibold text-foreground mb-1">{titulo}</p>
        <p className="text-[11px] text-muted-foreground/50">Nenhum identificado</p>
      </div>
    )
  }
  return (
    <div>
      <p className="text-xs font-semibold text-foreground mb-1">{titulo}</p>
      <ul className="space-y-0.5 pl-4 list-disc text-[11px] text-muted-foreground">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  )
}
