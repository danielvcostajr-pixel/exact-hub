export type StatusTarefa =
  | "BACKLOG"
  | "A_FAZER"
  | "EM_PROGRESSO"
  | "REVISAO"
  | "CONCLUIDA"
  | "CANCELADA"

export type PrioridadeTarefa = "URGENTE" | "ALTA" | "MEDIA" | "BAIXA"

export interface ChecklistItem {
  id: string
  texto: string
  concluido: boolean
}

export interface Comentario {
  id: string
  autor: string
  texto: string
  data: string
  avatar?: string
}

export interface Anexo {
  id: string
  nome: string
  tipo: string
  tamanho: string
}

export interface LogAtividade {
  id: string
  acao: string
  usuario: string
  data: string
}

export interface Tarefa {
  id: string
  titulo: string
  descricao: string
  status: StatusTarefa
  prioridade: PrioridadeTarefa
  responsavel: string
  responsavelAvatar?: string
  dataInicio: string
  prazo: string
  estimativaHoras: number
  horasTrabalhadas: number
  progresso: number
  checklist: ChecklistItem[]
  comentarios: Comentario[]
  anexos: Anexo[]
  atividades: LogAtividade[]
  okrId?: string
  acaoId?: string
  comentariosCount: number
  anexosCount: number
}

export const STATUS_CONFIG: Record<
  StatusTarefa,
  { label: string; color: string; bg: string; border: string }
> = {
  BACKLOG: {
    label: "Backlog",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800",
    border: "border-gray-400",
  },
  A_FAZER: {
    label: "A Fazer",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-500",
  },
  EM_PROGRESSO: {
    label: "Em Progresso",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    border: "border-orange-500",
  },
  REVISAO: {
    label: "Revisao",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-500",
  },
  CONCLUIDA: {
    label: "Concluida",
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    border: "border-green-500",
  },
  CANCELADA: {
    label: "Cancelada",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-500",
  },
}

export const PRIORIDADE_CONFIG: Record<
  PrioridadeTarefa,
  { label: string; color: string; bg: string; dot: string }
> = {
  URGENTE: {
    label: "Urgente",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    dot: "bg-red-500",
  },
  ALTA: {
    label: "Alta",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-100 dark:bg-orange-900/30",
    dot: "bg-orange-500",
  },
  MEDIA: {
    label: "Media",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    dot: "bg-yellow-500",
  },
  BAIXA: {
    label: "Baixa",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    dot: "bg-blue-500",
  },
}

export const MOCK_TAREFAS: Tarefa[] = [
  {
    id: "t1",
    titulo: "Renegociar contrato com fornecedor de TI",
    descricao:
      "Revisar os termos atuais do contrato, identificar cláusulas desfavoráveis e preparar proposta de renegociação para reduzir custos em 15%.",
    status: "EM_PROGRESSO",
    prioridade: "URGENTE",
    responsavel: "Daniel Vieira",
    dataInicio: "2026-03-15",
    prazo: "2026-04-10",
    estimativaHoras: 8,
    horasTrabalhadas: 5,
    progresso: 60,
    comentariosCount: 3,
    anexosCount: 2,
    checklist: [
      { id: "c1", texto: "Levantar contrato atual", concluido: true },
      { id: "c2", texto: "Analisar cláusulas de SLA", concluido: true },
      { id: "c3", texto: "Preparar proposta de renegociação", concluido: false },
      { id: "c4", texto: "Reunião com fornecedor", concluido: false },
    ],
    comentarios: [
      {
        id: "cm1",
        autor: "Ana Silva",
        texto: "Fornecedor já confirmou reunião para dia 08/04.",
        data: "2026-04-01",
      },
    ],
    anexos: [
      { id: "a1", nome: "contrato_atual.pdf", tipo: "PDF", tamanho: "2.4 MB" },
      {
        id: "a2",
        nome: "proposta_renegociacao.docx",
        tipo: "DOCX",
        tamanho: "340 KB",
      },
    ],
    atividades: [
      {
        id: "at1",
        acao: "Status alterado para Em Progresso",
        usuario: "Daniel Vieira",
        data: "2026-03-18",
      },
    ],
  },
  {
    id: "t2",
    titulo: "Implementar controle de estoque automatizado",
    descricao:
      "Desenvolver e implantar sistema de controle de estoque com alertas automáticos de reposição e integração ao ERP existente.",
    status: "A_FAZER",
    prioridade: "ALTA",
    responsavel: "Carlos Mendes",
    dataInicio: "2026-04-05",
    prazo: "2026-04-30",
    estimativaHoras: 40,
    horasTrabalhadas: 0,
    progresso: 0,
    comentariosCount: 1,
    anexosCount: 0,
    checklist: [
      { id: "c5", texto: "Mapear fluxo atual de estoque", concluido: false },
      { id: "c6", texto: "Definir regras de reposição", concluido: false },
      { id: "c7", texto: "Configurar integração ERP", concluido: false },
      { id: "c8", texto: "Treinar equipe operacional", concluido: false },
    ],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t3",
    titulo: "Treinar equipe comercial em técnicas de negociação",
    descricao:
      "Organizar workshop de 2 dias focado em técnicas avançadas de negociação, gestão de objeções e fechamento de vendas.",
    status: "BACKLOG",
    prioridade: "MEDIA",
    responsavel: "Ana Silva",
    dataInicio: "2026-04-15",
    prazo: "2026-05-15",
    estimativaHoras: 16,
    horasTrabalhadas: 0,
    progresso: 0,
    comentariosCount: 0,
    anexosCount: 0,
    checklist: [
      {
        id: "c9",
        texto: "Definir conteúdo programático",
        concluido: false,
      },
      { id: "c10", texto: "Contratar facilitador externo", concluido: false },
      { id: "c11", texto: "Reservar espaço para workshop", concluido: false },
    ],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t4",
    titulo: "Mapear processos do setor financeiro",
    descricao:
      "Documentar todos os processos do departamento financeiro utilizando notação BPMN para identificar gargalos e oportunidades de melhoria.",
    status: "CONCLUIDA",
    prioridade: "ALTA",
    responsavel: "Roberto Lima",
    dataInicio: "2026-03-01",
    prazo: "2026-03-31",
    estimativaHoras: 24,
    horasTrabalhadas: 22,
    progresso: 100,
    comentariosCount: 5,
    anexosCount: 3,
    checklist: [
      { id: "c12", texto: "Entrevistar equipe financeira", concluido: true },
      { id: "c13", texto: "Mapear processos AS-IS", concluido: true },
      { id: "c14", texto: "Identificar gargalos", concluido: true },
      {
        id: "c15",
        texto: "Propor processos TO-BE",
        concluido: true,
      },
    ],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t5",
    titulo: "Definir indicadores de desempenho (KPIs) para operacoes",
    descricao:
      "Estabelecer conjunto de KPIs operacionais alinhados aos objetivos estratégicos da empresa, com metas e responsáveis definidos.",
    status: "REVISAO",
    prioridade: "ALTA",
    responsavel: "Daniel Vieira",
    dataInicio: "2026-03-20",
    prazo: "2026-04-08",
    estimativaHoras: 12,
    horasTrabalhadas: 10,
    progresso: 85,
    comentariosCount: 2,
    anexosCount: 1,
    checklist: [
      {
        id: "c16",
        texto: "Levantar objetivos estratégicos",
        concluido: true,
      },
      { id: "c17", texto: "Propor lista inicial de KPIs", concluido: true },
      { id: "c18", texto: "Validar com diretoria", concluido: true },
      { id: "c19", texto: "Definir metas e baseline", concluido: false },
    ],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t6",
    titulo: "Elaborar plano de reducao de custos operacionais",
    descricao:
      "Analisar estrutura de custos atual e propor plano de redução de 20% nos custos operacionais sem impacto na qualidade dos serviços.",
    status: "EM_PROGRESSO",
    prioridade: "URGENTE",
    responsavel: "Carlos Mendes",
    dataInicio: "2026-03-25",
    prazo: "2026-04-05",
    estimativaHoras: 20,
    horasTrabalhadas: 15,
    progresso: 70,
    comentariosCount: 4,
    anexosCount: 2,
    checklist: [
      { id: "c20", texto: "Levantar estrutura de custos", concluido: true },
      { id: "c21", texto: "Benchmarking setorial", concluido: true },
      {
        id: "c22",
        texto: "Identificar oportunidades de redução",
        concluido: true,
      },
      { id: "c23", texto: "Elaborar plano de ação", concluido: false },
    ],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t7",
    titulo: "Implantar pesquisa de satisfacao de clientes (NPS)",
    descricao:
      "Estruturar e implementar programa de Net Promoter Score para acompanhamento contínuo da satisfação dos clientes.",
    status: "A_FAZER",
    prioridade: "MEDIA",
    responsavel: "Ana Silva",
    dataInicio: "2026-04-10",
    prazo: "2026-04-25",
    estimativaHoras: 10,
    horasTrabalhadas: 0,
    progresso: 0,
    comentariosCount: 0,
    anexosCount: 0,
    checklist: [
      { id: "c24", texto: "Definir perguntas do questionário", concluido: false },
      { id: "c25", texto: "Escolher plataforma de envio", concluido: false },
      { id: "c26", texto: "Configurar automação de envio", concluido: false },
    ],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t8",
    titulo: "Reestruturar politica de precificacao",
    descricao:
      "Revisar estratégia de preços com base em análise de mercado, custos e posicionamento competitivo. Implementar tabela de preços dinâmica.",
    status: "BACKLOG",
    prioridade: "ALTA",
    responsavel: "Roberto Lima",
    dataInicio: "2026-05-01",
    prazo: "2026-05-30",
    estimativaHoras: 30,
    horasTrabalhadas: 0,
    progresso: 0,
    comentariosCount: 1,
    anexosCount: 0,
    checklist: [],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t9",
    titulo: "Criar dashboard gerencial para diretoria",
    descricao:
      "Desenvolver painel de controle executivo com os principais indicadores de desempenho da empresa para uso da diretoria.",
    status: "EM_PROGRESSO",
    prioridade: "ALTA",
    responsavel: "Daniel Vieira",
    dataInicio: "2026-03-10",
    prazo: "2026-04-15",
    estimativaHoras: 35,
    horasTrabalhadas: 20,
    progresso: 55,
    comentariosCount: 6,
    anexosCount: 4,
    checklist: [
      { id: "c27", texto: "Levantar requisitos com diretoria", concluido: true },
      { id: "c28", texto: "Definir métricas e visualizações", concluido: true },
      { id: "c29", texto: "Desenvolver protótipo", concluido: true },
      { id: "c30", texto: "Implementar dashboard", concluido: false },
      { id: "c31", texto: "Treinar usuários", concluido: false },
    ],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t10",
    titulo: "Auditoria interna de processos de compras",
    descricao:
      "Realizar auditoria completa nos processos de compras para identificar irregularidades, oportunidades de melhoria e riscos operacionais.",
    status: "CANCELADA",
    prioridade: "MEDIA",
    responsavel: "Carlos Mendes",
    dataInicio: "2026-03-01",
    prazo: "2026-03-25",
    estimativaHoras: 16,
    horasTrabalhadas: 4,
    progresso: 25,
    comentariosCount: 2,
    anexosCount: 0,
    checklist: [],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t11",
    titulo: "Estruturar plano de onboarding de novos colaboradores",
    descricao:
      "Criar programa formal de integração para novos funcionários com trilha de aprendizado, mentoria e metas para os primeiros 90 dias.",
    status: "A_FAZER",
    prioridade: "BAIXA",
    responsavel: "Ana Silva",
    dataInicio: "2026-04-20",
    prazo: "2026-05-20",
    estimativaHoras: 20,
    horasTrabalhadas: 0,
    progresso: 0,
    comentariosCount: 0,
    anexosCount: 0,
    checklist: [],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
  {
    id: "t12",
    titulo: "Negociar parceria estrategica com distribuidor regional",
    descricao:
      "Prospectar e negociar acordo de parceria exclusiva com distribuidor regional para expandir cobertura de mercado em 30%.",
    status: "REVISAO",
    prioridade: "URGENTE",
    responsavel: "Roberto Lima",
    dataInicio: "2026-03-15",
    prazo: "2026-04-12",
    estimativaHoras: 15,
    horasTrabalhadas: 12,
    progresso: 80,
    comentariosCount: 3,
    anexosCount: 2,
    checklist: [],
    comentarios: [],
    anexos: [],
    atividades: [],
  },
]
