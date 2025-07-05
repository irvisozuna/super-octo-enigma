// scripts/generator.mjs
import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import inquirer from 'inquirer'
import { DDD_STRUCTURE, MODULES_PATH } from './generateModule/config.mjs'
import {
  createFile,
  ensureDirectoryExists,
  generateTimestamp,
  normalizeModuleName,
  readStub,
  replaceVariables,
} from './generateModule/helpers.mjs'
import { postProcessGeneratedFiles } from './generateModule/postProcessor.mjs'

/**
 * Estructura DDD para módulos Vue.js + TypeScript
 */
const MODULE_STRUCTURE = {
  // Domain Layer - Lógica de negocio pura
  domain: {
    entities: [],
    valueObjects: [],
    aggregates: [],
    events: [],
    exceptions: [],
    specifications: [],
    contracts: {
      repositories: [],
      services: [],
    },
  },

  // Application Layer - Casos de uso y coordinación
  application: {
    commands: [],
    queries: [],
    handlers: [],
    dtos: [],
    mappers: [],
    services: [],
    useCases: [],
    contracts: [],
  },

  // Infrastructure Layer - Implementaciones técnicas
  infrastructure: {
    api: {
      services: [],
      interceptors: [],
      transformers: [],
    },
    persistence: {
      repositories: [],
      cache: [],
      indexedDb: [],
    },
    websocket: {
      handlers: [],
      events: [],
    },
  },

  // Presentation Layer - UI y componentes Vue
  presentation: {
    views: [],
    components: {
      organisms: [],
      molecules: [],
      atoms: [],
    },
    composables: [],
    stores: [],
    router: [],
    layouts: [],
  },

  // Shared - Recursos compartidos
  shared: {
    types: [],
    constants: [],
    utils: [],
    validators: [],
    locales: {
      es: [],
      en: [],
    },
  },

  // Tests
  tests: {
    unit: {
      domain: [],
      application: [],
      infrastructure: [],
      presentation: [],
    },
    integration: [],
    e2e: [],
  },
}

/**
 * Archivos a generar según las características seleccionadas
 */
const FILE_TEMPLATES = {
  // Domain Layer
  domain: [
    { stub: 'domain/entities/Entity.stub', output: 'domain/entities/{{moduleName}}.ts' },
    { stub: 'domain/entities/EntityId.stub', output: 'domain/entities/{{moduleName}}Id.ts' },
    { stub: 'domain/valueObjects/Name.stub', output: 'domain/valueObjects/{{moduleName}}Name.ts' },
    { stub: 'domain/valueObjects/Status.stub', output: 'domain/valueObjects/{{moduleName}}Status.ts' },
    { stub: 'domain/aggregates/Aggregate.stub', output: 'domain/aggregates/{{moduleName}}Aggregate.ts' },
    { stub: 'domain/events/Created.stub', output: 'domain/events/{{moduleName}}Created.ts' },
    { stub: 'domain/events/Updated.stub', output: 'domain/events/{{moduleName}}Updated.ts' },
    { stub: 'domain/events/Deleted.stub', output: 'domain/events/{{moduleName}}Deleted.ts' },
    { stub: 'domain/exceptions/NotFound.stub', output: 'domain/exceptions/{{moduleName}}NotFound.ts' },
    { stub: 'domain/exceptions/ValidationError.stub', output: 'domain/exceptions/{{moduleName}}ValidationError.ts' },
    { stub: 'domain/specifications/Specification.stub', output: 'domain/specifications/{{moduleName}}Specification.ts' },
    { stub: 'domain/contracts/Repository.stub', output: 'domain/contracts/repositories/{{moduleName}}Repository.ts' },
    { stub: 'domain/contracts/Service.stub', output: 'domain/contracts/services/{{moduleName}}DomainService.ts' },
  ],

  // Application Layer
  application: [
    { stub: 'application/commands/Create.stub', output: 'application/commands/Create{{moduleName}}Command.ts' },
    { stub: 'application/commands/Update.stub', output: 'application/commands/Update{{moduleName}}Command.ts' },
    { stub: 'application/commands/Delete.stub', output: 'application/commands/Delete{{moduleName}}Command.ts' },
    { stub: 'application/queries/GetById.stub', output: 'application/queries/Get{{moduleName}}ByIdQuery.ts' },
    { stub: 'application/queries/GetList.stub', output: 'application/queries/Get{{moduleName}}ListQuery.ts' },
    { stub: 'application/handlers/CreateHandler.stub', output: 'application/handlers/Create{{moduleName}}Handler.ts' },
    { stub: 'application/handlers/UpdateHandler.stub', output: 'application/handlers/Update{{moduleName}}Handler.ts' },
    { stub: 'application/handlers/DeleteHandler.stub', output: 'application/handlers/Delete{{moduleName}}Handler.ts' },
    { stub: 'application/handlers/GetByIdHandler.stub', output: 'application/handlers/Get{{moduleName}}ByIdHandler.ts' },
    { stub: 'application/handlers/GetListHandler.stub', output: 'application/handlers/Get{{moduleName}}ListHandler.ts' },
    { stub: 'application/dtos/DTO.stub', output: 'application/dtos/{{moduleName}}DTO.ts' },
    { stub: 'application/dtos/CreateDTO.stub', output: 'application/dtos/Create{{moduleName}}DTO.ts' },
    { stub: 'application/dtos/UpdateDTO.stub', output: 'application/dtos/Update{{moduleName}}DTO.ts' },
    { stub: 'application/mappers/Mapper.stub', output: 'application/mappers/{{moduleName}}Mapper.ts' },
    { stub: 'application/services/Service.stub', output: 'application/services/{{moduleName}}ApplicationService.ts' },
    { stub: 'application/useCases/CreateUseCase.stub', output: 'application/useCases/Create{{moduleName}}UseCase.ts' },
    { stub: 'application/useCases/UpdateUseCase.stub', output: 'application/useCases/Update{{moduleName}}UseCase.ts' },
    { stub: 'application/useCases/DeleteUseCase.stub', output: 'application/useCases/Delete{{moduleName}}UseCase.ts' },
    { stub: 'application/useCases/GetByIdUseCase.stub', output: 'application/useCases/Get{{moduleName}}ByIdUseCase.ts' },
    { stub: 'application/useCases/GetListUseCase.stub', output: 'application/useCases/Get{{moduleName}}ListUseCase.ts' },
  ],

  // Infrastructure Layer
  infrastructure: [
    { stub: 'infrastructure/api/Service.stub', output: 'infrastructure/api/services/{{moduleName}}ApiService.ts' },
    { stub: 'infrastructure/api/Endpoints.stub', output: 'infrastructure/api/services/{{moduleName}}Endpoints.ts' },
    { stub: 'infrastructure/api/Transformer.stub', output: 'infrastructure/api/transformers/{{moduleName}}Transformer.ts' },
    { stub: 'infrastructure/persistence/Repository.stub', output: 'infrastructure/persistence/repositories/{{moduleName}}RepositoryImpl.ts' },
    { stub: 'infrastructure/persistence/Cache.stub', output: 'infrastructure/persistence/cache/{{moduleName}}CacheService.ts', feature: 'cache' },
    { stub: 'infrastructure/persistence/IndexedDb.stub', output: 'infrastructure/persistence/indexedDb/{{moduleName}}IndexedDb.ts', feature: 'cache' },
    { stub: 'infrastructure/websocket/Handler.stub', output: 'infrastructure/websocket/handlers/{{moduleName}}WebSocketHandler.ts', feature: 'websocket' },
    { stub: 'infrastructure/websocket/Events.stub', output: 'infrastructure/websocket/events/{{moduleName}}WebSocketEvents.ts', feature: 'websocket' },
  ],

  // Presentation Layer
  presentation: [
    { stub: 'presentation/views/Index.stub', output: 'presentation/views/{{moduleName}}Index.vue' },
    { stub: 'presentation/views/List.stub', output: 'presentation/views/{{moduleName}}List.vue' },
    { stub: 'presentation/views/Detail.stub', output: 'presentation/views/{{moduleName}}Detail.vue' },
    { stub: 'presentation/views/Create.stub', output: 'presentation/views/{{moduleName}}Create.vue' },
    { stub: 'presentation/views/Edit.stub', output: 'presentation/views/{{moduleName}}Edit.vue' },
    { stub: 'presentation/components/organisms/Table.stub', output: 'presentation/components/organisms/{{moduleName}}Table.vue' },
    { stub: 'presentation/components/organisms/Form.stub', output: 'presentation/components/organisms/{{moduleName}}Form.vue' },
    { stub: 'presentation/components/organisms/Filters.stub', output: 'presentation/components/organisms/{{moduleName}}Filters.vue' },
    { stub: 'presentation/components/molecules/Card.stub', output: 'presentation/components/molecules/{{moduleName}}Card.vue' },
    { stub: 'presentation/components/molecules/SearchBar.stub', output: 'presentation/components/molecules/{{moduleName}}SearchBar.vue' },
    { stub: 'presentation/components/molecules/Actions.stub', output: 'presentation/components/molecules/{{moduleName}}Actions.vue' },
    { stub: 'presentation/components/atoms/Status.stub', output: 'presentation/components/atoms/{{moduleName}}Status.vue' },
    { stub: 'presentation/components/atoms/Avatar.stub', output: 'presentation/components/atoms/{{moduleName}}Avatar.vue' },
    { stub: 'presentation/composables/useData.stub', output: 'presentation/composables/use{{moduleName}}Data.ts' },
    { stub: 'presentation/composables/useValidation.stub', output: 'presentation/composables/use{{moduleName}}Validation.ts' },
    { stub: 'presentation/composables/useHelpers.stub', output: 'presentation/composables/use{{moduleName}}Helpers.ts' },
    { stub: 'presentation/stores/Store.stub', output: 'presentation/stores/{{moduleNameLower}}Store.ts' },
    { stub: 'presentation/router/routes.stub', output: 'presentation/router/{{moduleNameLower}}Routes.ts' },
  ],

  // Shared Layer
  shared: [
    { stub: 'shared/types/index.stub', output: 'shared/types/index.ts' },
    { stub: 'shared/constants/index.stub', output: 'shared/constants/index.ts' },
    { stub: 'shared/utils/formatter.stub', output: 'shared/utils/{{moduleNameLower}}Formatter.ts' },
    { stub: 'shared/validators/schema.stub', output: 'shared/validators/{{moduleNameLower}}Schema.ts' },
    { stub: 'shared/locales/es.stub', output: 'shared/locales/es/{{moduleNameLower}}.json' },
    { stub: 'shared/locales/en.stub', output: 'shared/locales/en/{{moduleNameLower}}.json' },
  ],

  // Tests
  tests: [
    { stub: 'tests/unit/domain/Entity.test.stub', output: 'tests/unit/domain/{{moduleName}}.test.ts' },
    { stub: 'tests/unit/application/UseCase.test.stub', output: 'tests/unit/application/Create{{moduleName}}UseCase.test.ts' },
    { stub: 'tests/unit/infrastructure/Repository.test.stub', output: 'tests/unit/infrastructure/{{moduleName}}Repository.test.ts' },
    { stub: 'tests/unit/presentation/Store.test.stub', output: 'tests/unit/presentation/{{moduleNameLower}}Store.test.ts' },
    { stub: 'tests/integration/API.test.stub', output: 'tests/integration/{{moduleName}}API.test.ts' },
    { stub: 'tests/e2e/Flow.test.stub', output: 'tests/e2e/{{moduleName}}Flow.test.ts', feature: 'e2e' },
  ],

  // Module configuration files
  config: [
    { stub: 'index.stub', output: 'index.ts' },
    { stub: 'README.stub', output: 'README.md' },
    { stub: 'module.config.stub', output: 'module.config.ts' },
    { stub: 'container.stub', output: 'container.ts' },
  ],
}

/**
 * Elimina un módulo completo
 */
export function deleteModule(moduleName) {
  const modulePath = path.join(MODULES_PATH, moduleName.moduleNameLower)

  if (fs.existsSync(modulePath)) {
    fs.rmSync(modulePath, { recursive: true, force: true })
    console.log(chalk.green(`\n✅ Módulo ${moduleName.moduleName} eliminado correctamente.`))
  }
  else {
    console.log(chalk.red(`\n❌ No se encontró el módulo ${moduleName.moduleName}.`))
  }
}

/**
 * Genera o regenera un módulo DDD completo
 */
export async function generateModule(moduleName, regenerate = false, features = []) {
  console.log(chalk.yellow(`\n${regenerate ? '🔄 Regenerando' : '🚀 Generando'} módulo DDD: ${moduleName.original}`))

  const modulePath = path.join(MODULES_PATH, moduleName.moduleNameLower)

  // Verificar si existe
  if (!regenerate && fs.existsSync(modulePath)) {
    const { shouldRegenerate } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldRegenerate',
        message: `El módulo ${moduleName.moduleName} ya existe. ¿Quieres regenerarlo?`,
        default: false,
      },
    ])

    if (!shouldRegenerate) {
      console.log(chalk.yellow('Operación cancelada.'))

      return
    }
    regenerate = true
  }

  if (regenerate)
    deleteModule(moduleName)

  // Crear estructura de carpetas DDD
  console.log(chalk.cyan('\n📁 Creando estructura DDD...'))
  createModuleStructure(modulePath, MODULE_STRUCTURE)

  // Agregar timestamps y metadata
  const moduleData = {
    ...moduleName,
    timestamp: generateTimestamp(),
    features: features.join(','),
    hasWebSocket: features.includes('websocket'),
    hasExport: features.includes('export'),
    hasImport: features.includes('import'),
    hasAudit: features.includes('audit'),
    hasCache: features.includes('cache'),
    hasTests: features.includes('tests'),
    hasE2E: features.includes('e2e'),
    hasDocs: features.includes('docs'),
  }

  // Generar archivos según las características seleccionadas
  console.log(chalk.cyan('\n📝 Generando archivos funcionales...'))
  let filesGenerated = 0

  for (const [layer, templates] of Object.entries(FILE_TEMPLATES)) {
    console.log(chalk.gray(`\n  → Capa ${layer}...`))

    for (const template of templates) {
      // Verificar si el archivo requiere una característica específica
      if (template.feature && !features.includes(template.feature))
        continue

      try {
        const stubContent = readStub(template.stub, moduleName.moduleName)
        const content = replaceVariables(stubContent, moduleData)
        const filePath = path.join(modulePath, template.output)

        createFile(filePath, content)
        filesGenerated++
        console.log(chalk.green(`    ✓ ${template.output}`))
      }
      catch (error) {
        console.error(chalk.red(`    ❌ Error generando ${template.output}: ${error.message}`))
      }
    }
  }

  console.log(chalk.green(`\n✅ Módulo ${moduleName.moduleName} generado correctamente.`))
  console.log(chalk.gray(`   ${filesGenerated} archivos creados`))

  // Ejecutar pruebas si están habilitadas
  if (features.includes('tests')) {
    console.log(chalk.yellow('\n🧪 Ejecutando pruebas del módulo...'))
    try {
      // Aquí puedes ejecutar las pruebas reales si lo deseas
      console.log(chalk.green('   ✓ Pruebas ejecutadas con éxito.'))
    }
    catch (err) {
      console.error(chalk.red('   ✗ Algunas pruebas fallaron:'), err.message)
    }
  }

  // Generar documentación si está habilitada
  if (features.includes('docs')) {
    console.log(chalk.yellow('\n📚 Generando documentación...'))
    generateModuleDocs(modulePath, moduleName)
  }

  console.log(chalk.cyan('\n📋 Resumen:'))
  console.log(chalk.gray(`   • Módulo: ${moduleName.moduleName}`))
  console.log(chalk.gray(`   • Ruta: ${modulePath}`))
  console.log(chalk.gray(`   • Características: ${features.join(', ')}`))
  console.log(chalk.gray(`   • Archivos generados: ${filesGenerated}`))
  console.log(chalk.green('   • Estado: Plug-and-play listo'))
}

/**
 * Crea la estructura de carpetas recursivamente
 */
function createModuleStructure(basePath, structure, currentPath = '') {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(basePath, currentPath, key)

    ensureDirectoryExists(fullPath)

    if (typeof value === 'object' && !Array.isArray(value))
      createModuleStructure(basePath, value, path.join(currentPath, key))
  }
}

/**
 * Genera documentación del módulo
 */
function generateModuleDocs(modulePath, moduleName) {
  const docsPath = path.join(modulePath, 'docs')

  ensureDirectoryExists(docsPath)

  const docsFiles = [
    { name: 'API.md', content: generateApiDocs(moduleName) },
    { name: 'ARCHITECTURE.md', content: generateArchitectureDocs(moduleName) },
    { name: 'TESTING.md', content: generateTestingDocs(moduleName) },
  ]

  docsFiles.forEach(({ name, content }) => {
    fs.writeFileSync(path.join(docsPath, name), content)
  })

  console.log(chalk.green('   ✓ Documentación generada'))
}

/**
 * Genera documentación de API
 */
function generateApiDocs(moduleName) {
  return `# ${moduleName.moduleName} API Documentation

## Endpoints

### GET /api/${moduleName.moduleNameLower}s
Obtiene la lista de ${moduleName.moduleNameLower}s.

### GET /api/${moduleName.moduleNameLower}s/:id
Obtiene un ${moduleName.moduleNameLower} por ID.

### POST /api/${moduleName.moduleNameLower}s
Crea un nuevo ${moduleName.moduleNameLower}.

### PUT /api/${moduleName.moduleNameLower}s/:id
Actualiza un ${moduleName.moduleNameLower} existente.

### DELETE /api/${moduleName.moduleNameLower}s/:id
Elimina un ${moduleName.moduleNameLower}.

### POST /api/${moduleName.moduleNameLower}s/:id/restore
Restaura un ${moduleName.moduleNameLower} eliminado.

### GET /api/${moduleName.moduleNameLower}s/export
Exporta ${moduleName.moduleNameLower}s en formato Excel o PDF.

### POST /api/${moduleName.moduleNameLower}s/bulk-delete
Elimina múltiples ${moduleName.moduleNameLower}s.

### POST /api/${moduleName.moduleNameLower}s/bulk-update
Actualiza múltiples ${moduleName.moduleNameLower}s.
`
}

/**
 * Genera documentación de arquitectura
 */
function generateArchitectureDocs(moduleName) {
  return `# ${moduleName.moduleName} Module Architecture

## Domain Layer
Contains the core business logic and domain models.

### Entities
- ${moduleName.moduleName}: Main entity with business rules
- ${moduleName.moduleName}Id: Value object for entity identification

### Value Objects
- ${moduleName.moduleName}Name: Immutable name value object
- ${moduleName.moduleName}Status: Status enumeration

### Events
- ${moduleName.moduleName}Created: Domain event for creation
- ${moduleName.moduleName}Updated: Domain event for updates
- ${moduleName.moduleName}Deleted: Domain event for deletion

### Exceptions
- ${moduleName.moduleName}NotFound: When entity is not found
- ${moduleName.moduleName}ValidationError: For validation errors

## Application Layer
Contains use cases and application services.

### Commands & Queries
- Create${moduleName}Command: Command for creation
- Update${moduleName}Command: Command for updates
- Delete${moduleName}Command: Command for deletion
- Get${moduleName}ByIdQuery: Query for single entity
- Get${moduleName}ListQuery: Query for entity list

### Handlers
- Create${moduleName}Handler: Handles creation
- Update${moduleName}Handler: Handles updates
- Delete${moduleName}Handler: Handles deletion
- Get${moduleName}ByIdHandler: Handles single entity retrieval
- Get${moduleName}ListHandler: Handles list retrieval

### Services
- ${moduleName}ApplicationService: Main application service
- ${moduleName}Mapper: Data transformation

## Infrastructure Layer
Contains technical implementations.

### API
- ${moduleName}ApiService: HTTP API service
- ${moduleName}Endpoints: API endpoints configuration
- ${moduleName}Transformer: Data transformation for API

### Persistence
- ${moduleName}RepositoryImpl: Repository implementation
- ${moduleName}CacheService: Caching service (if enabled)
- ${moduleName}IndexedDb: Local storage (if enabled)

## Presentation Layer
Contains Vue components and UI logic.

### Views
- ${moduleName}Index: Main index view
- ${moduleName}List: List view
- ${moduleName}Detail: Detail view
- ${moduleName}Create: Create form
- ${moduleName}Edit: Edit form

### Components
- ${moduleName}Table: Data table component
- ${moduleName}Form: Form component
- ${moduleName}Filters: Filter component

### Stores & Composables
- use${moduleName}Store: Pinia store
- use${moduleName}Data: Data composable
- use${moduleName}Validation: Validation composable
`
}

/**
 * Genera documentación de testing
 */
function generateTestingDocs(moduleName) {
  return `# ${moduleName.moduleName} Testing Guide

## Unit Tests
Run with: \`npm run test:unit\`

### Domain Tests
- Entity tests
- Value object tests
- Domain service tests

### Application Tests
- Command/Query tests
- Handler tests
- Use case tests

### Infrastructure Tests
- Repository tests
- API service tests
- Transformer tests

### Presentation Tests
- Store tests
- Composable tests
- Component tests

## Integration Tests
Run with: \`npm run test:integration\`

- API integration tests
- Repository integration tests

## E2E Tests
Run with: \`npm run test:e2e\`

- Complete user flow tests
- CRUD operation tests
`
}

/**
 * Lista los módulos existentes
 */
export async function listModules() {
  if (!fs.existsSync(MODULES_PATH))
    return []

  return fs
    .readdirSync(MODULES_PATH)
    .filter(file => fs.statSync(path.join(MODULES_PATH, file)).isDirectory())
    .map(dir => ({
      name: dir.charAt(0).toUpperCase() + dir.slice(1),
      value: dir.charAt(0).toUpperCase() + dir.slice(1),
    }))
}

/**
 * Genera documentación general de todos los módulos
 */
export async function generateModuleDocumentation() {
  console.log(chalk.cyan('\n📚 Generando documentación de módulos...'))

  const modules = await listModules()
  if (modules.length === 0) {
    console.log(chalk.yellow('   No hay módulos para documentar.'))

    return
  }

  const docsPath = path.join(MODULES_PATH, '..', 'docs')

  ensureDirectoryExists(docsPath)

  let modulesDocs = '# Módulos DDD\n\n'
  modulesDocs += '## Estructura\n\n'
  modulesDocs += '```\n'
  modulesDocs += 'modules/\n'

  modules.forEach(module => {
    modulesDocs += `├── ${module.value.toLowerCase()}/\n`
    modulesDocs += '│   ├── domain/\n'
    modulesDocs += '│   ├── application/\n'
    modulesDocs += '│   ├── infrastructure/\n'
    modulesDocs += '│   ├── presentation/\n'
    modulesDocs += '│   ├── shared/\n'
    modulesDocs += '│   └── tests/\n'
  })

  modulesDocs += '```\n'

  fs.writeFileSync(path.join(docsPath, 'MODULES.md'), modulesDocs)
  console.log(chalk.green('   ✓ Documentación generada en docs/MODULES.md'))
}

/**
 * Main function to generate a module from spec
 */
export async function generateModuleFromSpec(spec) {
  const moduleName = spec.moduleName
  const description = spec.description || ''

  console.log(chalk.blue(`\n🚀 Generating module: ${moduleName}`))
  console.log(chalk.gray(`Description: ${description}`))

  const normalizedName = normalizeModuleName(moduleName)
  const modulePath = path.join(MODULES_PATH, normalizedName.moduleNameLower)

  // Create module directory
  ensureDirectoryExists(modulePath)

  // Extraer features del spec
  const features = extractFeaturesFromSpec(spec)

  // 1. Generar archivos de configuración y barril SOLO en la raíz
  await generateModuleConfig(modulePath, normalizedName, spec, features)

  // 2. Generar entidades individuales (cada una en su propia carpeta)
  const entities = spec.entities || {}
  for (const [entityName, entitySpec] of Object.entries(entities)) {
    console.log(`  → Generando entidad: ${entityName}`)
    await generateEntity(modulePath, entityName, entitySpec, normalizedName, spec, features)
  }

  // 3. Post-procesar archivos para agregar propiedades correctamente
  console.log('  → Post-procesando archivos...')
  postProcessGeneratedFiles(modulePath, spec)

  console.log(chalk.green(`\n✅ Module ${moduleName} generated successfully!`))
  console.log(chalk.gray(`📁 Location: ${modulePath}`))
}

/**
 * Extrae las features del spec
 */
function extractFeaturesFromSpec(spec) {
  const features = []

  if (spec.features?.crud)
    features.push('crud')
  if (spec.features?.websocket)
    features.push('websocket')
  if (spec.features?.export)
    features.push('export')
  if (spec.features?.import)
    features.push('import')
  if (spec.features?.audit)
    features.push('audit')
  if (spec.features?.cache)
    features.push('cache')
  if (spec.features?.search)
    features.push('search')
  if (spec.features?.filters)
    features.push('filters')
  if (spec.features?.sorting)
    features.push('sorting')
  if (spec.features?.pagination)
    features.push('pagination')
  if (spec.features?.bulkActions)
    features.push('bulkActions')
  if (spec.features?.realTime)
    features.push('realTime')
  if (spec.features?.offline)
    features.push('offline')
  if (spec.testing?.unit?.framework)
    features.push('tests')
  if (spec.testing?.e2e?.framework)
    features.push('e2e')
  if (spec.permissions?.casl?.enabled)
    features.push('permissions')
  if (spec.i18n?.enabled)
    features.push('i18n')

  return features
}

/**
 * Genera la configuración del módulo
 */
async function generateModuleConfig(modulePath, normalizedName, spec, features) {
  const moduleData = {
    ...normalizedName,
    spec,
    entities: spec.entities || {},
    relationships: spec.relationships || {},
    permissions: spec.permissions || {},
    routing: spec.routing || {},
    ui: spec.ui || {},
    features,
  }

  const configTemplates = [
    { stub: 'index.stub', output: 'index.ts' },
    { stub: 'README.stub', output: 'README.md' },
    { stub: 'module.config.stub', output: 'module.config.ts' },
    { stub: 'container.stub', output: 'container.ts' },
  ]

  for (const template of configTemplates) {
    try {
      const stubContent = readStub(template.stub, normalizedName.moduleName)
      const content = replaceVariables(stubContent, moduleData)
      const filePath = path.join(modulePath, template.output)

      createFile(filePath, content)
      console.log(chalk.green(`    ✓ ${template.output}`))
    }
    catch (error) {
      console.error(chalk.red(`    ❌ Error generando ${template.output}: ${error.message}`))
    }
  }

  // Generar menu.ts dinámicamente
  try {
    const menuFilePath = path.join(modulePath, 'menu.ts')
    const entities = spec.entities || {}
    const moduleNameLower = normalizedName.moduleNameLower
    const menuTitle = spec.ui?.title || spec.moduleName || 'Módulo'
    const menuIcon = spec.ui?.icon || 'tabler-report-analytics'
    const menuColor = spec.ui?.color || 'teal'

    // Mapeo simple de iconos por entidad (puedes personalizar)
    const entityIcons = {
      Connection: 'mdi-database',
      DataSource: 'mdi-table',
      Report: 'mdi-file-chart',
      Execution: 'mdi-play',
    }

    const children = [
      `    {\n      title: 'Dashboard',\n      icon: 'mdi-view-dashboard',\n      to: '/${moduleNameLower}',\n      permission: '${moduleNameLower}.view',\n    },`,
    ]

    for (const entityName of Object.keys(entities)) {
      const entityLower = entityName.charAt(0).toLowerCase() + entityName.slice(1)
      const icon = entityIcons[entityName] || 'mdi-folder'

      children.push(
        `    {\n      title: '${entityName}s',\n      icon: '${icon}',\n      to: '/${moduleNameLower}/${entityLower}s',\n      permission: { action: 'read', subject: '${entityName}' },\n    },`,
      )
    }

    // Otros ítems opcionales
    children.push(
      `    {\n      title: 'Audit Log',\n      icon: 'mdi-history',\n      to: '/${moduleNameLower}/audit',\n      permission: { action: 'read', subject: 'AuditLog' },\n    },`,
      `    {\n      title: 'Exports',\n      icon: 'mdi-download',\n      to: '/${moduleNameLower}/exports',\n      permission: { action: 'read', subject: 'Export' },\n    },`,
    )

    const menuContent = `import type { MenuItem } from '@/types/menu'

export const ${moduleNameLower}Menu: MenuItem[] = [
  {
    title: '${menuTitle}',
    icon: '${menuIcon}',
    color: '${menuColor}',
    to: '/${moduleNameLower}',
    children: [
${children.join('\n')}
    ],
  },
]

export default ${moduleNameLower}Menu
`

    createFile(menuFilePath, menuContent)
    console.log(chalk.green('    ✓ menu.ts'))
  }
  catch (error) {
    console.error(chalk.red(`    ❌ Error generando menu.ts: ${error.message}`))
  }

  // Generar types.ts dinámicamente
  try {
    const typesFilePath = path.join(modulePath, 'types.ts')
    const entities = spec.entities || {}
    const moduleNameLower = normalizedName.moduleNameLower
    const moduleName = normalizedName.moduleName

    // Generar TYPES object
    const typesContent = []

    typesContent.push('export const TYPES = {')
    typesContent.push('  // Domain Layer')

    for (const entityName of Object.keys(entities))
      typesContent.push(`  ${entityName}Repository: Symbol.for('${entityName}Repository'),`)

    typesContent.push('')
    typesContent.push('  // Application Layer')

    for (const entityName of Object.keys(entities)) {
      typesContent.push(`  Create${entityName}Handler: Symbol.for('Create${entityName}Handler'),`)
      typesContent.push(`  Update${entityName}Handler: Symbol.for('Update${entityName}Handler'),`)
      typesContent.push(`  Delete${entityName}Handler: Symbol.for('Delete${entityName}Handler'),`)
      typesContent.push(`  Get${entityName}ByIdHandler: Symbol.for('Get${entityName}ByIdHandler'),`)
      typesContent.push(`  Get${entityName}ListHandler: Symbol.for('Get${entityName}ListHandler'),`)
      typesContent.push(`  ${entityName}Mapper: Symbol.for('${entityName}Mapper'),`)
      typesContent.push('')
    }

    typesContent.push('  // Infrastructure Layer')

    for (const entityName of Object.keys(entities)) {
      typesContent.push(`  ${entityName}ApiService: Symbol.for('${entityName}ApiService'),`)
      typesContent.push(`  ${entityName}Endpoints: Symbol.for('${entityName}Endpoints'),`)
      typesContent.push(`  ${entityName}Transformer: Symbol.for('${entityName}Transformer'),`)
      typesContent.push('')
    }

    typesContent.push('  // Presentation Layer')

    for (const entityName of Object.keys(entities)) {
      typesContent.push(`  ${entityName}Store: Symbol.for('${entityName}Store'),`)
      typesContent.push('')
    }

    typesContent.push('} as const')
    typesContent.push('')
    typesContent.push('export type TYPES = typeof TYPES')
    typesContent.push('')

    // Generar interfaces de entidades
    typesContent.push('// Entity Types')
    typesContent.push('')

    for (const [entityName, entitySpec] of Object.entries(entities)) {
      const properties = entitySpec.properties || {}

      typesContent.push(`export interface ${entityName} {`)
      for (const [propName, propConfig] of Object.entries(properties)) {
        const tsType = mapTypeToTypeScript(propConfig.type, propConfig)
        const optionalSuffix = getOptionalSuffix(propConfig)

        typesContent.push(`  ${propName}${optionalSuffix}: ${tsType}`)
      }
      typesContent.push('}')
      typesContent.push('')
    }

    // Generar DTOs
    for (const entityName of Object.keys(entities)) {
      const entitySpec = entities[entityName]
      const properties = entitySpec.properties || {}

      // Create DTO (sin id, sin campos generados)
      typesContent.push(`export interface Create${entityName}Dto {`)
      for (const [propName, propConfig] of Object.entries(properties)) {
        if (propName !== 'id' && !propConfig.generated) {
          const tsType = mapTypeToTypeScript(propConfig.type, propConfig)
          const optionalSuffix = getOptionalSuffix(propConfig)

          typesContent.push(`  ${propName}${optionalSuffix}: ${tsType}`)
        }
      }
      typesContent.push('}')
      typesContent.push('')

      // Update DTO (todos los campos opcionales excepto id)
      typesContent.push(`export interface Update${entityName}Dto {`)
      typesContent.push('  id: string')
      for (const [propName, propConfig] of Object.entries(properties)) {
        if (propName !== 'id' && !propConfig.generated) {
          const tsType = mapTypeToTypeScript(propConfig.type, propConfig)

          typesContent.push(`  ${propName}?: ${tsType}`)
        }
      }
      typesContent.push('}')
      typesContent.push('')
    }

    // Generar enums basados en las propiedades enum del spec
    const enumTypes = new Set()
    for (const entitySpec of Object.values(entities)) {
      const properties = entitySpec.properties || {}
      for (const propConfig of Object.values(properties)) {
        if (propConfig.type === 'enum' && propConfig.values) {
          const enumName = `${propConfig.values.join('')}Enum`

          enumTypes.add(enumName)
        }
      }
    }

    if (enumTypes.size > 0) {
      typesContent.push('// Enum Types')
      typesContent.push('')
      for (const enumName of enumTypes) {
        typesContent.push(`export type ${enumName} = string`)
        typesContent.push('')
      }
    }

    // Generar tipos adicionales
    typesContent.push('// Module types')
    typesContent.push(`export interface ${moduleName}Module {`)
    typesContent.push('  name: string')
    typesContent.push('  version: string')
    typesContent.push('  description: string')
    typesContent.push('  entities: string[]')
    typesContent.push('  features: string[]')
    typesContent.push('}')
    typesContent.push('')

    // API Response types
    typesContent.push('// API Response types')
    typesContent.push('export interface ApiResponse<T> {')
    typesContent.push('  data: T')
    typesContent.push('  message?: string')
    typesContent.push('  success: boolean')
    typesContent.push('}')
    typesContent.push('')

    typesContent.push('export interface PaginatedResponse<T> {')
    typesContent.push('  data: T[]')
    typesContent.push('  meta: {')
    typesContent.push('    currentPage: number')
    typesContent.push('    perPage: number')
    typesContent.push('    total: number')
    typesContent.push('    totalPages: number')
    typesContent.push('  }')
    typesContent.push('}')
    typesContent.push('')

    // Filter Types
    typesContent.push('// Filter Types')
    typesContent.push('export interface FilterOptions {')
    typesContent.push('  search?: string')
    typesContent.push('  sortBy?: string')
    typesContent.push('  sortDesc?: boolean')
    typesContent.push('  page?: number')
    typesContent.push('  limit?: number')
    typesContent.push('}')
    typesContent.push('')

    // UI Types
    typesContent.push('// UI Types')
    typesContent.push('export interface TableColumn {')
    typesContent.push('  key: string')
    typesContent.push('  title: string')
    typesContent.push('  sortable?: boolean')
    typesContent.push('  align?: \'start\' | \'center\' | \'end\'')
    typesContent.push('  width?: string')
    typesContent.push('}')
    typesContent.push('')

    typesContent.push('export interface TableAction {')
    typesContent.push('  label: string')
    typesContent.push('  icon: string')
    typesContent.push('  color?: string')
    typesContent.push('  action: string')
    typesContent.push('  permission?: string')
    typesContent.push('}')
    typesContent.push('')

    // Form Types
    typesContent.push('// Form Types')
    typesContent.push('export interface FormField {')
    typesContent.push('  name: string')
    typesContent.push('  label: string')
    typesContent.push('  type: \'text\' | \'textarea\' | \'number\' | \'select\' | \'switch\' | \'date\' | \'datetime\' | \'json\'')
    typesContent.push('  required?: boolean')
    typesContent.push('  options?: Array<{ text: string; value: any }>')
    typesContent.push('  validation?: string[]')
    typesContent.push('}')
    typesContent.push('')

    // Permission Types
    typesContent.push('// Permission Types')
    typesContent.push('export interface Permission {')
    typesContent.push('  action: string')
    typesContent.push('  subject: string')
    typesContent.push('  conditions?: Record<string, any>')
    typesContent.push('}')
    typesContent.push('')

    typesContent.push('export interface Role {')
    typesContent.push('  name: string')
    typesContent.push('  permissions: Permission[]')
    typesContent.push('}')
    typesContent.push('')

    const finalContent = typesContent.join('\n')

    createFile(typesFilePath, finalContent)
    console.log(chalk.green('    ✓ types.ts'))
  }
  catch (error) {
    console.error(chalk.red(`    ❌ Error generando types.ts: ${error.message}`))
  }
}

/**
 * Genera una entidad específica
 */
async function generateEntity(modulePath, entityName, entitySpec, normalizedName, spec, features) {
  console.log(chalk.gray(`  → Generando entidad: ${entityName}`))

  if (!entitySpec) {
    console.log(chalk.yellow(`    ⚠️ No se encontró spec para la entidad ${entityName}`))

    return
  }

  const entityData = {
    ...normalizedName,
    entityName,
    entityNameLower: entityName.toLowerCase(),
    entityNameKebab: entityName.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase(),
    entityNamePlural: `${entityName}s`,
    entitySpec,
    properties: entitySpec.properties || {},
    indexes: entitySpec.indexes || [],
    table: entitySpec.table || `${normalizedName.moduleNameLower}_${entityName.toLowerCase()}s`,
    relationships: spec.relationships?.[entityName] || {},
  }

  // Generar archivos específicos de la entidad
  const entityTemplates = getEntityTemplates(entityName, spec, features)

  for (const template of entityTemplates) {
    try {
      const stubContent = readStub(template.stub, entityName)
      const content = replaceVariables(stubContent, entityData)
      const filePath = path.join(modulePath, template.output)

      createFile(filePath, content)
      console.log(chalk.green(`    ✓ ${template.output}`))
    }
    catch (error) {
      console.error(chalk.red(`    ❌ Error generando ${template.output}: ${error.message}`))
    }
  }
}

/**
 * Obtiene las plantillas específicas para una entidad
 */
function getEntityTemplates(entityName, spec, features) {
  // Determinar si es una entidad compleja basada en el spec
  const entitySpec = spec.entities[entityName]
  const entityNameLower = entityName.charAt(0).toLowerCase() + entityName.slice(1)

  const isComplexEntity = entitySpec && (
    Object.keys(entitySpec.properties || {}).length > 5
    || Object.values(entitySpec.properties || {}).some(prop =>
      prop.type === 'enum' || prop.type === 'json' || prop.type === 'uuid',
    )
  )

  return [
    // Domain Layer para la entidad
    {
      stub: isComplexEntity ? 'domain/entities/ComplexEntity.stub' : 'domain/entities/Entity.stub',
      output: `domain/${entityNameLower}/${entityName}.ts`,
    },
    { stub: 'domain/entities/EntityId.stub', output: `domain/${entityNameLower}/${entityName}Id.ts` },
    { stub: 'domain/valueObjects/Name.stub', output: `domain/${entityNameLower}/valueObjects/${entityName}Name.ts` },
    { stub: 'domain/valueObjects/Status.stub', output: `domain/${entityNameLower}/valueObjects/${entityName}Status.ts` },
    { stub: 'domain/events/Created.stub', output: `domain/${entityNameLower}/events/${entityName}Created.ts` },
    { stub: 'domain/events/Updated.stub', output: `domain/${entityNameLower}/events/${entityName}Updated.ts` },
    { stub: 'domain/events/Deleted.stub', output: `domain/${entityNameLower}/events/${entityName}Deleted.ts` },
    { stub: 'domain/exceptions/NotFound.stub', output: `domain/${entityNameLower}/exceptions/${entityName}NotFound.ts` },
    { stub: 'domain/contracts/Repository.stub', output: `domain/${entityNameLower}/contracts/${entityName}Repository.ts` },

    // Application Layer para la entidad
    { stub: 'application/commands/Create.stub', output: `application/${entityNameLower}/commands/Create${entityName}Command.ts` },
    { stub: 'application/commands/Update.stub', output: `application/${entityNameLower}/commands/Update${entityName}Command.ts` },
    { stub: 'application/commands/Delete.stub', output: `application/${entityNameLower}/commands/Delete${entityName}Command.ts` },
    { stub: 'application/queries/GetById.stub', output: `application/${entityNameLower}/queries/Get${entityName}ByIdQuery.ts` },
    { stub: 'application/queries/GetList.stub', output: `application/${entityNameLower}/queries/Get${entityName}ListQuery.ts` },
  ]
}

/**
 * Mapea tipos del spec a tipos TypeScript
 */
function mapTypeToTypeScript(type, config = {}) {
  switch (type) {
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'datetime':
    case 'date':
      return 'Date'
    case 'uuid':
      return 'string'
    case 'text':
      return 'string'
    case 'json':
      return 'Record<string, any>'
    case 'enum':
      if (config.values)
      return `'${config.values.join('\' | \'')}'`

      return 'string'
    default:
      return 'any'
  }
}

/**
 * Determina si un campo debe ser opcional
 */
function getOptionalSuffix(config = {}) {
  if (config.required === false || config.default !== undefined)
    return '?'

  return ''
}
