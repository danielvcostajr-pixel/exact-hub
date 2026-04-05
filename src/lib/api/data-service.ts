import { createClient } from '@/lib/supabase/client'
import type { Empresa } from '@/types'
import { v4 as uuid } from 'uuid'

// ── Helpers ──────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString()
}

async function supabaseClient() {
  return createClient()
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('Usuario').select('*').eq('id', user.id).maybeSingle()
  return data
}

export async function getUsuarios() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Usuario').select('id, nome, email, papel').order('nome')
  if (error) throw error
  return data
}

// ── Empresas ─────────────────────────────────────────────────────────────────

export async function getEmpresas() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Empresa').select('*').eq('ativa', true).order('razaoSocial')
  if (error) throw error
  return data
}

export async function getEmpresa(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Empresa').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createEmpresa(data: Partial<Empresa>) {
  const supabase = createClient()
  const { data: empresa, error } = await supabase
    .from('Empresa').insert({ id: uuid(), ...data, ativa: true }).select().single()
  if (error) throw error
  return empresa
}

export async function deleteEmpresa(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('Empresa').update({ ativa: false }).eq('id', id)
  if (error) throw error
}

// ── Canvas de Negocio ────────────────────────────────────────────────────────

export async function getCanvasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('BusinessModelCanvas').select('*').eq('empresaId', empresaId)
    .order('updatedAt', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function saveCanvas(empresaId: string, canvasData: Record<string, unknown>) {
  const supabase = createClient()
  const existing = await getCanvasByEmpresa(empresaId)
  if (existing) {
    const { data, error } = await supabase
      .from('BusinessModelCanvas').update({ blocos: canvasData }).eq('id', existing.id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('BusinessModelCanvas').insert({ empresaId, blocos: canvasData, versao: 1 }).select().single()
    if (error) throw error
    return data
  }
}

// ── Projecao Financeira ──────────────────────────────────────────────────────

export async function getProjecaoByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('ProjecaoFinanceira').select('*').eq('empresaId', empresaId)
    .order('updatedAt', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function saveProjecao(empresaId: string, projecaoData: Record<string, unknown>) {
  const supabase = createClient()
  const existing = await getProjecaoByEmpresa(empresaId)
  const anoBase = (projecaoData as { anoBase?: number }).anoBase ?? new Date().getFullYear()
  if (existing) {
    const { data, error } = await supabase
      .from('ProjecaoFinanceira').update({ dados: projecaoData, anoBase }).eq('id', existing.id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('ProjecaoFinanceira').insert({ empresaId, nome: 'Projecao Principal', anoBase, dados: projecaoData }).select().single()
    if (error) throw error
    return data
  }
}

// ── OKRs ─────────────────────────────────────────────────────────────────────

export async function getOKRsByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('OKR')
    .select('*, responsavel:Usuario!responsavelId(id, nome), KeyResult(*, responsavel:Usuario!responsavelId(id, nome))')
    .eq('empresaId', empresaId).order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

export async function createOKR(params: {
  empresaId: string; objetivo: string; descricao?: string
  prazoInicio: string; prazoFim: string; responsavelId: string; status?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('OKR').insert({
    empresaId: params.empresaId, objetivo: params.objetivo,
    descricao: params.descricao ?? null, prazoInicio: params.prazoInicio,
    prazoFim: params.prazoFim, responsavelId: params.responsavelId,
    status: params.status ?? 'ATIVO',
  }).select('*, KeyResult(*)').single()
  if (error) throw error
  return data
}

export async function updateOKR(okrId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('OKR').update({ ...updates }).eq('id', okrId).select('*, KeyResult(*)').single()
  if (error) throw error
  return data
}

export async function createKeyResult(params: {
  okrId: string; descricao: string; metaInicial: number; metaAlvo: number
  valorAtual?: number; unidade?: string; responsavelId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('KeyResult').insert({
    okrId: params.okrId, descricao: params.descricao,
    metaInicial: params.metaInicial, metaAlvo: params.metaAlvo,
    valorAtual: params.valorAtual ?? 0, unidade: params.unidade ?? '%',
    progressoPerc: 0, responsavelId: params.responsavelId,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateKeyResult(krId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('KeyResult').update({ ...updates }).eq('id', krId).select().single()
  if (error) throw error
  return data
}

// ── Tarefas ──────────────────────────────────────────────────────────────────

export async function getTarefasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Tarefa').select('*, responsavel:Usuario!responsavelId(id, nome)')
    .eq('empresaId', empresaId).order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

export async function createTarefa(params: {
  empresaId: string; titulo: string; descricao?: string; status?: string
  prioridade?: string; prazo?: string; responsavelId?: string; criadoPorId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Tarefa').insert({
    empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, status: params.status ?? 'BACKLOG',
    prioridade: params.prioridade ?? 'MEDIA', prazo: params.prazo ?? null,
    responsavelId: params.responsavelId ?? null, criadoPorId: params.criadoPorId,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateTarefa(tarefaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Tarefa').update({ ...updates }).eq('id', tarefaId).select().single()
  if (error) throw error
  return data
}

export async function deleteTarefa(tarefaId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('Tarefa').delete().eq('id', tarefaId)
  if (error) throw error
}

// ── Rotinas ──────────────────────────────────────────────────────────────────

export async function getRotinasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Rotina').select('*, ItemControle(*)').eq('empresaId', empresaId).order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

export async function createRotina(params: {
  empresaId: string; nome: string; descricao?: string; frequencia: string
  categoria?: string; diaSemana?: number; diaMes?: number; hora?: string; responsavelId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Rotina').insert({
    empresaId: params.empresaId, nome: params.nome,
    descricao: params.descricao ?? null, frequencia: params.frequencia,
    categoria: params.categoria ?? null, diaSemana: params.diaSemana ?? null,
    diaMes: params.diaMes ?? null, hora: params.hora ?? null,
    responsavelId: params.responsavelId, ativo: true,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateRotina(rotinaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Rotina').update({ ...updates }).eq('id', rotinaId).select().single()
  if (error) throw error
  return data
}

export async function createItemControle(params: {
  rotinaId: string; descricao: string; ordem: number; obrigatorio?: boolean
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('ItemControle').insert({
    rotinaId: params.rotinaId, descricao: params.descricao,
    ordem: params.ordem, obrigatorio: params.obrigatorio ?? false,
  }).select().single()
  if (error) throw error
  return data
}

// ── Planos de Acao ───────────────────────────────────────────────────────────

export async function getPlanosAcaoByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('PlanoAcao').select('*, Acao(*)').eq('empresaId', empresaId).order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

export async function createPlanoAcao(params: {
  empresaId: string; titulo: string; descricao?: string; okrId?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('PlanoAcao').insert({
    empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, okrId: params.okrId ?? null,
  }).select().single()
  if (error) throw error
  return data
}

export async function createAcao(params: {
  planoId: string; descricao: string; prazo?: string; status?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Acao').insert({
    planoId: params.planoId, descricao: params.descricao,
    prazo: params.prazo ?? null, status: params.status ?? 'PENDENTE',
  }).select().single()
  if (error) throw error
  return data
}

export async function updateAcao(acaoId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Acao').update({ ...updates }).eq('id', acaoId).select().single()
  if (error) throw error
  return data
}

// ── Chat / Conversas ─────────────────────────────────────────────────────────

export async function getConversaByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Conversa').select('*').eq('empresaId', empresaId)
    .order('updatedAt', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function getOrCreateConversa(empresaId: string, titulo?: string) {
  const existing = await getConversaByEmpresa(empresaId)
  if (existing) return existing
  const supabase = createClient()
  const { data, error } = await supabase.from('Conversa').insert({
    empresaId, titulo: titulo ?? 'Chat Principal',
  }).select().single()
  if (error) throw error
  return data
}

export async function getMensagens(conversaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Mensagem').select('*, remetente:Usuario!remetenteId(id, nome, papel)')
    .eq('conversaId', conversaId).order('createdAt', { ascending: true })
  if (error) throw error
  return data
}

export async function sendMensagem(params: { conversaId: string; conteudo: string; remetenteId: string }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Mensagem').insert({
    conversaId: params.conversaId, conteudo: params.conteudo, remetenteId: params.remetenteId,
  }).select('*, remetente:Usuario!remetenteId(id, nome, papel)').single()
  if (error) throw error
  // Update conversa updatedAt
  await supabase.from('Conversa').update({ updatedAt: now() }).eq('id', params.conversaId)
  return data
}

// ── Reunioes ─────────────────────────────────────────────────────────────────

export async function getReunioesByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Reuniao').select('*').eq('empresaId', empresaId).order('dataHora', { ascending: false })
  if (error) throw error
  return data
}

export async function createReuniao(params: {
  empresaId: string; titulo: string; descricao?: string; dataHora: string
  duracaoMinutos?: number; local?: string; linkReuniao?: string; status?: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Reuniao').insert({
    empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, dataHora: params.dataHora,
    duracaoMinutos: params.duracaoMinutos ?? 60, local: params.local ?? null,
    linkReuniao: params.linkReuniao ?? null, status: params.status ?? 'AGENDADA',
  }).select().single()
  if (error) throw error
  return data
}

export async function updateReuniao(reuniaoId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Reuniao').update({ ...updates }).eq('id', reuniaoId).select().single()
  if (error) throw error
  return data
}

// ── Timesheet ────────────────────────────────────────────────────────────────

export async function getTimesheetByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Timesheet').select('*').eq('empresaId', empresaId).order('data', { ascending: false })
  if (error) throw error
  return data
}

export async function getTimesheetByUsuario(usuarioId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Timesheet').select('*, empresa:Empresa!empresaId(id, nomeFantasia, razaoSocial)')
    .eq('usuarioId', usuarioId).order('data', { ascending: false })
  if (error) throw error
  return data
}

export async function getAllTimesheet() {
  const supabase = createClient()
  const userId = await getCurrentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('Timesheet').select('*, empresa:Empresa!empresaId(id, nomeFantasia, razaoSocial)')
    .eq('usuarioId', userId).order('data', { ascending: false })
  if (error) throw error
  return data
}

export async function createTimeEntry(params: {
  empresaId: string; descricao?: string; data: string; horaInicio?: string
  horaFim?: string; duracaoMinutos: number; categoria?: string
}) {
  const supabase = createClient()
  const userId = await getCurrentUserId()
  if (!userId) throw new Error('Usuario nao autenticado')
  const { data, error } = await supabase.from('Timesheet').insert({
    empresaId: params.empresaId, usuarioId: userId,
    descricao: params.descricao ?? null, data: params.data,
    horaInicio: params.horaInicio ?? null, horaFim: params.horaFim ?? null,
    duracaoMinutos: params.duracaoMinutos, categoria: params.categoria ?? null,
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteTimeEntry(entryId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('Timesheet').delete().eq('id', entryId)
  if (error) throw error
}

// ── Relatorios Semanais ──────────────────────────────────────────────────────

export async function getRelatoriosByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('RelatorioSemanal').select('*').eq('empresaId', empresaId).order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

export async function createRelatorio(params: {
  empresaId: string; semanaInicio: string; semanaFim: string; resumoExecutivo?: string
  tarefasConcluidas?: string; tarefasEmAndamento?: string; problemas?: string
  proximaSemana?: string; kpis?: Record<string, unknown>; criadoPorId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('RelatorioSemanal').insert({
    empresaId: params.empresaId, semanaInicio: params.semanaInicio,
    semanaFim: params.semanaFim, resumoExecutivo: params.resumoExecutivo ?? null,
    tarefasConcluidas: params.tarefasConcluidas ?? null,
    tarefasEmAndamento: params.tarefasEmAndamento ?? null,
    problemas: params.problemas ?? null, proximaSemana: params.proximaSemana ?? null,
    kpis: params.kpis ?? null, criadoPorId: params.criadoPorId,
  }).select().single()
  if (error) throw error
  return data
}

// ── Entrevistas ──────────────────────────────────────────────────────────────

export async function getEntrevistasByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Entrevista').select('*').eq('empresaId', empresaId).order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

export async function createEntrevista(params: {
  empresaId: string; titulo: string; descricao?: string; perguntas: unknown; criadoPorId: string
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Entrevista').insert({
    empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, perguntas: params.perguntas,
    criadoPorId: params.criadoPorId, status: 'RASCUNHO',
  }).select().single()
  if (error) throw error
  return data
}

export async function updateEntrevista(entrevistaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Entrevista').update({ ...updates }).eq('id', entrevistaId).select().single()
  if (error) throw error
  return data
}

export async function getRespostasByEntrevista(entrevistaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('RespostaEntrevista').select('*').eq('entrevistaId', entrevistaId).order('createdAt', { ascending: false })
  if (error) throw error
  return data
}

// ── Memoria do Cliente ───────────────────────────────────────────────────────

export async function getMemoriaByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('MemoriaCliente').select('*').eq('empresaId', empresaId)
    .order('versao', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function saveMemoria(params: {
  empresaId: string; conteudo: string; geradoPorId: string
}) {
  const supabase = createClient()
  const existing = await getMemoriaByEmpresa(params.empresaId)
  const versao = existing ? existing.versao + 1 : 1
  const { data, error } = await supabase.from('MemoriaCliente').insert({
    empresaId: params.empresaId, conteudo: params.conteudo,
    versao, geradoPorId: params.geradoPorId,
  }).select().single()
  if (error) throw error
  return data
}

// ── Simuladores ──────────────────────────────────────────────────────────────

export async function getSimuladorByEmpresa(empresaId: string, tipo: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Simulador').select('*').eq('empresaId', empresaId).eq('tipo', tipo)
    .order('updatedAt', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function saveSimulador(params: {
  empresaId: string; tipo: string; nome: string; inputs: unknown; outputs: unknown; criadoPorId: string
}) {
  const supabase = createClient()
  const existing = await getSimuladorByEmpresa(params.empresaId, params.tipo)
  if (existing) {
    const { data, error } = await supabase.from('Simulador').update({
      inputs: params.inputs, outputs: params.outputs, nome: params.nome,
    }).eq('id', existing.id).select().single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase.from('Simulador').insert({
      empresaId: params.empresaId, tipo: params.tipo, nome: params.nome,
      inputs: params.inputs, outputs: params.outputs,
      criadoPorId: params.criadoPorId, ativoParaCliente: false,
    }).select().single()
    if (error) throw error
    return data
  }
}
