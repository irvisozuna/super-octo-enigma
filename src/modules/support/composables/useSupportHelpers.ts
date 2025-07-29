export function useSupportHelpers() {
  // Ejemplo de función reutilizable
  function formatSupportName(name: string) {
    return name.trim().toUpperCase()
  }

  function getDefaultSupport() {
    return {
      id: '',
      name: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  return {
    formatSupportName,
    getDefaultSupport,
  }
}
