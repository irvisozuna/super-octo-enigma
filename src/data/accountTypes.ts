// Tipos de cuenta bancaria
export interface AccountType {
  id: string
  name: string
  description: string
}

export const ACCOUNT_TYPES: AccountType[] = [
  { id: 'debito', name: 'Débito', description: 'Cuenta de débito' },
  { id: 'credito', name: 'Crédito', description: 'Cuenta de crédito' },
  { id: 'ahorro', name: 'Ahorro', description: 'Cuenta de ahorro' },
  { id: 'corriente', name: 'Corriente', description: 'Cuenta corriente' },
  { id: 'nomina', name: 'Nómina', description: 'Cuenta de nómina' },
  { id: 'inversion', name: 'Inversión', description: 'Cuenta de inversión' },
]

// Función para obtener tipos de cuenta como opciones para VSelect
export function getAccountTypeOptions() {
  return ACCOUNT_TYPES.map(type => ({
    title: type.name,
    value: type.name,
    subtitle: type.description,
    props: {
      prependIcon: 'tabler-credit-card',
    },
  }))
}
