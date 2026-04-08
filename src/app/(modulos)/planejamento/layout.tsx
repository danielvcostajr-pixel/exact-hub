'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Target, RotateCcw, ListChecks } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

const NAV_ITEMS = [
  {
    href: '/planejamento/okrs',
    label: 'OKRs',
    icon: Target,
  },
  {
    href: '/planejamento/rotinas',
    label: 'Rotinas',
    icon: RotateCcw,
  },
  {
    href: '/planejamento/planos-acao',
    label: 'Planos de Acao',
    icon: ListChecks,
  },
]

export default function PlanejamentoLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-0 h-full">
        {/* Sub-navigation tabs */}
        <div className="w-full border-b border-border mb-6">
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
                    ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    }
                  `}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Page content */}
        <div className="flex-1">{children}</div>
      </div>
    </DashboardLayout>
  )
}
