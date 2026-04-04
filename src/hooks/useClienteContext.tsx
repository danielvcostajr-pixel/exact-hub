"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

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
}

export const CLIENTES_MOCK: ClienteInfo[] = [
  { id: "1", nome: "Alumifont",        initials: "AL", fase: "Diagnostico" },
  { id: "2", nome: "Pizzaria Bella",   initials: "PB", fase: "Diagnostico" },
  { id: "3", nome: "Auto Center JP",   initials: "AJ", fase: "Diagnostico" },
  { id: "4", nome: "Casa Gramado",     initials: "CG", fase: "Planejamento" },
  { id: "5", nome: "Tech Solutions",   initials: "TS", fase: "Planejamento" },
  { id: "6", nome: "Geny Eletros",     initials: "GE", fase: "Execucao" },
  { id: "7", nome: "Farmacia Popular", initials: "FP", fase: "Execucao" },
  { id: "8", nome: "Confort Maison",   initials: "CM", fase: "Acompanhamento" },
]

const STORAGE_KEY = "exacthub_cliente_ativo"

const ClienteContext = createContext<ClienteContextType>({
  clienteAtivo: null,
  setClienteAtivo: () => {},
  isFiltered: false,
})

export function ClienteContextProvider({ children }: { children: ReactNode }) {
  const [clienteAtivo, setClienteAtivoState] = useState<ClienteInfo | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Restore persisted selection after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: ClienteInfo = JSON.parse(stored)
        // Validate the stored value still matches a known client
        const valid = CLIENTES_MOCK.find((c) => c.id === parsed.id)
        if (valid) setClienteAtivoState(valid)
      }
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
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
        value={{ clienteAtivo: null, setClienteAtivo, isFiltered: false }}
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
