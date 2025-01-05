const modules = import.meta.glob('@/modules/**/indexedDbConfig.ts', { eager: true });

// Extrae las configuraciones de tablas de los módulos
export const tableConfigs = Object.values(modules).map((mod: any) => mod.default);

// Debug para verificar las configuraciones cargadas
console.log('Configuraciones de tablas cargadas:', tableConfigs);
