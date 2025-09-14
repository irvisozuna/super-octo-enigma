const modules = import.meta.glob('@/modules/**/indexedDbConfig.ts', { eager: true });

// Extrae las configuraciones de tablas de los módulos
const defaultConfigs = Object.values(modules).map((mod: any) => mod.default);

// Extrae configuraciones adicionales (como contractRegistryConfig)
const additionalConfigs = Object.values(modules).flatMap((mod: any) => {
  const configs = [];
  if (mod.contractRegistryConfig) {
    configs.push(mod.contractRegistryConfig);
  }
  return configs;
});

// Combina todas las configuraciones
export const tableConfigs = [...defaultConfigs, ...additionalConfigs];

// Debug para verificar las configuraciones cargadas
// console.log('Configuraciones de tablas cargadas:', tableConfigs);
