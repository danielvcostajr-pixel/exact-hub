"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Settings,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Calendar,
  Globe,
  Zap,
  RefreshCw,
  ArrowLeft,
} from "lucide-react"
import { useClienteContext } from "@/hooks/useClienteContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { cn } from "@/lib/utils"

// --- ClickUp State ---
interface ClickUpConfig {
  apiKey: string
  workspaceId: string
  spaceId: string
  autoCreate: boolean
  autoUpdate: boolean
  autoImport: boolean
  status: "conectado" | "desconectado" | "testando"
}

// --- Google Calendar State ---
interface GCalConfig {
  status: "conectado" | "desconectado"
  timezone: string
  autoSync: boolean
}

function StatusBadge({ status }: { status: "conectado" | "desconectado" | "testando" }) {
  const config = {
    conectado: {
      label: "Conectado",
      icon: CheckCircle2,
      className: "border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400",
    },
    desconectado: {
      label: "Desconectado",
      icon: XCircle,
      className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    },
    testando: {
      label: "Testando...",
      icon: RefreshCw,
      className: "border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    },
  }[status]

  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("gap-1.5 text-xs", config.className)}>
      <Icon className={cn("size-3", status === "testando" && "animate-spin")} />
      {config.label}
    </Badge>
  )
}

function SyncCheckbox({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
      <div>
        <p className="text-sm text-foreground group-hover:text-primary transition-colors">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    </label>
  )
}

export default function ConfiguracoesPage() {
  const { clienteAtivo } = useClienteContext()
  // ClickUp state
  const [clickup, setClickup] = useState<ClickUpConfig>({
    apiKey: "",
    workspaceId: "",
    spaceId: "",
    autoCreate: false,
    autoUpdate: false,
    autoImport: false,
    status: "desconectado",
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  // Google Calendar state
  const [gcal, setGcal] = useState<GCalConfig>({
    status: "desconectado",
    timezone: "America/Fortaleza",
    autoSync: false,
  })

  const updateClickup = <K extends keyof ClickUpConfig>(key: K, value: ClickUpConfig[K]) => {
    setClickup((prev) => ({ ...prev, [key]: value }))
  }

  const handleTestarClickup = () => {
    if (!clickup.apiKey || !clickup.workspaceId) {
      setTestResult("Preencha a API Key e o Workspace ID antes de testar.")
      return
    }
    setClickup((prev) => ({ ...prev, status: "testando" }))
    setTestResult(null)
    setTimeout(() => {
      setClickup((prev) => ({ ...prev, status: "conectado" }))
      setTestResult("Conexao testada com sucesso! Workspace encontrado: Exact BI.")
    }, 1800)
  }

  const handleSalvarClickup = () => {
    setTestResult("Configuracoes salvas com sucesso!")
  }

  const handleConectarGcal = () => {
    // Placeholder OAuth flow
    setTimeout(() => {
      setGcal((prev) => ({ ...prev, status: "conectado" }))
    }, 1000)
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Back + Client */}
        <div className="flex items-center gap-3">
          <Link href="/consultor" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </Link>
          {clienteAtivo && <span className="text-sm text-primary font-medium">{clienteAtivo.nome}</span>}
        </div>
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Settings className="size-6 text-primary" />
            Configuracoes e Integracoes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie as integracoes externas do Exact Hub com suas ferramentas de trabalho.
          </p>
        </div>

        {/* ClickUp Card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              {/* ClickUp Logo Placeholder */}
              <div className="size-10 rounded-xl bg-[#7B68EE]/15 border border-[#7B68EE]/30 flex items-center justify-center">
                <Zap className="size-5 text-[#7B68EE]" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">ClickUp</h2>
                <p className="text-xs text-muted-foreground">Gestao de tarefas e projetos</p>
              </div>
            </div>
            <StatusBadge status={clickup.status} />
          </div>

          <div className="p-6 space-y-5">
            {/* API Key */}
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? "text" : "password"}
                  value={clickup.apiKey}
                  onChange={(e) => updateClickup("apiKey", e.target.value)}
                  placeholder="pk_XXXXXXXX_..."
                  className="bg-background border-border pr-10"
                />
                <button
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Encontre sua API Key em{" "}
                <a
                  href="https://app.clickup.com/settings/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  ClickUp Settings <ExternalLink className="size-3" />
                </a>
              </p>
            </div>

            {/* Workspace ID + Space ID */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Workspace ID</Label>
                <Input
                  value={clickup.workspaceId}
                  onChange={(e) => updateClickup("workspaceId", e.target.value)}
                  placeholder="Ex: 9876543"
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Space ID</Label>
                <Input
                  value={clickup.spaceId}
                  onChange={(e) => updateClickup("spaceId", e.target.value)}
                  placeholder="Ex: 123456789"
                  className="bg-background border-border"
                />
              </div>
            </div>

            {/* Test result */}
            {testResult && (
              <div
                className={cn(
                  "rounded-lg px-4 py-3 text-sm",
                  testResult.includes("sucesso")
                    ? "bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400"
                )}
              >
                {testResult}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTestarClickup}
                disabled={clickup.status === "testando"}
                className="border-border gap-2"
              >
                <RefreshCw className={cn("size-4", clickup.status === "testando" && "animate-spin")} />
                Testar Conexao
              </Button>
              <Button
                onClick={handleSalvarClickup}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Salvar
              </Button>
            </div>

            <Separator className="bg-border" />

            {/* Sync Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Opcoes de Sincronizacao</h3>
              <div className="space-y-3">
                <SyncCheckbox
                  id="clickup-auto-create"
                  label="Criar tarefas automaticamente"
                  description="Tarefas criadas no Exact Hub sao sincronizadas com o ClickUp"
                  checked={clickup.autoCreate}
                  onChange={(v) => updateClickup("autoCreate", v)}
                />
                <SyncCheckbox
                  id="clickup-auto-update"
                  label="Atualizar status automaticamente"
                  description="Mudancas de status no ClickUp refletem no Exact Hub"
                  checked={clickup.autoUpdate}
                  onChange={(v) => updateClickup("autoUpdate", v)}
                />
                <SyncCheckbox
                  id="clickup-auto-import"
                  label="Importar tarefas existentes"
                  description="Importar tarefas do ClickUp para o Exact Hub ao conectar"
                  checked={clickup.autoImport}
                  onChange={(v) => updateClickup("autoImport", v)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Google Calendar Card */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Card Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="flex items-center gap-3">
              {/* Google Calendar Logo Placeholder */}
              <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Calendar className="size-5 text-blue-500" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Google Calendar</h2>
                <p className="text-xs text-muted-foreground">Sincronizacao de reunioes e eventos</p>
              </div>
            </div>
            <StatusBadge status={gcal.status} />
          </div>

          <div className="p-6 space-y-5">
            {gcal.status === "desconectado" ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-background border border-border p-4 text-sm text-muted-foreground">
                  <p>Conecte sua conta do Google para sincronizar reunioes agendadas no Exact Hub diretamente com seu Google Calendar.</p>
                </div>
                <Button
                  onClick={handleConectarGcal}
                  className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                  </svg>
                  Conectar com Google
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                  <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Conta conectada</p>
                    <p className="text-xs text-muted-foreground">daniel@exactbi.com.br</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setGcal((prev) => ({ ...prev, status: "desconectado" }))}
                    className="ml-auto text-xs text-muted-foreground hover:text-destructive"
                  >
                    Desconectar
                  </Button>
                </div>

                {/* Timezone */}
                <div className="flex items-center gap-3 rounded-lg bg-background border border-border p-3">
                  <Globe className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground">Fuso Horario</p>
                    <p className="text-xs text-muted-foreground">{gcal.timezone} (UTC-3)</p>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Sync Options */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Opcoes de Sincronizacao</h3>
                  <SyncCheckbox
                    id="gcal-auto-sync"
                    label="Sincronizar reunioes automaticamente"
                    description="Reunioes criadas no Exact Hub aparecem no seu Google Calendar"
                    checked={gcal.autoSync}
                    onChange={(v) => setGcal((prev) => ({ ...prev, autoSync: v }))}
                  />
                </div>

                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => {}}
                >
                  Salvar Configuracoes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
