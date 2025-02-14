export function useUserHelpers() {
  // Ejemplo de función reutilizable
  function formatUserName(name: string) {
    return name.trim().toUpperCase();
  }

  function getDefaultUser() {
    return {
      id: '',
      name: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    formatUserName,
    getDefaultUser,
  };
}
