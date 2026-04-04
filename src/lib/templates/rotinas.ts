export type FrequenciaRotina = 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL'
export type CategoriaRotina = 'Financeiro' | 'Comercial' | 'Operacional' | 'RH' | 'Marketing'

export interface ItemControleTemplate {
  descricao: string
  obrigatorio: boolean
  tipo: 'CHECK' | 'NUMERO' | 'TEXTO'
  dica?: string
}

export interface RotinaTemplate {
  id: string
  nome: string
  descricao: string
  categoria: CategoriaRotina
  frequencia: FrequenciaRotina
  diaExecucao: string
  itens: ItemControleTemplate[]
}

export const ROTINAS_TEMPLATES: RotinaTemplate[] = [
  {
    id: 'tpl-fechamento-financeiro',
    nome: 'Fechamento Financeiro Mensal',
    descricao:
      'Rotina completa de fechamento do mes financeiro: conciliacao bancaria, DRE parcial, contas a pagar/receber e provisoes.',
    categoria: 'Financeiro',
    frequencia: 'MENSAL',
    diaExecucao: 'Dia 5',
    itens: [
      {
        descricao: 'Conciliar extrato bancario com lancamentos do sistema',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'Verificar todas as contas correntes e aplicacoes',
      },
      {
        descricao: 'Conferir contas a receber em aberto',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'Identificar inadimplentes acima de 30 dias',
      },
      {
        descricao: 'Conferir contas a pagar vencidas e a vencer',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'Priorizar pagamentos criticos',
      },
      {
        descricao: 'Calcular DRE parcial do mes',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'Comparar com orcamento previsto',
      },
      {
        descricao: 'Registrar provisoes do mes (ferias, 13o, etc.)',
        obrigatorio: true,
        tipo: 'CHECK',
      },
      {
        descricao: 'Apurar resultado do mes (lucro/prejuizo)',
        obrigatorio: true,
        tipo: 'NUMERO',
        dica: 'Valor em R$',
      },
      {
        descricao: 'Enviar relatorio financeiro para a diretoria',
        obrigatorio: true,
        tipo: 'CHECK',
      },
      {
        descricao: 'Observacoes e pendencias do fechamento',
        obrigatorio: false,
        tipo: 'TEXTO',
      },
    ],
  },
  {
    id: 'tpl-reuniao-comercial',
    nome: 'Reuniao Comercial Semanal',
    descricao:
      'Reuniao de alinhamento da equipe comercial: pipeline, metas, oportunidades e proximos passos.',
    categoria: 'Comercial',
    frequencia: 'SEMANAL',
    diaExecucao: 'Segunda-feira',
    itens: [
      {
        descricao: 'Revisar pipeline de vendas atualizado',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'Atualizar status de cada oportunidade',
      },
      {
        descricao: 'Conferir meta semanal x realizado',
        obrigatorio: true,
        tipo: 'NUMERO',
        dica: 'Percentual de atingimento',
      },
      {
        descricao: 'Identificar oportunidades quentes para semana',
        obrigatorio: true,
        tipo: 'CHECK',
      },
      {
        descricao: 'Definir acoes de follow-up com clientes',
        obrigatorio: true,
        tipo: 'CHECK',
      },
      {
        descricao: 'Registrar dificuldades e pontos de atencao',
        obrigatorio: false,
        tipo: 'TEXTO',
      },
    ],
  },
  {
    id: 'tpl-controle-estoque',
    nome: 'Controle de Estoque',
    descricao:
      'Verificacao semanal do estoque: inventario, rupturas, produtos vencendo e pedidos de reposicao.',
    categoria: 'Operacional',
    frequencia: 'SEMANAL',
    diaExecucao: 'Sexta-feira',
    itens: [
      {
        descricao: 'Realizar contagem fisica dos produtos criticos',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'SKUs A e B da curva ABC',
      },
      {
        descricao: 'Identificar rupturas ou risco de ruptura',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'Estoque abaixo do ponto de pedido',
      },
      {
        descricao: 'Verificar produtos proximos ao vencimento',
        obrigatorio: true,
        tipo: 'CHECK',
        dica: 'Priorizar saida de produtos com menos de 30 dias',
      },
      {
        descricao: 'Gerar pedidos de reposicao necessarios',
        obrigatorio: false,
        tipo: 'CHECK',
      },
    ],
  },
]
