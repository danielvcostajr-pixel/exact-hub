"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getEmpresas } from "@/lib/api/data-service"

export interface ClienteInfo {
  id: string
  nome: string
  initials: string
  fase: string
}

interface ClienteContextType {
  clienteAtivo: ClienteInfo | null
  setClienteAtivo: (cliente: ClienteInfo | null) => void
  isFiltered: boolean
  clientes: ClienteInfo[]
  loading: boolean
}

const STORAGE_KEY = "exacthub_cliente_ativo"

const ClienteContext = createContext<ClienteContextType>({
  clienteAtivo: null,
  setClienteAtivo: () => {},
  isFiltered: false,
  clientes: [],
  loading: true,
})

function gerarInitials(nome: string): string {
  const words = nome.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return nome.substring(0, 2).toUpperCase()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEmpresaToCliente(empresa: any): ClienteInfo {
  const nome = empresa.nomeFantasia || empresa.razaoSocial || "Sem nome"
  return {
    id: empresa.id,
    nome,
    initials: gerarInitials(nome),
    fase: empresa.fase || "Diagnostico",
  }
}

export function ClienteContextProvider({ children }: { children: ReactNode }) {
  const [clienteAtivo, setClienteAtivoState] = useState<ClienteInfo | null>(null)
  const [clientes, setClientes] = useState<ClienteInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  // Fetch real empresas from Supabase
  useEffect(() => {
    let cancelled = false

    async function fetchEmpresas() {
      try {
        const empresas = await getEmpresas()
        if (!cancelled && empresas) {
          const mapped = empresas.map(mapEmpresaToCliente)
          setClientes(mapped)

          // Restore persisted selection and validate against real list
          try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
              const parsed: ClienteInfo = JSON.parse(stored)
              const valid = mapped.find((c) => c.id === parsed.id)
              if (valid) setClienteAtivoState(valid)
            }
          } catch {
            // ignore malformed storage
          }
        }
      } catch (err) {
        console.error("Erro ao carregar empresas:", err)
      } finally {
        if (!cancelled) {
          setLoading(false)
          setHydrated(true)
        }
      }
    }

    fetchEmpresas()
    return () => { cancelled = true }
  }, [])

  const setClienteAtivo = (cliente: ClienteInfo | null) => {
    setClienteAtivoState(cliente)
    try {
      if (cliente) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cliente))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore storage errors
    }
  }

  // Avoid rendering with stale server state before hydration
  if (!hydrated) {
    return (
      <ClienteContext.Provider
        value={{ clienteAtivo: null, setClienteAtivo, isFiltered: false, clientes: [], loading: true }}
      >
        {children}
      </ClienteContext.Provider>
    )
  }

  return (
    <ClienteContext.Provider
      value={{
        clienteAtivo,
        setClienteAtivo,
        isFiltered: clienteAtivo !== null,
        clientes,
        loading,
      }}
    >
      {children}
    </ClienteContext.Provider>
  )
}

export function useClienteContext() {
  const ctx = useContext(ClienteContext)
  if (!ctx) {
    throw new Error("useClienteContext must be used within a ClienteContextProvider")
  }
  return ctx
}
