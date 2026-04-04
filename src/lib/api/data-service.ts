import { createClient } from '@/lib/supabase/client'
import type { Empresa } from '@/types'
import { v4 as uuid } from 'uuid'

function now() {
  return new Date().toISOString()
}

// ── Empresas ──────────────────────────────────────────────────────────────────

export async function getEmpresas() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Empresa')
    .select('*')
    .eq('ativa', true)
    .order('razaoSocial')
  if (error) throw error
  return data
}

export async function getEmpresa(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Empresa')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createEmpresa(data: Partial<Empresa>) {
  const supabase = createClient()
  const { data: empresa, error } = await supabase
    .from('Empresa')
    .insert({ id: uuid(), ...data, ativa: true, updatedAt: now() })
    .select()
    .single()
  if (error) throw error
  return empresa
}

export async function deleteEmpresa(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('Empresa')
    .update({ ativa: false, updatedAt: now() })
    .eq('id', id)
  if (error) throw error
}

// ── Canvas de Negocio ─────────────────────────────────────────────────────────

export async function getCanvasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('BusinessModelCanvas')
    .select('*')
    .eq('empresaId', empresaId)
    .order('updatedAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveCanvas(empresaId: string, canvasData: Record<string, unknown>) {
  const supabase = createClient()
  const existing = await getCanvasByEmpresa(empresaId)

  if (existing) {
    const { data, error } = await supabase
      .from('BusinessModelCanvas')
      .update({ blocos: canvasData, updatedAt: now() })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('BusinessModelCanvas')
      .insert({ id: uuid(), empresaId, blocos: canvasData, versao: 1, updatedAt: now() })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ── Projecao Financeira ───────────────────────────────────────────────────────
export async function getProjecaoByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ProjecaoFinanceira')
    .select('*')
    .eq('empresaId', empresaId)
    .order('updatedAt', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function saveProjecao(empresaId: string, projecaoData: Record<string, unknown>) {
  const supabase = createClient()
  const existing = await getProjecaoByEmpresa(empresaId)

  const anoBase = (projecaoData as { anoBase?: number }).anoBase ?? new Date().getFullYear()

  if (existing) {
    const { data, error } = await supabase
      .from('ProjecaoFinanceira')
      .update({ dados: projecaoData, anoBase })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('ProjecaoFinanceira')
      .insert({ empresaId, nome: 'Projecao Principal', anoBase, dados: projecaoData })
      .select()
      .single()
    if (error) throw error
    return data
  }
}

// ── OKRs ──────────────────────────────────────────────────────────────────────

export async function getOKRsByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('OKR')
    .select('*, responsavel:Usuario!responsavelId(id, nome), KeyResult(*, responsavel:Usuario!responsavelId(id, nome))')
    .eq('empresaId', empresaId)
    .order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

export async function createOKR(params: {
  empresaId: string
  objetivo: string
  descricao?: string
  prazoInicio: string
  prazoFim: string
  responsavelId: string
  responsavelNome?: string
  status?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('OKR')
    .insert({
      id: uuid(),
      empresaId: params.empresaId,
      objetivo: params.objetivo,
      descricao: params.descricao ?? null,
      prazoInicio: params.prazoInicio,
      prazoFim: params.prazoFim,
      responsavelId: params.responsavelId,
      status: params.status ?? 'ATIVO',
      updatedAt: now(),
    })
    .select('*, KeyResult(*)')
    .single()
  if (error) throw error
  return data
}

export async function updateOKR(okrId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('OKR')
    .update({ ...updates, updatedAt: now() })
    .eq('id', okrId)
    .select('*, KeyResult(*)')
    .single()
  if (error) throw error
  return data
}

export async function createKeyResult(params: {
  okrId: string
  descricao: string
  metaInicial: number
  metaAlvo: number
  valorAtual?: number
  unidade?: string
  responsavelId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('KeyResult')
    .insert({
      id: uuid(),
      okrId: params.okrId,
      descricao: params.descricao,
      metaInicial: params.metaInicial,
      metaAlvo: params.metaAlvo,
      valorAtual: params.valorAtual ?? 0,
      unidade: params.unidade ?? '%',
      progressoPerc: 0,
      responsavelId: params.responsavelId,
      updatedAt: now(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateKeyResult(krId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('KeyResult')
    .update({ ...updates, updatedAt: now() })
    .eq('id', krId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Tarefas ───────────────────────────────────────────────────────────────────

export async function getTarefasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Tarefa')
    .select('*')
    .eq('empresaId', empresaId)
    .order('prazo', { ascending: true })
  if (error) throw error
  return data
}

export async function createTarefa(params: {
  empresaId: string
  titulo: string
  descricao?: string
  status?: string
  prioridade?: string
  prazo?: string
  responsavelId?: string
  criadoPorId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Tarefa')
    .insert({
      id: uuid(),
      empresaId: params.empresaId,
      titulo: params.titulo,
      descricao: params.descricao ?? null,
      status: params.status ?? 'BACKLOG',
      prioridade: params.prioridade ?? 'MEDIA',
      prazo: params.prazo ?? null,
      responsavelId: params.responsavelId ?? null,
      criadoPorId: params.criadoPorId,
      updatedAt: now(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateTarefa(tarefaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Tarefa')
    .update({ ...updates, updatedAt: now() })
    .eq('id', tarefaId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Entrevistas ───────────────────────────────────────────────────────────────

export async function getEntrevistasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Entrevista')
    .select('*')
    .eq('empresaId', empresaId)
    .order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

// ── Reunioes ──────────────────────────────────────────────────────────────────

export async function getReunioesByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Reuniao')
    .select('*')
    .eq('empresaId', empresaId)
    .order('dataHora', { ascending: false })
  if (error) throw error
  return data
}

// ── Rotinas ──────────────────────────────────────────────────────────────────

export async function getRotinasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Rotina')
    .select('*')
    .eq('empresaId', empresaId)
    .order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

// ── Planos de Acao ───────────────────────────────────────────────────────────

export async function getPlanosAcaoByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('PlanoAcao')
    .select('*, Acao(*)')
    .eq('empresaId', empresaId)
    .order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

// ── Auth helpers ─────────────────────────────────────────────────────────────

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}
