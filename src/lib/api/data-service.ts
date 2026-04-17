import { createClient } from '@/lib/supabase/client'
import type { Empresa } from '@/types'
import { v4 as uuid } from 'uuid'

// ── Helpers ──────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString()
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

export async function getUsuariosByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Usuario').select('id, nome, email, papel').eq('empresaId', empresaId).order('nome')
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
  const nowIso = now()
  const { data: empresa, error } = await supabase
    .from('Empresa')
    .insert({ id: uuid(), ...data, ativa: true, createdAt: nowIso, updatedAt: nowIso })
    .select()
    .single()
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
      .from('BusinessModelCanvas').update({ blocos: canvasData, updatedAt: now() }).eq('id', existing.id).select().single()
    if (error) throw error
    return data
  } else {
    const nowIso = now()
    const { data, error } = await supabase
      .from('BusinessModelCanvas')
      .insert({ id: uuid(), empresaId, blocos: canvasData, versao: 1, createdAt: nowIso, updatedAt: nowIso })
      .select().single()
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
      .from('ProjecaoFinanceira').update({ dados: projecaoData, anoBase, updatedAt: now() }).eq('id', existing.id).select().single()
    if (error) throw error
    return data
  } else {
    const nowIso = now()
    const { data, error } = await supabase
      .from('ProjecaoFinanceira')
      .insert({ id: uuid(), empresaId, nome: 'Projecao Principal', anoBase, dados: projecaoData, createdAt: nowIso, updatedAt: nowIso })
      .select().single()
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
  const nowIso = now()
  const { data, error } = await supabase.from('OKR').insert({
    id: uuid(), empresaId: params.empresaId, objetivo: params.objetivo,
    descricao: params.descricao ?? null, prazoInicio: params.prazoInicio,
    prazoFim: params.prazoFim, responsavelId: params.responsavelId,
    status: params.status ?? 'ATIVO',
    createdAt: nowIso, updatedAt: nowIso,
  }).select('*, KeyResult(*)').single()
  if (error) throw error
  return data
}

export async function updateOKR(okrId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('OKR').update({ ...updates, updatedAt: now() }).eq('id', okrId).select('*, KeyResult(*)').single()
  if (error) throw error
  return data
}

export async function createKeyResult(params: {
  okrId: string; descricao: string; metaInicial: number; metaAlvo: number
  valorAtual?: number; unidade?: string; responsavelId: string
}) {
  const supabase = createClient()
  const nowIso = now()
  const { data, error } = await supabase.from('KeyResult').insert({
    id: uuid(), okrId: params.okrId, descricao: params.descricao,
    metaInicial: params.metaInicial, metaAlvo: params.metaAlvo,
    valorAtual: params.valorAtual ?? 0, unidade: params.unidade ?? '%',
    progressoPerc: 0, responsavelId: params.responsavelId,
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateKeyResult(krId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('KeyResult').update({ ...updates, updatedAt: now() }).eq('id', krId).select().single()
  if (error) throw error
  return data
}

export async function deleteOKR(okrId: string) {
  const supabase = createClient()
  // Limpar PlanoAcao vinculados (não tem cascade no schema)
  await supabase.from('PlanoAcao').delete().eq('okrId', okrId)
  // KeyResult tem cascade, será deletado automaticamente
  const { error } = await supabase.from('OKR').delete().eq('id', okrId)
  if (error) throw error
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
  okrId?: string
}) {
  const supabase = createClient()
  const nowIso = now()
  const { data, error } = await supabase.from('Tarefa').insert({
    id: uuid(), empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, status: params.status ?? 'BACKLOG',
    prioridade: params.prioridade ?? 'MEDIA', prazo: params.prazo ?? null,
    responsavelId: params.responsavelId ?? null, criadoPorId: params.criadoPorId,
    okrId: params.okrId ?? null, createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateTarefa(tarefaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Tarefa').update({ ...updates, updatedAt: now() }).eq('id', tarefaId).select().single()
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
  const nowIso = now()
  const { data, error } = await supabase.from('Rotina').insert({
    id: uuid(), empresaId: params.empresaId, nome: params.nome,
    descricao: params.descricao ?? null, frequencia: params.frequencia,
    categoria: params.categoria ?? null, diaSemana: params.diaSemana ?? null,
    diaMes: params.diaMes ?? null, hora: params.hora ?? null,
    responsavelId: params.responsavelId, ativo: true,
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateRotina(rotinaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Rotina').update({ ...updates, updatedAt: now() }).eq('id', rotinaId).select().single()
  if (error) throw error
  return data
}

export async function deleteRotina(rotinaId: string) {
  const supabase = createClient()
  // ItemControle e ExecucaoItemControle têm cascade no schema
  const { error } = await supabase.from('Rotina').delete().eq('id', rotinaId)
  if (error) throw error
}

export async function createItemControle(params: {
  rotinaId: string; descricao: string; ordem: number; obrigatorio?: boolean
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('ItemControle').insert({
    id: uuid(), rotinaId: params.rotinaId, descricao: params.descricao,
    ordem: params.ordem, obrigatorio: params.obrigatorio ?? false,
  }).select().single()
  if (error) throw error
  return data
}

export async function saveExecucaoRotina(params: {
  itens: { itemControleId: string; concluido: boolean; observacao?: string }[]
  executadoPorId: string
}) {
  const supabase = createClient()
  const dataExecucao = now()
  const rows = params.itens.map(it => ({
    id: uuid(),
    itemControleId: it.itemControleId,
    concluido: it.concluido,
    observacao: it.observacao ?? null,
    executadoPorId: params.executadoPorId,
    dataExecucao,
    createdAt: dataExecucao,
  }))
  const { data, error } = await supabase.from('ExecucaoItemControle').insert(rows).select()
  if (error) throw error
  return data
}

export async function getUltimaExecucaoRotina(rotinaId: string) {
  const supabase = createClient()
  // Get ItemControle IDs for this rotina
  const { data: itens } = await supabase.from('ItemControle').select('id').eq('rotinaId', rotinaId)
  if (!itens || itens.length === 0) return null
  const itemIds = itens.map(i => i.id)
  // Get latest execution for any of these items
  const { data, error } = await supabase
    .from('ExecucaoItemControle').select('*')
    .in('itemControleId', itemIds)
    .order('dataExecucao', { ascending: false })
    .limit(itemIds.length)
  if (error) throw error
  return data
}

export async function getHistoricoExecucoesRotina(rotinaId: string, dias: number = 30) {
  const supabase = createClient()
  const { data: itens } = await supabase.from('ItemControle').select('id').eq('rotinaId', rotinaId)
  if (!itens || itens.length === 0) return []
  const itemIds = itens.map(i => i.id)
  const desde = new Date()
  desde.setDate(desde.getDate() - dias)
  const { data, error } = await supabase
    .from('ExecucaoItemControle')
    .select('id, itemControleId, dataExecucao, concluido, observacao, executadoPorId')
    .in('itemControleId', itemIds)
    .gte('dataExecucao', desde.toISOString())
    .order('dataExecucao', { ascending: false })
  if (error) throw error
  return data ?? []
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
  const nowIso = now()
  const { data, error } = await supabase.from('PlanoAcao').insert({
    id: uuid(), empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, okrId: params.okrId ?? null,
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function deletePlanoAcao(planoId: string) {
  const supabase = createClient()
  // Acao e PapelAcaoRACI têm cascade no schema
  const { error } = await supabase.from('PlanoAcao').delete().eq('id', planoId)
  if (error) throw error
}

export async function createAcao(params: {
  planoId: string; descricao: string; prazo?: string; status?: string
}) {
  const supabase = createClient()
  const nowIso = now()
  const { data, error } = await supabase.from('Acao').insert({
    id: uuid(), planoId: params.planoId, descricao: params.descricao,
    prazo: params.prazo ?? null, status: params.status ?? 'PENDENTE',
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateAcao(acaoId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Acao').update({ ...updates, updatedAt: now() }).eq('id', acaoId).select().single()
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
  const nowIso = now()
  const { data, error } = await supabase.from('Conversa').insert({
    id: uuid(), empresaId, titulo: titulo ?? 'Chat Principal',
    createdAt: nowIso, updatedAt: nowIso,
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
    id: uuid(), conversaId: params.conversaId, conteudo: params.conteudo, remetenteId: params.remetenteId,
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
  const nowIso = now()
  const { data, error } = await supabase.from('Reuniao').insert({
    id: uuid(), empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, dataHora: params.dataHora,
    duracaoMinutos: params.duracaoMinutos ?? 60, local: params.local ?? null,
    linkReuniao: params.linkReuniao ?? null, status: params.status ?? 'AGENDADA',
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateReuniao(reuniaoId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Reuniao').update({ ...updates, updatedAt: now() }).eq('id', reuniaoId).select().single()
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
    id: uuid(), empresaId: params.empresaId, usuarioId: userId,
    descricao: params.descricao ?? null, data: params.data,
    horaInicio: params.horaInicio ?? null, horaFim: params.horaFim ?? null,
    duracaoMinutos: params.duracaoMinutos, categoria: params.categoria ?? null,
    createdAt: now(),
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
  tarefasConcluidas?: unknown; tarefasEmAndamento?: unknown; problemas?: string
  proximaSemana?: string; kpis?: Record<string, unknown>; criadoPorId: string
}) {
  const supabase = createClient()
  const nowIso = now()
  const { data, error } = await supabase.from('RelatorioSemanal').insert({
    id: uuid(), empresaId: params.empresaId, semanaInicio: params.semanaInicio,
    semanaFim: params.semanaFim, resumoExecutivo: params.resumoExecutivo ?? '',
    tarefasConcluidas: params.tarefasConcluidas ?? [],
    tarefasEmAndamento: params.tarefasEmAndamento ?? [],
    problemas: params.problemas ?? null, proximaSemana: params.proximaSemana ?? null,
    kpis: params.kpis ?? null, criadoPorId: params.criadoPorId,
    createdAt: nowIso, updatedAt: nowIso,
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
  const nowIso = now()
  const { data, error } = await supabase.from('Entrevista').insert({
    id: uuid(), empresaId: params.empresaId, titulo: params.titulo,
    descricao: params.descricao ?? null, perguntas: params.perguntas,
    criadoPorId: params.criadoPorId, status: 'RASCUNHO',
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateEntrevista(entrevistaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase.from('Entrevista').update({ ...updates, updatedAt: now() }).eq('id', entrevistaId).select().single()
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

export async function createResposta(params: {
  entrevistaId: string; respondente: string; cargo?: string; area?: string; respostas: Record<string, string | number>
}) {
  const supabase = createClient()
  const { data, error } = await supabase.from('RespostaEntrevista').insert({
    id: uuid(), entrevistaId: params.entrevistaId, respondente: params.respondente,
    cargo: params.cargo ?? null, area: params.area ?? null, respostas: params.respostas,
    createdAt: now(),
  }).select().single()
  if (error) throw error
  return data
}

// ── Quick Wins ──────────────────────────────────────────────────────────────

function calcQuadrante(impacto: number, esforco: number): string {
  const score = impacto / esforco
  if (score >= 3) return 'PRIORIDADE MAXIMA'
  if (score >= 2) return 'Alta Prioridade'
  if (score >= 1.5) return 'Media Prioridade'
  return 'Baixa Prioridade'
}

export async function getQuickWinsByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('QuickWin').select('*').eq('empresaId', empresaId)
    .order('impacto', { ascending: false })
  if (error) throw error
  return data
}

export async function createQuickWin(params: {
  empresaId: string; titulo: string; categoria: string
  impacto?: number; esforco?: number
}) {
  const supabase = createClient()
  const impacto = params.impacto ?? 5
  const esforco = params.esforco ?? 5
  const nowIso = now()
  const { data, error } = await supabase.from('QuickWin').insert({
    id: uuid(),
    empresaId: params.empresaId,
    titulo: params.titulo,
    categoria: params.categoria,
    impacto,
    esforco,
    quadrante: calcQuadrante(impacto, esforco),
    aplicavel: true,
    status: 'PENDENTE',
    createdAt: nowIso,
    updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateQuickWin(quickWinId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  if (updates.impacto !== undefined || updates.esforco !== undefined) {
    const { data: current } = await supabase.from('QuickWin').select('impacto, esforco').eq('id', quickWinId).single()
    if (current) {
      const imp = (updates.impacto as number) ?? current.impacto
      const esf = (updates.esforco as number) ?? current.esforco
      updates.quadrante = calcQuadrante(imp, esf)
    }
  }
  const { data, error } = await supabase.from('QuickWin').update({ ...updates, updatedAt: now() }).eq('id', quickWinId).select().single()
  if (error) throw error
  return data
}

export async function deleteQuickWin(quickWinId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('QuickWin').delete().eq('id', quickWinId)
  if (error) throw error
}

export async function seedQuickWinsParaEmpresa(empresaId: string) {
  const { QUICK_WINS_TEMPLATE } = await import('@/lib/quick-wins-template')
  const supabase = createClient()
  const nowIso = now()
  const rows = QUICK_WINS_TEMPLATE.map(t => ({
    id: uuid(),
    empresaId,
    titulo: t.titulo,
    categoria: t.categoria,
    impacto: t.impacto,
    esforco: t.esforco,
    quadrante: calcQuadrante(t.impacto, t.esforco),
    aplicavel: true,
    status: 'PENDENTE' as const,
    createdAt: nowIso,
    updatedAt: nowIso,
  }))
  const { data, error } = await supabase.from('QuickWin').insert(rows).select()
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
  const nowIso = now()
  const { data, error } = await supabase.from('MemoriaCliente').insert({
    id: uuid(), empresaId: params.empresaId, conteudo: params.conteudo,
    versao, geradoPorId: params.geradoPorId,
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

// ── Simuladores ──────────────────────────────────────────────────────────────

export async function getSimuladorByEmpresa(empresaId: string, tipo: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Simulador').select('*').eq('empresaId', empresaId).eq('tipo', tipo)
    .order('createdAt', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function getSimuladorHistorico(empresaId: string, tipo: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Simulador').select('id, nome, createdAt, inputs, outputs')
    .eq('empresaId', empresaId).eq('tipo', tipo)
    .order('createdAt', { ascending: false }).limit(20)
  if (error) throw error
  return data
}

export async function saveSimulador(params: {
  empresaId: string; tipo: string; nome: string; inputs: unknown; outputs: unknown; criadoPorId: string
}) {
  const supabase = createClient()
  // Always create a new record (historico)
  const nowIso = now()
  const { data, error } = await supabase.from('Simulador').insert({
    id: uuid(), empresaId: params.empresaId, tipo: params.tipo, nome: params.nome,
    inputs: params.inputs, outputs: params.outputs,
    criadoPorId: params.criadoPorId, ativoParaCliente: false,
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function deleteSimulacao(simuladorId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('Simulador').delete().eq('id', simuladorId)
  if (error) throw error
}

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN Functions
// ══════════════════════════════════════════════════════════════════════════════

export async function getAllUsuarios() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Usuario').select('*, empresa:Empresa!empresaId(id, razaoSocial, nomeFantasia)')
    .order('nome')
  if (error) throw error
  return data
}

export async function createUsuario(params: {
  email: string; nome: string; papel: string; empresaId?: string
}) {
  const supabase = createClient()
  // Create auth user first
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: params.email,
    password: 'ExactHub2026!',
    email_confirm: true,
  })
  if (authErr) {
    // Fallback: try to just insert in Usuario table (auth user might already exist)
    const nowIso = now()
    const { data, error } = await supabase.from('Usuario').insert({
      id: uuid(), email: params.email, nome: params.nome,
      papel: params.papel, empresaId: params.empresaId ?? null, ativo: true,
      createdAt: nowIso, updatedAt: nowIso,
    }).select().single()
    if (error) throw error
    return data
  }
  // Insert in Usuario table with auth user id
  const nowIso = now()
  const { data, error } = await supabase.from('Usuario').insert({
    id: authData.user.id, email: params.email, nome: params.nome,
    papel: params.papel, empresaId: params.empresaId ?? null, ativo: true,
    createdAt: nowIso, updatedAt: nowIso,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateUsuario(usuarioId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Usuario').update({ ...updates }).eq('id', usuarioId).select().single()
  if (error) throw error
  return data
}

export async function toggleUsuarioAtivo(usuarioId: string) {
  const supabase = createClient()
  const { data: user } = await supabase.from('Usuario').select('ativo').eq('id', usuarioId).single()
  if (!user) throw new Error('Usuario nao encontrado')
  const { data, error } = await supabase
    .from('Usuario').update({ ativo: !user.ativo }).eq('id', usuarioId).select().single()
  if (error) throw error
  return data
}

export async function getAllEmpresasAdmin() {
  const supabase = createClient()
  const { data, error } = await supabase.from('Empresa').select('*').order('razaoSocial')
  if (error) throw error
  return data
}

export async function updateEmpresa(empresaId: string, updates: Record<string, unknown>) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Empresa').update({ ...updates }).eq('id', empresaId).select().single()
  if (error) throw error
  return data
}

export async function getSystemStats() {
  const supabase = createClient()
  const [usuarios, empresas] = await Promise.all([
    supabase.from('Usuario').select('id, papel, ativo'),
    supabase.from('Empresa').select('id, ativa'),
  ])
  const users = usuarios.data ?? []
  const emps = empresas.data ?? []
  return {
    totalUsuarios: users.length,
    usuariosAtivos: users.filter(u => u.ativo).length,
    consultores: users.filter(u => u.papel === 'CONSULTOR').length,
    clientes: users.filter(u => u.papel === 'CLIENTE').length,
    admins: users.filter(u => u.papel === 'ADMIN').length,
    totalEmpresas: emps.length,
    empresasAtivas: emps.filter(e => e.ativa).length,
  }
}

// ── Transcrições de Entrevistas (biblioteca persistida) ──────────────────────

export type TranscricaoEntrevista = {
  id: string
  empresaId: string
  respondente: string
  cargo: string | null
  area: string | null
  nomeArquivo: string
  textoExtraido: string
  dataEntrevista: string | null
  notas: string | null
  analise: unknown
  createdAt: string
  updatedAt: string
}

export async function listarTranscricoesEntrevistas(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('TranscricaoEntrevista')
    .select('*')
    .eq('empresaId', empresaId)
    .order('createdAt', { ascending: false })
  if (error) throw error
  return (data ?? []) as TranscricaoEntrevista[]
}

export async function criarTranscricaoEntrevista(input: {
  empresaId: string
  respondente: string
  cargo?: string
  area?: string
  nomeArquivo: string
  textoExtraido: string
  dataEntrevista?: string | null
  notas?: string | null
}) {
  const supabase = createClient()
  const userId = await getCurrentUserId()
  const { data, error } = await supabase
    .from('TranscricaoEntrevista')
    .insert({
      id: uuid(),
      empresaId: input.empresaId,
      respondente: input.respondente,
      cargo: input.cargo ?? null,
      area: input.area ?? null,
      nomeArquivo: input.nomeArquivo,
      textoExtraido: input.textoExtraido,
      dataEntrevista: input.dataEntrevista ?? null,
      notas: input.notas ?? null,
      analise: null,
      criadoPorId: userId,
      createdAt: now(),
      updatedAt: now(),
    })
    .select()
    .single()
  if (error) throw error
  return data as TranscricaoEntrevista
}

export async function deletarTranscricaoEntrevista(id: string) {
  const supabase = createClient()
  const { error } = await supabase.from('TranscricaoEntrevista').delete().eq('id', id)
  if (error) throw error
}

export async function atualizarAnaliseTranscricao(id: string, analise: unknown) {
  const supabase = createClient()
  const { error } = await supabase
    .from('TranscricaoEntrevista')
    .update({ analise, updatedAt: now() })
    .eq('id', id)
  if (error) throw error
}
