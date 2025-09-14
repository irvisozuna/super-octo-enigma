// Lista de bancos principales de México
export interface Bank {
  id: string
  name: string
  shortName: string
  code: string
}

export const MEXICAN_BANKS: Bank[] = [
  // Bancos más grandes por activos
  { id: 'bbva', name: 'BBVA México', shortName: 'BBVA', code: '012' },
  { id: 'citibanamex', name: 'Citibanamex', shortName: 'Citibanamex', code: '002' },
  { id: 'santander', name: 'Santander México', shortName: 'Santander', code: '014' },
  { id: 'banorte', name: 'Banorte', shortName: 'Banorte', code: '072' },
  { id: 'hsbc', name: 'HSBC México', shortName: 'HSBC', code: '021' },
  { id: 'scotiabank', name: 'Scotiabank Inverlat', shortName: 'Scotiabank', code: '044' },
  { id: 'inbursa', name: 'Banco Inbursa', shortName: 'Inbursa', code: '036' },
  { id: 'azteca', name: 'Banco Azteca', shortName: 'Azteca', code: '016' },
  { id: 'bajio', name: 'Banco del Bajío', shortName: 'Bajío', code: '030' },
  { id: 'banregio', name: 'Banregio', shortName: 'Banregio', code: '058' },
  { id: 'multiva', name: 'Banco Multiva', shortName: 'Multiva', code: '062' },
  { id: 'mifel', name: 'Banco MIFEL', shortName: 'MIFEL', code: '066' },
  { id: 'intercam', name: 'Banco Intercam', shortName: 'Intercam', code: '037' },
  { id: 'invex', name: 'Banco Invex', shortName: 'Invex', code: '053' },
  { id: 've_por_mas', name: 'Ve Por Más', shortName: 'Ve Por Más', code: '140' },
  { id: 'bancoppel', name: 'Bancoppel', shortName: 'Bancoppel', code: '127' },
  { id: 'compartamos', name: 'Compartamos Banco', shortName: 'Compartamos', code: '143' },
  { id: 'banco_famsa', name: 'Banco Famsa', shortName: 'Famsa', code: '138' },
  { id: 'banco_wal_mart', name: 'Banco Wal-Mart', shortName: 'Wal-Mart', code: '135' },
  { id: 'banco_autofin', name: 'Banco Autofin', shortName: 'Autofin', code: '147' },
  { id: 'banco_crecer', name: 'Banco Crecer', shortName: 'Crecer', code: '136' },
  { id: 'banco_adelante', name: 'Banco Adelante', shortName: 'Adelante', code: '146' },
  { id: 'banco_ve_por_mas', name: 'Ve Por Más', shortName: 'Ve Por Más', code: '140' },
  { id: 'banco_volkswagen', name: 'Banco Volkswagen', shortName: 'Volkswagen', code: '145' },
  { id: 'banco_consupago', name: 'Consupago', shortName: 'Consupago', code: '148' },
  { id: 'banco_credit_suisse', name: 'Credit Suisse México', shortName: 'Credit Suisse', code: '149' },
  { id: 'banco_actinver', name: 'Actinver', shortName: 'Actinver', code: '133' },
  { id: 'banco_banco_amex', name: 'American Express', shortName: 'Amex', code: '134' },
  { id: 'banco_banco_autofin', name: 'Banco Autofin', shortName: 'Autofin', code: '147' },
  { id: 'banco_banco_crecer', name: 'Banco Crecer', shortName: 'Crecer', code: '136' },
  { id: 'banco_banco_adelante', name: 'Banco Adelante', shortName: 'Adelante', code: '146' },
  { id: 'banco_banco_volkswagen', name: 'Banco Volkswagen', shortName: 'Volkswagen', code: '145' },
  { id: 'banco_banco_consupago', name: 'Consupago', shortName: 'Consupago', code: '148' },
  { id: 'banco_banco_credit_suisse', name: 'Credit Suisse México', shortName: 'Credit Suisse', code: '149' },
  { id: 'banco_banco_actinver', name: 'Actinver', shortName: 'Actinver', code: '133' },
  { id: 'banco_banco_amex', name: 'American Express', shortName: 'Amex', code: '134' },
]

// Función para obtener bancos como opciones para VSelect
export function getBankOptions() {
  return MEXICAN_BANKS.map(bank => ({
    title: bank.name,
    value: bank.name,
    subtitle: bank.shortName,
    props: {
      prependIcon: 'tabler-building-bank',
    },
  }))
}

// Función para buscar bancos por nombre
export function searchBanks(query: string): Bank[] {
  if (!query)
    return MEXICAN_BANKS

  const lowercaseQuery = query.toLowerCase()

  return MEXICAN_BANKS.filter(bank =>
    bank.name.toLowerCase().includes(lowercaseQuery)
    || bank.shortName.toLowerCase().includes(lowercaseQuery)
    || bank.code.includes(query),
  )
}

// Función para obtener un banco por ID
export function getBankById(id: string): Bank | undefined {
  return MEXICAN_BANKS.find(bank => bank.id === id)
}

// Función para obtener un banco por código
export function getBankByCode(code: string): Bank | undefined {
  return MEXICAN_BANKS.find(bank => bank.code === code)
}
