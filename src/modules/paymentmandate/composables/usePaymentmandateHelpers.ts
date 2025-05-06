export function usePaymentmandateHelpers() {
  // Ejemplo de función reutilizable
  function formatPaymentmandateName(name: string) {
    return name.trim().toUpperCase();
  }

  function getDefaultPaymentmandate() {
    return {
      id: '',
      name: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    formatPaymentmandateName,
    getDefaultPaymentmandate,
  };
}
