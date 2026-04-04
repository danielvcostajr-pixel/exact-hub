import { PrismaClient } from '../src/generated/prisma'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Criar empresa Confort Maison
  const confort = await prisma.empresa.create({
    data: {
      razaoSocial: 'Confort Maison Ltda',
      nomeFantasia: 'Confort Maison',
      cnpj: '12345678000190',
      segmento: 'Moveis e Decoracao',
      porte: 'Medio',
      responsavel: 'Joao Silva',
      telefone: '(83) 99999-0001',
      email: 'contato@confortmaison.com',
      cidade: 'Joao Pessoa',
      estado: 'PB',
    }
  })
  console.log('Empresa Confort Maison:', confort.id)

  // Criar usuario consultor (ID do Supabase Auth)
  const consultor = await prisma.usuario.create({
    data: {
      id: '02d979d7-2ca6-43a6-abd1-8e3999dc23b5',
      email: 'consultor@exactbi.com.br',
      nome: 'Daniel Vieira',
      papel: 'CONSULTOR',
      ativo: true,
    }
  })
  console.log('Consultor:', consultor.id)

  // Criar usuario cliente
  const clienteUser = await prisma.usuario.create({
    data: {
      email: 'cliente@confortmaison.com',
      nome: 'Maria Silva',
      papel: 'CLIENTE',
      ativo: true,
      empresaId: confort.id,
    }
  })
  console.log('Cliente:', clienteUser.id)

  // Mais empresas
  const geny = await prisma.empresa.create({
    data: {
      razaoSocial: 'Geny Eletros Ltda',
      nomeFantasia: 'Geny Eletros',
      segmento: 'Varejo de Eletrodomesticos',
      porte: 'Medio',
      cidade: 'Campina Grande',
      estado: 'PB',
    }
  })
  console.log('Empresa Geny Eletros:', geny.id)

  const casa = await prisma.empresa.create({
    data: {
      razaoSocial: 'Casa Gramado Hotel',
      nomeFantasia: 'Casa Gramado',
      segmento: 'Hospedagem e Turismo',
      porte: 'Medio',
      cidade: 'Gramado',
      estado: 'RS',
    }
  })
  console.log('Empresa Casa Gramado:', casa.id)

  const alumi = await prisma.empresa.create({
    data: {
      razaoSocial: 'Alumifont Industria Ltda',
      nomeFantasia: 'Alumifont',
      segmento: 'Industria de Aluminio',
      porte: 'Grande',
      cidade: 'Joao Pessoa',
      estado: 'PB',
    }
  })
  console.log('Empresa Alumifont:', alumi.id)

  console.log('\n=== SEED COMPLETO ===')
  console.log('\nCredenciais de teste:')
  console.log('Consultor: consultor@exactbi.com.br / Exact2026!')
  console.log('Cliente:   (precisa criar no Supabase Auth)')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
