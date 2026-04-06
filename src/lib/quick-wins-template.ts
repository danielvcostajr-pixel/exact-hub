export interface QuickWinTemplate {
  titulo: string
  categoria: string
  impacto: number
  esforco: number
}

export const QUICK_WINS_TEMPLATE: QuickWinTemplate[] = [
  // ── Gestao de Caixa ──
  { titulo: 'Migracao de caixa parado para CDB/Tesouro Selic', categoria: 'Gestao de Caixa', impacto: 9, esforco: 2 },
  { titulo: 'Separacao de contas (operacional/reserva/investimento)', categoria: 'Gestao de Caixa', impacto: 7, esforco: 2 },
  { titulo: 'Criacao de reserva de emergencia investida', categoria: 'Gestao de Caixa', impacto: 8, esforco: 3 },
  { titulo: 'Aplicacao automatica do excedente de caixa', categoria: 'Gestao de Caixa', impacto: 8, esforco: 3 },
  { titulo: 'Analise e ajuste do prazo medio de recebimento', categoria: 'Gestao de Caixa', impacto: 7, esforco: 4 },

  // ── Eficiencia Operacional ──
  { titulo: 'Eliminacao de despesas recorrentes desnecessarias', categoria: 'Eficiencia Operacional', impacto: 8, esforco: 2 },
  { titulo: 'Implementacao de fluxo de caixa semanal', categoria: 'Eficiencia Operacional', impacto: 9, esforco: 3 },
  { titulo: 'Rotina de conciliacao bancaria semanal', categoria: 'Eficiencia Operacional', impacto: 8, esforco: 3 },
  { titulo: 'Padronizacao de fechamento de caixa diario', categoria: 'Eficiencia Operacional', impacto: 7, esforco: 3 },
  { titulo: 'Criacao de politica de compras minima', categoria: 'Eficiencia Operacional', impacto: 7, esforco: 3 },
  { titulo: 'Separacao pessoa fisica x pessoa juridica', categoria: 'Eficiencia Operacional', impacto: 9, esforco: 4 },

  // ── Custos Financeiros ──
  { titulo: 'Migracao para conta digital empresarial', categoria: 'Custos Financeiros', impacto: 7, esforco: 2 },
  { titulo: 'Eliminacao de seguros e produtos nao utilizados', categoria: 'Custos Financeiros', impacto: 7, esforco: 2 },
  { titulo: 'Reducao de tarifa de maquina de cartao', categoria: 'Custos Financeiros', impacto: 9, esforco: 3 },
  { titulo: 'Reducao de tarifa bancaria', categoria: 'Custos Financeiros', impacto: 8, esforco: 3 },
  { titulo: 'Antecipacao de recebiveis com taxa competitiva', categoria: 'Custos Financeiros', impacto: 8, esforco: 4 },
  { titulo: 'Renegociacao de emprestimos ativos', categoria: 'Custos Financeiros', impacto: 9, esforco: 5 },

  // ── Precificacao e Margem ──
  { titulo: 'Ajuste de precos desatualizados ha +12 meses', categoria: 'Precificacao e Margem', impacto: 7, esforco: 2 },
  { titulo: 'Implementacao de preco minimo por categoria', categoria: 'Precificacao e Margem', impacto: 8, esforco: 3 },
  { titulo: 'Eliminacao de descontos sem criterio', categoria: 'Precificacao e Margem', impacto: 8, esforco: 3 },
  { titulo: 'Revisao de produtos com margem negativa', categoria: 'Precificacao e Margem', impacto: 9, esforco: 4 },
  { titulo: 'Revisao de composicao de custo dos produtos principais', categoria: 'Precificacao e Margem', impacto: 8, esforco: 5 },

  // ── Comercial ──
  { titulo: 'Oferta relampago para giro de estoque', categoria: 'Comercial', impacto: 7, esforco: 2 },
  { titulo: 'Cobranca ativa de inadimplentes +30 dias', categoria: 'Comercial', impacto: 9, esforco: 3 },
  { titulo: 'Upsell para clientes ativos de ticket baixo', categoria: 'Comercial', impacto: 7, esforco: 3 },
  { titulo: 'Programa de indicacao simples', categoria: 'Comercial', impacto: 7, esforco: 3 },
  { titulo: 'Reativacao de clientes inativos (ultimos 6 meses)', categoria: 'Comercial', impacto: 8, esforco: 4 },

  // ── Gestao de Pessoas ──
  { titulo: 'Rotina de feedback semanal com pessoas-chave', categoria: 'Gestao de Pessoas', impacto: 7, esforco: 2 },
  { titulo: 'Definicao de metas semanais para equipe comercial', categoria: 'Gestao de Pessoas', impacto: 8, esforco: 3 },
  { titulo: 'Reuniao semanal de 15min de alinhamento', categoria: 'Gestao de Pessoas', impacto: 6, esforco: 2 },
  { titulo: 'Eliminacao de horas extras desnecessarias', categoria: 'Gestao de Pessoas', impacto: 7, esforco: 4 },
  { titulo: 'Revisao de escala de trabalho', categoria: 'Gestao de Pessoas', impacto: 7, esforco: 4 },

  // ── Gestao de Estoque ──
  { titulo: 'Venda promocional de produtos parados ha +90 dias', categoria: 'Gestao de Estoque', impacto: 8, esforco: 3 },
  { titulo: 'Implementacao de curva ABC de estoque', categoria: 'Gestao de Estoque', impacto: 9, esforco: 4 },
  { titulo: 'Reducao de itens com giro baixo (categoria C)', categoria: 'Gestao de Estoque', impacto: 7, esforco: 4 },

  // ── Gestao de Fornecedores ──
  { titulo: 'Eliminacao de fornecedores inativos ou baixo volume', categoria: 'Gestao de Fornecedores', impacto: 6, esforco: 2 },
  { titulo: 'Revisao de contratos anuais', categoria: 'Gestao de Fornecedores', impacto: 7, esforco: 3 },
  { titulo: 'Renegociacao dos 3 maiores fornecedores', categoria: 'Gestao de Fornecedores', impacto: 8, esforco: 4 },
  { titulo: 'Cotacao paralela de insumos criticos', categoria: 'Gestao de Fornecedores', impacto: 7, esforco: 4 },
  { titulo: 'Consolidacao de fornecedores para ganho de escala', categoria: 'Gestao de Fornecedores', impacto: 7, esforco: 5 },

  // ── Tecnologia ──
  { titulo: 'Migracao de planilhas criticas para nuvem', categoria: 'Tecnologia', impacto: 7, esforco: 2 },
  { titulo: 'Criacao de template de proposta comercial', categoria: 'Tecnologia', impacto: 6, esforco: 2 },
  { titulo: 'Implementacao de assinatura digital', categoria: 'Tecnologia', impacto: 6, esforco: 3 },
  { titulo: 'Automacao de envio de boleto/cobranca', categoria: 'Tecnologia', impacto: 7, esforco: 4 },
  { titulo: 'Integracao bancaria com sistema de gestao', categoria: 'Tecnologia', impacto: 8, esforco: 5 },

  // ── Compliance ──
  { titulo: 'Verificacao de pendencias no CNPJ (Receita/Sefaz)', categoria: 'Compliance', impacto: 8, esforco: 3 },
  { titulo: 'Ajuste de pro-labore e distribuicao de lucro', categoria: 'Compliance', impacto: 8, esforco: 4 },
  { titulo: 'Emissao de contrato formal com principais clientes B2B', categoria: 'Compliance', impacto: 7, esforco: 4 },
  { titulo: 'Regularizacao de tributos atrasados com parcelamento', categoria: 'Compliance', impacto: 9, esforco: 5 },
  { titulo: 'Revisao de regime tributario (Simples/LP/LR)', categoria: 'Compliance', impacto: 9, esforco: 6 },
]
