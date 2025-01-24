export function useTemplateHelpers() {
  // Ejemplo de función reutilizable
  function formatTemplateName(name: string) {
    return name.trim().toUpperCase();
  }

  function getDefaultTemplate() {
    return {
      id: '',
      name: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    formatTemplateName,
    getDefaultTemplate,
  };
}
