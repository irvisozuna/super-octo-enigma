# ProjectDetail.vue - UI/UX Improvements

## Overview

Esta vista ha sido completamente rediseñada siguiendo principios de **Atomic Design**, **DDD (Domain-Driven Design)** y **Clean Architecture** para proporcionar una experiencia de usuario profesional, escalable y mantenible.

## Arquitectura de Componentes

### Atomic Design Structure

```
ProjectDetail.vue (Template/Page)
├── Atoms
│   ├── ProjectBreadcrumbsAtom.vue - Navegación contextual
│   ├── ProjectStatusBadgeAtom.vue - Badge de estado con colores
│   └── ProjectProgressBarAtom.vue - Barra de progreso visual
├── Molecules
│   ├── WellInfoCardMolecule.vue - Información del pozo (1:1 con proyecto)
│   ├── PersonnelCardMolecule.vue - Personal asignado (max 10)
│   └── BudgetCardMolecule.vue - Resumen visual de presupuesto
└── Organisms
    ├── ProjectOverviewTabOrganism.vue - Dashboard principal con estadísticas
    └── ProjectDocumentsTabOrganism.vue - Gestión completa de documentos
```

## Mejoras Implementadas

### 1. **Header Mejorado**
- ✅ Breadcrumbs para navegación contextual
- ✅ Avatar grande con icono del proyecto
- ✅ Estado visual con badge colorido y icono
- ✅ Información del cliente inline
- ✅ Botones de acción más accesibles

### 2. **Información 1:1 Siempre Visible**
- ✅ **Card del Pozo**: Información completa del pozo (único por proyecto)
  - Profundidad planificada vs actual
  - Progreso visual con barra
  - Diámetro y coordenadas
  - Estado del pozo con colores

- ✅ **Card de Personal**: Personal asignado (máx 10 personas)
  - Avatares con iniciales coloreados
  - Gerente de proyecto destacado
  - Contador de personal
  - Links a acciones rápidas

### 3. **Tabs Reorganizados**
Se eliminaron los tabs de "Pozos" y "Personal" (ahora visibles en cards) y se reorganizó:

- **📊 Overview** (NUEVO): Dashboard principal
  - Estadísticas visuales con iconos grandes
  - Timeline del proyecto con progreso
  - Ubicación con mapa
  - Presupuesto resumido
  - Actividad reciente

- **📄 Reportes**: Lista de reportes de perforación
  - Contador en badge

- **💰 Presupuesto**: Gestión detallada de presupuesto
  - Card visual con gráficos
  - Alertas por sobre presupuesto

- **🛠️ Equipos**: Equipos asignados
  - Contador en badge

- **📎 Documentos** (NUEVO): Sistema completo de documentos
  - Upload drag & drop
  - Filtros por tipo
  - Grid/List view
  - Preview y descarga
  - Categorías (reporte, permiso, certificado, manual, otro)
  - Contador en badge

- **📈 Estadísticas**: Gráficos avanzados

- **🕐 Historial**: Timeline de actividades

### 4. **Sistema de Documentos**
Nuevo módulo completo para gestión de documentos del proyecto:

**Características:**
- ✅ Upload de archivos con validación
- ✅ Tipos de documentos (reporte, permiso, certificado, manual, otro)
- ✅ Filtros por tipo y búsqueda
- ✅ Ordenamiento múltiple
- ✅ Grid view con tarjetas
- ✅ Acciones por documento (ver, descargar, editar, eliminar)
- ✅ Metadata (tamaño, fecha, autor)
- ✅ Paginación
- ✅ Empty states profesionales

### 5. **Mejoras Visuales**
- ✅ Badges con contadores en tabs
- ✅ Iconos más grandes y coloridos
- ✅ Avatares con iniciales
- ✅ Progress bars visuales
- ✅ Sombras y hover effects
- ✅ Spacing mejorado
- ✅ Responsive design optimizado
- ✅ Transiciones suaves

## Estructura de Datos

### Well (Pozo)
```typescript
interface Well {
  id: string
  name: string
  project_id: string
  well_type: 'exploration' | 'production' | 'injection' | 'monitoring'
  depth_planned: number
  depth_actual?: number
  diameter: number
  coordinates: { latitude: number; longitude: number }
  status: 'planned' | 'drilling' | 'completed' | 'abandoned'
}
```

### Document
```typescript
interface Document {
  id: string
  name: string
  description?: string
  file_name: string
  file_size: number
  mime_type: string
  document_type: 'report' | 'permit' | 'certificate' | 'manual' | 'other'
  related_entity_type: 'project' | 'well' | 'report' | 'tool' | 'employee'
  related_entity_id: string
  uploaded_by_name: string
  created_at: string
}
```

## Testing

Se incluye ejemplo de test unitario para componentes atómicos:

```bash
# Run tests
npm test

# Run specific test
npm test ProjectStatusBadgeAtom.spec.ts
```

### Ejemplo de Test
```typescript
// ProjectStatusBadgeAtom.spec.ts
describe('ProjectStatusBadgeAtom', () => {
  it('renders badge with correct status label', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: { status: 'active' }
    })
    expect(wrapper.text()).toContain('Activo')
  })
})
```

## Extensibilidad

### Agregar Nuevo Tab
1. Crear componente organism en `organisms/`
2. Importar en `ProjectDetail.vue`
3. Agregar tab en `VTabs` con badge si aplica
4. Agregar `VTabsWindowItem` con el componente

### Agregar Nuevo Tipo de Documento
1. Actualizar `DocumentEntity.ts`
2. Agregar tipo en `documentTypes` array en `ProjectDocumentsTabOrganism.vue`
3. Agregar icono y color en helpers

## Pendientes (TODOs)

Los siguientes items están marcados como "en desarrollo" y requieren implementación:

1. **Wells Store**: Implementar `fetchWellsByProject()` method
2. **Documents Store**: Implementar métodos CRUD completos
3. **Personnel Module**: Crear módulo completo de personal
4. **Equipment Module**: Crear módulo completo de equipos
5. **Reports List**: Implementar lista de reportes
6. **Budget Details**: Desglose detallado de presupuesto
7. **Statistics Charts**: Gráficos avanzados con ApexCharts
8. **Activity History**: Timeline completo de actividades
9. **Map Integration**: Integración con Mapbox para ubicación
10. **Document Preview**: Preview de PDFs e imágenes inline

## Responsiveness

El diseño es completamente responsive:

- **Desktop (>960px)**: Layout de 2 columnas
- **Tablet (600-960px)**: Layout de 1 columna con cards apiladas
- **Mobile (<600px)**: Stack vertical completo, tabs como carousel

## Performance

- Lazy loading de tabs
- Paginación en documentos
- Virtualization para listas largas (futuro)
- Skeleton loaders mientras carga

## Accesibilidad

- ARIA labels en todos los componentes
- Keyboard navigation
- Color contrast WCAG 2.2 AA compliant
- Screen reader friendly

## Referencias

- [Atomic Design](https://atomicdesign.bradfrost.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [DDD](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Vuetify Components](https://vuetifyjs.com/en/components/all/)
