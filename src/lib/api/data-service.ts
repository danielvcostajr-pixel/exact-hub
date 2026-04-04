import { createClient } from '@/lib/supabase/client'
import type { Empresa } from '@/types'

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
    .insert({ ...data, ativa: true })
    .select()
    .single()
  if (error) throw error
  return empresa
}

export async function deleteEmpresa(id: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('Empresa')
    .update({ ativa: false })
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

  // Try to find existing canvas for this empresa
  const existing = await getCanvasByEmpresa(empresaId)

  if (existing) {
    const { data, error } = await supabase
      .from('BusinessModelCanvas')
      .update({
        blocos: canvasData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('BusinessModelCanvas')
      .insert({
        empresaId,
        blocos: canvasData,
        versao: 1,
      })
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

  if (existing) {
    const { data, error } = await supabase
      .from('ProjecaoFinanceira')
      .update({
        dados: projecaoData,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  } else {
    const { data, error } = await supabase
      .from('ProjecaoFinanceira')
      .insert({
        empresaId,
        dados: projecaoData,
      })
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
    .select('*, KeyResult(*)')
    .eq('empresaId', empresaId)
    .order('createdAt', { ascending: false })
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

// ── Timesheet ─────────────────────────────────────────────────────────────────

export async function getTimesheetByEmpresa(empresaId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('Timesheet')
    .select('*')
    .eq('empresaId', empresaId)
    .order('data', { ascending: false })
  if (error) throw error
  return data
}
