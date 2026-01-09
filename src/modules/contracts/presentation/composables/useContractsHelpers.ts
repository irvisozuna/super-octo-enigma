export function useContractsHelpers() {
  /**
   * Formatea un monto a formato de moneda mexicana
   */
  function formatCurrency(amount: string | number) {
    const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount

    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(num)
  }

  /**
   * Retorna el color apropiado para el estado del contrato
   */
  function getStatusColor(status: string) {
    switch (status?.toUpperCase()) {
      case 'ACTIVO': return 'success'
      case 'SUSPENDIDO': return 'warning'
      case 'CANCELADO': return 'info'
      case 'LIMITADO': return 'error'
      default: return 'default'
    }
  }

  /**
   * Retorna el color apropiado basado en meses de adeudo
   */
  function getDebtColor(debtMonths: string | number) {
    const months = typeof debtMonths === 'string' ? Number.parseInt(debtMonths) : debtMonths

    if (months === 0)
      return 'success'
    if (months <= 3)
      return 'warning'

    return 'error'
  }

  /**
   * Formatea el nombre del usuario
   */
  function formatContractName(name: string) {
    return name.trim().toUpperCase()
  }

  /**
   * Retorna un contrato por defecto
   */
  function getDefaultContract() {
    return {
      contratid: '',
      account: '',
      nameuser: '',
      address: '',
      status: 'ACTIVO',
    }
  }

  return {
    formatCurrency,
    getStatusColor,
    getDebtColor,
    formatContractName,
    getDefaultContract,
  }
}
