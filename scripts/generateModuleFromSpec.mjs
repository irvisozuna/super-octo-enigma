#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'
import { generateModule } from './generator.mjs'
import { createFile, ensureDirectoryExists, normalizeModuleName, readStub, replaceVariables } from './generateModule/helpers.mjs'
import { MODULES_PATH, STUBS_PATH } from './generateModule/config.mjs'

function findTemplateFiles(dir) {
  const templateFiles = []

  function scanDirectory(currentDir) {
    try {
      const items = fs.readdirSync(currentDir)

      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory())
          scanDirectory(fullPath)
        else if (stat.isFile() && (item.includes('{{') && item.includes('}}')))
          templateFiles.push(fullPath)
      }
    }
    catch (error) {
      // Ignorar errores de permisos
    }
  }

  scanDirectory(dir)

  return templateFiles
}

function cleanTemplateFiles(modulePath) {
  console.log(chalk.yellow('🧹 Cleaning files with unreplaced variables in filename...'))

  let cleanedCount = 0

  try {
    const filesToDelete = findTemplateFiles(modulePath)

    filesToDelete.forEach(filePath => {
      try {
        fs.unlinkSync(filePath)
        cleanedCount++

        const relativePath = path.relative(modulePath, filePath)

        console.log(chalk.gray(`   ✓ Deleted: ${relativePath}`))
      }
      catch (error) {
        console.log(chalk.red(`   ❌ Failed to delete: ${filePath}`))
      }
    })
  }
  catch (error) {
    console.log(chalk.red(`❌ Error scanning for template files: ${error.message}`))
  }

  console.log(chalk.green(`✅ Cleaned ${cleanedCount} template files with {{}} in filename`))
}

const createModuleConfigTemplate = spec => {
  const moduleName = spec.moduleName
  const moduleNameLower = moduleName.toLowerCase()

  return `import type { ModuleConfig } from '@/types/module'

export const ${moduleNameLower}Config: ModuleConfig = {
  name: '${moduleName}',
  version: '${spec.version || '1.0.0'}',
  description: '${spec.description || `Módulo ${moduleName}`}',
  author: '${spec.author || 'Development Team'}',
  framework: '${spec.framework || 'vue'}',
  language: '${spec.language || 'typescript'}',
  
  // Entities configuration
  entities: {
    ${Object.keys(spec.entities).map(entityName => `'${entityName}': {
      name: '${entityName}',
      table: '${spec.entities[entityName].table || entityName.toLowerCase()}',
      description: '${spec.entities[entityName].description || `Entidad ${entityName}`}',
      fields: ${JSON.stringify(Object.keys(spec.entities[entityName].properties || {}), null, 6)}
    }`).join(',\n    ')}
  },

  // Features
  features: {
    crud: true,
    websocket: ${spec.features?.websocket?.enabled || false},
    export: ${spec.features?.export?.enabled || true},
    import: true,
    audit: true,
    cache: ${spec.features?.cache?.enabled || true},
    tests: true,
    e2e: false,
    docs: true,
  },

  // UI Configuration
  ui: {
    theme: {
      primary: '${spec.ui?.theme?.primaryColor || '#3B82F6'}',
      secondary: '#6B7280',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    icon: 'mdi-monitor-dashboard',
    color: 'primary',
    menuPosition: 'sidebar',
    menuOrder: 100,
  },

  // Routing
  routing: {
    basePath: '/${moduleNameLower}',
    routes: [
      { path: '', name: '${moduleName}List', component: '${moduleName}List' },
      { path: '/create', name: '${moduleName}Create', component: '${moduleName}Create' },
      { path: '/:id', name: '${moduleName}Detail', component: '${moduleName}Detail' },
      { path: '/:id/edit', name: '${moduleName}Edit', component: '${moduleName}Edit' }
    ],
  },

  // Permissions
  permissions: {
    casl: {
      enabled: true,
      subjects: ['${moduleName}'],
      actions: ['create', 'read', 'update', 'delete', 'export'],
      abilities: [],
      roles: ['admin', 'user', 'readonly'],
    },
    legacy: {},
  },

  // API Configuration
  api: {
    baseUrl: '${spec.api?.baseUrl || '/api/v1'}',
    version: 'v1',
    timeout: 30000,
    retries: 3,
    endpoints: {},
  },

  // Dependencies
  dependencies: {
    core: ['vue', 'pinia', 'vue-router'],
    ui: ['tailwindcss', 'headlessui'],
    validation: ['zod', 'vee-validate'],
    utilities: ['lodash-es', 'dayjs'],
    charts: [],
    dev: ['typescript', 'vitest'],
  },

  // Build Configuration
  buildConfig: {
    vite: {
      optimizeDeps: {
        include: ['vue', 'pinia']
      }
    },
    typescript: {
      strict: true
    },
    tailwind: {
      content: [\`src/modules/${moduleNameLower}/**/*.{vue,ts,js}\`]
    },
  },

  // Testing Configuration
  testing: {
    unit: {
      enabled: true,
      framework: 'vitest'
    },
    e2e: {
      enabled: false,
      framework: 'cypress'
    },
  },

  // Responsive Configuration
  responsive: {
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px'
    },
    mobileFirst: true,
    components: ['table', 'form', 'list'],
  },

  // Accessibility Configuration
  accessibility: {
    standards: 'WCAG 2.1 AA',
    features: ['keyboard-navigation', 'screen-reader', 'high-contrast'],
    testing: { enabled: true, tools: ['axe'] },
  },

  // Security Configuration
  security: {
    authentication: { required: true, type: 'bearer' },
    authorization: { enabled: true, type: 'casl' },
    dataProtection: { encryption: false, sanitization: true },
    csp: { enabled: false },
  },

  // Performance Configuration
  performance: {
    optimization: { lazy: true, treeshaking: true },
    caching: { enabled: true, strategy: 'stale-while-revalidate' },
    monitoring: { enabled: false },
  },

  // Internationalization
  i18n: {
    enabled: true,
    defaultLocale: 'es',
    supportedLocales: ['es', 'en'],
    messages: {},
  },
}

export default ${moduleNameLower}Config`
}

const createIndexTemplate = spec => {
  const moduleName = spec.moduleName
  const moduleNameLower = moduleName.toLowerCase()
  const entities = Object.keys(spec.entities)

  return `// ${moduleName} Module
// Generated from spec: ${spec.moduleName}

import type { App } from 'vue'
import { createPinia } from 'pinia'
import { ${moduleNameLower}Menu } from './menu'
import { ${moduleNameLower}Routes } from './router/routes'

// Components
${entities.map(entity => `// export { ${entity}List, ${entity}Form, ${entity}Detail } from './presentation/components'`).join('\n')}

// Stores
${entities.map(entity => `// export { use${entity}Store } from './presentation/stores/${entity.toLowerCase()}Store'`).join('\n')}

// Composables
import { use${moduleName}Validation } from './presentation/composables/use${moduleName}Validation'
import { use${moduleName}Permissions } from './presentation/composables/use${moduleName}Permissions'
import { use${moduleName}API } from './presentation/composables/use${moduleName}API'

// API Services
${entities.map(entity => `export { ${entity}ApiService } from './infrastructure/api/services/${entity}ApiService'`).join('\n')}

// Entities
${entities.map(entity => `export type { ${entity} } from './domain/entities/${entity}'`).join('\n')}

// DTOs
${entities.map(entity => `export type { Create${entity}DTO, Update${entity}DTO } from './application/dtos'`).join('\n')}

// Repositories
${entities.map(entity => `export type { ${entity}Repository } from './application/repositories/${entity}Repository'`).join('\n')}

// Types
export * from './types'

// Module configuration
export const ${moduleNameLower}Module = {
  name: '${moduleNameLower}',
  version: '${spec.version || '1.0.0'}',
  description: '${spec.description || `Módulo ${moduleName}`}',
  author: '${spec.author || 'Development Team'}',
  
  // Module data
  entities: ${JSON.stringify(entities)},
  features: {
    crud: true,
    websocket: ${spec.features?.websocket?.enabled || false},
    export: ${spec.features?.export?.enabled || true},
    cache: ${spec.features?.cache?.enabled || true}
  },
  
  // Install function
  install(app: App) {
    // Register stores
    const pinia = createPinia()
    app.use(pinia)
    
    // Register components
    // Components will be registered here when implemented
    
    // Register routes
    if (app.config.globalProperties.$router) {
      ${moduleNameLower}Routes.forEach(route => {
        app.config.globalProperties.$router.addRoute(route)
      })
    }
    
    // Register menu
    if (app.config.globalProperties.$menu) {
      app.config.globalProperties.$menu.addMenu(${moduleNameLower}Menu)
    }
  }
}

// Export entities and services
export {
  // API Services
  ${entities.map(entity => `${entity}ApiService`).join(',\n  ')}
}

// Export stores (when implemented)
export {
  // Stores will be exported here
}

// Export composables
export {
  use${moduleName}Validation,
  use${moduleName}Permissions,
  use${moduleName}API
}

// Export routes and menu
export {
  ${moduleNameLower}Routes,
  ${moduleNameLower}Menu
}

// Default export
export default ${moduleNameLower}Module`
}

// ========================================
// TEMPLATES PARA ARQUITECTURA DDD COMPLETA
// ========================================

// Value Objects
const createValueObjectTemplate = (entityName, propertyName, propertyType) => {
  const className = `${entityName}${propertyName.charAt(0).toUpperCase() + propertyName.slice(1)}`

  return `export class ${className} {
  constructor(private readonly value: ${propertyType}) {
    this.validate(value)
  }

  private validate(value: ${propertyType}): void {
    if (!value) {
      throw new Error('${className} cannot be empty')
    }
    // Add specific validation logic here
  }

  getValue(): ${propertyType} {
    return this.value
  }

  equals(other: ${className}): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value.toString()
  }
}`
}

// Domain Events
const createDomainEventTemplate = (entityName, eventType) => {
  return `import { DomainEvent } from '@/shared/domain/DomainEvent'

export class ${entityName}${eventType} extends DomainEvent {
  constructor(
    public readonly ${entityName.toLowerCase()}Id: string,
    public readonly ${entityName.toLowerCase()}Data: any,
    occurredOn?: Date
  ) {
    super(${entityName.toLowerCase()}Id, occurredOn)
  }

  static eventName(): string {
    return '${entityName.toLowerCase()}.${eventType.toLowerCase()}'
  }
}`
}

// Domain Exceptions
const createDomainExceptionTemplate = (entityName, exceptionType) => {
  return `export class ${entityName}${exceptionType} extends Error {
  constructor(message: string) {
    super(message)
    this.name = '${entityName}${exceptionType}'
  }

  static notFound(id: string): ${entityName}${exceptionType} {
    return new ${entityName}${exceptionType}(\`${entityName} with id \${id} not found\`)
  }

  static invalidData(reason: string): ${entityName}${exceptionType} {
    return new ${entityName}${exceptionType}(\`Invalid ${entityName} data: \${reason}\`)
  }
}`
}

// Use Cases
const createUseCaseTemplate = (entityName, action) => {
  const useCaseName = `${action}${entityName}UseCase`
  const dtoName = action === 'Create' ? `Create${entityName}DTO` : action === 'Update' ? `Update${entityName}DTO` : 'string'

  return `import type { ${entityName} } from '../../domain/entities/${entityName}'
import type { ${entityName}Repository } from '../repositories/${entityName}Repository'
${action !== 'Delete' && action !== 'GetById' && action !== 'GetList' ? `import type { ${dtoName} } from '../dtos'` : ''}

export class ${useCaseName} {
  constructor(private repository: ${entityName}Repository) {}

  async execute(${action === 'Create' ? `data: ${dtoName}` : action === 'Update' ? `id: string, data: ${dtoName}` : action === 'Delete' || action === 'GetById' ? 'id: string' : ''}): Promise<${action === 'Delete' ? 'void' : action === 'GetList' ? `${entityName}[]` : entityName}> {
    ${action === 'Create'
    ? `
    return await this.repository.create(data)
    `
    : action === 'Update'
      ? `
    return await this.repository.update(id, data)
    `
      : action === 'Delete'
        ? `
    await this.repository.delete(id)
    `
        : action === 'GetById'
          ? `
    const ${entityName.toLowerCase()} = await this.repository.findById(id)
    if (!${entityName.toLowerCase()}) {
      throw new Error('${entityName} not found')
    }
    return ${entityName.toLowerCase()}
    `
          : action === 'GetList'
            ? `
    return await this.repository.findAll()
    `
            : ''}
  }
}`
}

// Commands
const createCommandTemplate = (entityName, action) => {
  const commandName = `${action}${entityName}Command`

  return `export class ${commandName} {
  constructor(
    ${action === 'Create' ? 'public readonly data: any' : action === 'Update' ? 'public readonly id: string, public readonly data: any' : 'public readonly id: string'}
  ) {}
}`
}

// Queries
const createQueryTemplate = (entityName, action) => {
  const queryName = `Get${entityName}${action}Query`

  return `export class ${queryName} {
  constructor(${action === 'ById' ? 'public readonly id: string' : action === 'List' ? '// Add filters here if needed' : ''}) {}
}`
}

// Handlers
const createHandlerTemplate = (entityName, action, type) => {
  const handlerName = `${action}${entityName}Handler`
  const requestName = `${action}${entityName}${type}`

  return `import { ${requestName} } from '../${type.toLowerCase()}s/${requestName}'
import { ${action}${entityName}UseCase } from '../useCases/${action}${entityName}UseCase'

export class ${handlerName} {
  constructor(private useCase: ${action}${entityName}UseCase) {}

  async handle(${type.toLowerCase()}: ${requestName}): Promise<${action === 'Delete' ? 'void' : action === 'GetList' ? 'any[]' : 'any'}> {
    ${action === 'Create'
    ? `
    return await this.useCase.execute(${type.toLowerCase()}.data)
    `
    : action === 'Update'
      ? `
    return await this.useCase.execute(${type.toLowerCase()}.id, ${type.toLowerCase()}.data)
    `
      : action === 'Delete' || action === 'GetById'
        ? `
    return await this.useCase.execute(${type.toLowerCase()}.id)
    `
        : action === 'GetList'
          ? `
    return await this.useCase.execute()
    `
          : ''}
  }
}`
}

// Vue Components
const createVueComponentTemplate = (entityName, componentType) => {
  const componentName = `${entityName}${componentType}`

  if (componentType === 'List') {
    return `<template>
  <div class="${entityName.toLowerCase()}-list">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">${entityName} List</h1>
      <router-link
        :to="{ name: '${entityName}Create' }"
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Create ${entityName}
      </router-link>
    </div>

    <div class="bg-white shadow-md rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="${entityName.toLowerCase()} in ${entityName.toLowerCase()}s" :key="${entityName.toLowerCase()}.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ ${entityName.toLowerCase()}.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ ${entityName.toLowerCase()}.status }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(${entityName.toLowerCase()}.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <router-link
                :to="{ name: '${entityName}Detail', params: { id: ${entityName.toLowerCase()}.id } }"
                class="text-blue-600 hover:text-blue-900 mr-4"
              >
                View
              </router-link>
              <router-link
                :to="{ name: '${entityName}Edit', params: { id: ${entityName.toLowerCase()}.id } }"
                class="text-green-600 hover:text-green-900"
              >
                Edit
              </router-link>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { use${entityName}Store } from '../stores/${entityName.toLowerCase()}Store'
import { formatDate } from '@/shared/utils/dateUtils'

const ${entityName.toLowerCase()}Store = use${entityName}Store()
const ${entityName.toLowerCase()}s = ref([])

onMounted(async () => {
  await load${entityName}s()
})

const load${entityName}s = async () => {
  try {
    ${entityName.toLowerCase()}s.value = await ${entityName.toLowerCase()}Store.getAll()
  } catch (error) {
    console.error('Error loading ${entityName.toLowerCase()}s:', error)
  }
}
</script>`
  }

  if (componentType === 'Form') {
    return `<template>
  <div class="${entityName.toLowerCase()}-form">
    <h2 class="text-xl font-bold mb-4">
      {{ isEdit ? 'Edit' : 'Create' }} ${entityName}
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
        <input
          id="name"
          v-model="form.name"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
        <select
          id="status"
          v-model="form.status"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div class="flex space-x-4">
        <button
          type="submit"
          :disabled="loading"
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : (isEdit ? 'Update' : 'Create') }}
        </button>
        <button
          type="button"
          @click="$emit('cancel')"
          class="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import type { ${entityName} } from '../../domain/entities/${entityName}'

interface Props {
  ${entityName.toLowerCase()}?: ${entityName}
  isEdit?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isEdit: false
})

const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

const loading = ref(false)
const form = reactive({
  name: '',
  status: 'active'
})

watch(() => props.${entityName.toLowerCase()}, (new${entityName}) => {
  if (new${entityName}) {
    Object.assign(form, new${entityName})
  }
}, { immediate: true })

const handleSubmit = async () => {
  loading.value = true
  try {
    emit('submit', { ...form })
  } finally {
    loading.value = false
  }
}
</script>`
  }

  return `<template>
  <div class="${entityName.toLowerCase()}-${componentType.toLowerCase()}">
    <h1>${entityName} ${componentType}</h1>
    <!-- Component content here -->
  </div>
</template>

<script setup lang="ts">
// Component logic here
</script>`
}

// Pinia Stores
const createStoreTemplate = entityName => {
  return `import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ${entityName} } from '../../domain/entities/${entityName}'
import type { Create${entityName}DTO, Update${entityName}DTO } from '../dtos'
import { ${entityName}ApiService } from '../../infrastructure/api/services/${entityName}ApiService'

export const use${entityName}Store = defineStore('${entityName.toLowerCase()}', () => {
  const ${entityName.toLowerCase()}s = ref<${entityName}[]>([])
  const current${entityName} = ref<${entityName} | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const apiService = new ${entityName}ApiService()

  const getAll = async (): Promise<${entityName}[]> => {
    loading.value = true
    error.value = null
    try {
      ${entityName.toLowerCase()}s.value = await apiService.getAll()
      return ${entityName.toLowerCase()}s.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const getById = async (id: string): Promise<${entityName}> => {
    loading.value = true
    error.value = null
    try {
      current${entityName}.value = await apiService.getById(id)
      return current${entityName}.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (data: Create${entityName}DTO): Promise<${entityName}> => {
    loading.value = true
    error.value = null
    try {
      const new${entityName} = await apiService.create(data)
      ${entityName.toLowerCase()}s.value.push(new${entityName})
      return new${entityName}
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const update = async (id: string, data: Update${entityName}DTO): Promise<${entityName}> => {
    loading.value = true
    error.value = null
    try {
      const updated${entityName} = await apiService.update(id, data)
      const index = ${entityName.toLowerCase()}s.value.findIndex(item => item.id === id)
      if (index !== -1) {
        ${entityName.toLowerCase()}s.value[index] = updated${entityName}
      }
      return updated${entityName}
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const remove = async (id: string): Promise<void> => {
    loading.value = true
    error.value = null
    try {
      await apiService.delete(id)
      ${entityName.toLowerCase()}s.value = ${entityName.toLowerCase()}s.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  const search = async (query: string): Promise<${entityName}[]> => {
    loading.value = true
    error.value = null
    try {
      const results = await apiService.search(query)
      return results
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Unknown error'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    ${entityName.toLowerCase()}s,
    current${entityName},
    loading,
    error,
    
    // Actions
    getAll,
    getById,
    create,
    update,
    remove,
    search
  }
})`
}

// Router Routes
const createRoutesTemplate = (moduleName, entities) => {
  const moduleNameLower = moduleName.toLowerCase()

  return `import type { RouteRecordRaw } from 'vue-router'

export const ${moduleNameLower}Routes: RouteRecordRaw[] = [
  {
    path: '/${moduleNameLower}',
    name: '${moduleName}',
    redirect: { name: '${moduleName}Dashboard' },
    children: [
      {
        path: 'dashboard',
        name: '${moduleName}Dashboard',
        component: () => import('../views/${moduleName}Dashboard.vue'),
        meta: {
          title: '${moduleName} Dashboard',
          requiresAuth: true
        }
      },
      ${entities.map(entityName => `
      // ${entityName} routes
      {
        path: '${entityName.toLowerCase()}',
        name: '${entityName}List',
        component: () => import('../views/${entityName}List.vue'),
        meta: {
          title: '${entityName} List',
          requiresAuth: true
        }
      },
      {
        path: '${entityName.toLowerCase()}/create',
        name: '${entityName}Create',
        component: () => import('../views/${entityName}Create.vue'),
        meta: {
          title: 'Create ${entityName}',
          requiresAuth: true
        }
      },
      {
        path: '${entityName.toLowerCase()}/:id',
        name: '${entityName}Detail',
        component: () => import('../views/${entityName}Detail.vue'),
        meta: {
          title: '${entityName} Detail',
          requiresAuth: true
        }
      },
      {
        path: '${entityName.toLowerCase()}/:id/edit',
        name: '${entityName}Edit',
        component: () => import('../views/${entityName}Edit.vue'),
        meta: {
          title: 'Edit ${entityName}',
          requiresAuth: true
        }
      }`).join(',')}
    ]
  }
]`
}

// Templates específicos para cada tipo de archivo DDD
const createEntityTemplate = (entityName, properties) => {
  const propsDefinition = Object.entries(properties)
    .map(([key, prop]) => {
      const optional = prop.required === false ? '?' : ''
      const type = getTypeScriptType(prop.type, prop.values)

      return `  ${key}${optional}: ${type}`
    }).join('\n')

  return `export interface ${entityName} {
${propsDefinition}
}

export class ${entityName}Entity implements ${entityName} {
${propsDefinition}

  constructor(data: Partial<${entityName}>) {
    Object.assign(this, data)
  }

  static create(data: Omit<${entityName}, 'id' | 'created_at' | 'updated_at'>): ${entityName}Entity {
    return new ${entityName}Entity({
      ...data,
      id: crypto.randomUUID(),
      created_at: new Date(),
      updated_at: new Date()
    })
  }
}`
}

const createEndpointsTemplate = entityName => {
  const entityLower = entityName.toLowerCase()

  return `export const ${entityName}Endpoints = {
  base: '/${entityLower}',
  list: '/${entityLower}',
  create: '/${entityLower}',
  get: (id: string) => \`/${entityLower}/\${id}\`,
  update: (id: string) => \`/${entityLower}/\${id}\`,
  delete: (id: string) => \`/${entityLower}/\${id}\`,
  search: '/${entityLower}/search',
  export: '/${entityLower}/export',
  import: '/${entityLower}/import'
} as const`
}

const createApiServiceTemplate = (entityName, moduleName) => {
  const entityLower = entityName.toLowerCase()

  return `import { ApiService } from '@/shared/infrastructure/http/ApiService'
import type { ${entityName} } from '../../domain/entities/${entityName}'
import type { Create${entityName}DTO, Update${entityName}DTO } from '../dtos'
import { ${entityName}Endpoints } from './${entityName}Endpoints'

export class ${entityName}ApiService extends ApiService {
  async getAll(): Promise<${entityName}[]> {
    return this.get(${entityName}Endpoints.list)
  }

  async getById(id: string): Promise<${entityName}> {
    return this.get(${entityName}Endpoints.get(id))
  }

  async create(data: Create${entityName}DTO): Promise<${entityName}> {
    return this.post(${entityName}Endpoints.create, data)
  }

  async update(id: string, data: Update${entityName}DTO): Promise<${entityName}> {
    return this.put(${entityName}Endpoints.update(id), data)
  }

  async delete(id: string): Promise<void> {
    return this.delete(${entityName}Endpoints.delete(id))
  }

  async search(query: string): Promise<${entityName}[]> {
    return this.get(\`\${${entityName}Endpoints.search}?q=\${encodeURIComponent(query)}\`)
  }

  async export(format: 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    return this.getBlob(\`\${${entityName}Endpoints.export}?format=\${format}\`)
  }
}`
}

const createMapperTemplate = (entityName, properties) => {
  const propsMapping = Object.keys(properties)
    .map(key => `      ${key}: apiData.${key}`)
    .join(',\n')

  return `import type { ${entityName} } from '../../domain/entities/${entityName}'

export interface ${entityName}ApiResponse {
  ${Object.entries(properties).map(([key, prop]) => {
    const optional = prop.required === false ? '?' : ''
    const type = getTypeScriptType(prop.type, prop.values)

    return `${key}${optional}: ${type}`
  }).join('\n  ')}
}

export class ${entityName}Mapper {
  static fromApi(apiData: ${entityName}ApiResponse): ${entityName} {
    return {
${propsMapping}
    }
  }

  static toApi(entity: ${entityName}): ${entityName}ApiResponse {
    return {
${propsMapping}
    }
  }

  static fromApiList(apiDataList: ${entityName}ApiResponse[]): ${entityName}[] {
    return apiDataList.map(this.fromApi)
  }
}`
}

const createDTOTemplate = (entityName, properties, type = 'Create') => {
  const requiredProps = Object.entries(properties)
    .filter(([key, prop]) => {
      if (type === 'Create')
        return prop.required !== false && !prop.generated && key !== 'id'

      return prop.required !== false && !prop.generated
    })
    .map(([key, prop]) => {
      const tsType = getTypeScriptType(prop.type, prop.values)

      return `  ${key}: ${tsType}`
    }).join('\n')

  const optionalProps = Object.entries(properties)
    .filter(([key, prop]) => {
      if (type === 'Create')
        return prop.required === false && !prop.generated && key !== 'id'

      return prop.required === false && !prop.generated
    })
    .map(([key, prop]) => {
      const tsType = getTypeScriptType(prop.type, prop.values)

      return `  ${key}?: ${tsType}`
    }).join('\n')

  const allProps = [requiredProps, optionalProps].filter(Boolean).join('\n')

  return `export interface ${type}${entityName}DTO {
${allProps}
}`
}

const createRepositoryTemplate = entityName => {
  return `import type { ${entityName} } from '../../domain/entities/${entityName}'
import type { Create${entityName}DTO, Update${entityName}DTO } from '../dtos'

export interface ${entityName}Repository {
  findAll(): Promise<${entityName}[]>
  findById(id: string): Promise<${entityName} | null>
  create(data: Create${entityName}DTO): Promise<${entityName}>
  update(id: string, data: Update${entityName}DTO): Promise<${entityName}>
  delete(id: string): Promise<void>
  search(query: string): Promise<${entityName}[]>
}`
}

const createRepositoryImplTemplate = entityName => {
  return `import type { ${entityName} } from '../../domain/entities/${entityName}'
import type { ${entityName}Repository } from '../../application/repositories/${entityName}Repository'
import type { Create${entityName}DTO, Update${entityName}DTO } from '../../application/dtos'
import { ${entityName}ApiService } from '../api/services/${entityName}ApiService'
import { ${entityName}Mapper } from '../../application/mappers/${entityName}Mapper'

export class ${entityName}RepositoryImpl implements ${entityName}Repository {
  constructor(private apiService: ${entityName}ApiService) {}

  async findAll(): Promise<${entityName}[]> {
    const apiData = await this.apiService.getAll()
    return ${entityName}Mapper.fromApiList(apiData)
  }

  async findById(id: string): Promise<${entityName} | null> {
    try {
      const apiData = await this.apiService.getById(id)
      return ${entityName}Mapper.fromApi(apiData)
    } catch {
      return null
    }
  }

  async create(data: Create${entityName}DTO): Promise<${entityName}> {
    const apiData = await this.apiService.create(data)
    return ${entityName}Mapper.fromApi(apiData)
  }

  async update(id: string, data: Update${entityName}DTO): Promise<${entityName}> {
    const apiData = await this.apiService.update(id, data)
    return ${entityName}Mapper.fromApi(apiData)
  }

  async delete(id: string): Promise<void> {
    await this.apiService.delete(id)
  }

  async search(query: string): Promise<${entityName}[]> {
    const apiData = await this.apiService.search(query)
    return ${entityName}Mapper.fromApiList(apiData)
  }
}`
}

function getTypeScriptType(type, values) {
  switch (type) {
    case 'uuid':
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'datetime':
      return 'Date'
    case 'json':
      return 'Record<string, any>'
    case 'enum':
      return values ? values.map(v => `'${v}'`).join(' | ') : 'string'
    default:
      return 'any'
  }
}

async function generateModuleFromSpec(specPath) {
  try {
    console.log(chalk.cyan.bold('🏗️  Module Generator from Spec'))
    console.log(chalk.gray('─'.repeat(50)))

    // Leer spec JSON
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'))

    console.log(chalk.blue(`📄 Spec loaded: ${spec.moduleName}`))

    // Generar estructura base
    const moduleName = normalizeModuleName(spec.moduleName)

    await generateModule(moduleName, ['crud', 'websocket', 'export'])

    const modulePath = path.join(MODULES_PATH, moduleName.moduleNameLower)

    // Limpiar archivos con variables sin reemplazar en el NOMBRE del archivo
    cleanTemplateFiles(modulePath)

    // Generar module.config.ts correcto
    console.log(chalk.yellow('🔧 Generating corrected module.config.ts...'))

    const moduleConfigContent = createModuleConfigTemplate(spec)

    await createFile(
      path.join(modulePath, 'module.config.ts'),
      moduleConfigContent,
    )

    // Generar index.ts correctamente desde el spec JSON
    console.log(chalk.yellow('🔧 Generating corrected index.ts...'))

    const indexContent = createIndexTemplate(spec)

    await createFile(
      path.join(modulePath, 'index.ts'),
      indexContent,
    )

    // Generar ARQUITECTURA DDD COMPLETA para cada entidad
    for (const [entityName, entityConfig] of Object.entries(spec.entities)) {
      console.log(chalk.yellow(`📦 Generating COMPLETE DDD for entity: ${entityName}`))

      // ==============================
      // DOMAIN LAYER
      // ==============================

      // 1. Entity
      const entityContent = createEntityTemplate(entityName, entityConfig.properties)

      await createFile(
        path.join(modulePath, 'domain', 'entities', `${entityName}.ts`),
        entityContent,
      )

      // 2. Value Objects (for specific properties)
      const stringProps = Object.entries(entityConfig.properties).filter(([key, prop]) =>
        prop.type === 'string' && key !== 'id' && !key.includes('_at'),
      )

      for (const [propName, prop] of stringProps.slice(0, 2)) { // Limit to 2 main properties
        const valueObjectContent = createValueObjectTemplate(entityName, propName, getTypeScriptType(prop.type, prop.values))

        await createFile(
          path.join(modulePath, 'domain', 'valueObjects', `${entityName}${propName.charAt(0).toUpperCase() + propName.slice(1)}.ts`),
          valueObjectContent,
        )
      }

      // 3. Domain Events
      const events = ['Created', 'Updated', 'Deleted']
      for (const eventType of events) {
        const eventContent = createDomainEventTemplate(entityName, eventType)

        await createFile(
          path.join(modulePath, 'domain', 'events', `${entityName}${eventType}.ts`),
          eventContent,
        )
      }

      // 4. Domain Exceptions
      const exceptions = ['NotFound', 'ValidationError']
      for (const exceptionType of exceptions) {
        const exceptionContent = createDomainExceptionTemplate(entityName, exceptionType)

        await createFile(
          path.join(modulePath, 'domain', 'exceptions', `${entityName}${exceptionType}.ts`),
          exceptionContent,
        )
      }

      // ==============================
      // APPLICATION LAYER
      // ==============================

      // 5. DTOs
      const createDTOContent = createDTOTemplate(entityName, entityConfig.properties, 'Create')
      const updateDTOContent = createDTOTemplate(entityName, entityConfig.properties, 'Update')

      await createFile(
        path.join(modulePath, 'application', 'dtos', `Create${entityName}DTO.ts`),
        createDTOContent,
      )
      await createFile(
        path.join(modulePath, 'application', 'dtos', `Update${entityName}DTO.ts`),
        updateDTOContent,
      )
      await createFile(
        path.join(modulePath, 'application', 'dtos', 'index.ts'),
        `export * from './Create${entityName}DTO'\nexport * from './Update${entityName}DTO'`,
      )

      // 6. Repository Interface
      const repositoryContent = createRepositoryTemplate(entityName)

      await createFile(
        path.join(modulePath, 'application', 'repositories', `${entityName}Repository.ts`),
        repositoryContent,
      )

      // 7. Use Cases
      const useCases = ['Create', 'Update', 'Delete', 'GetById', 'GetList']
      for (const action of useCases) {
        const useCaseContent = createUseCaseTemplate(entityName, action)

        await createFile(
          path.join(modulePath, 'application', 'useCases', `${action}${entityName}UseCase.ts`),
          useCaseContent,
        )
      }

      // 8. Commands & Queries
      const commands = ['Create', 'Update', 'Delete']
      for (const action of commands) {
        const commandContent = createCommandTemplate(entityName, action)

        await createFile(
          path.join(modulePath, 'application', 'commands', `${action}${entityName}Command.ts`),
          commandContent,
        )
      }

      const queries = ['ById', 'List']
      for (const action of queries) {
        const queryContent = createQueryTemplate(entityName, action)

        await createFile(
          path.join(modulePath, 'application', 'queries', `Get${entityName}${action}Query.ts`),
          queryContent,
        )
      }

      // 9. Handlers
      const commandHandlers = ['Create', 'Update', 'Delete']
      for (const action of commandHandlers) {
        const handlerContent = createHandlerTemplate(entityName, action, 'Command')

        await createFile(
          path.join(modulePath, 'application', 'handlers', `${action}${entityName}Handler.ts`),
          handlerContent,
        )
      }

      const queryHandlers = ['GetById', 'GetList']
      for (const action of queryHandlers) {
        const handlerContent = createHandlerTemplate(entityName, action, 'Query')

        await createFile(
          path.join(modulePath, 'application', 'handlers', `${action}${entityName}Handler.ts`),
          handlerContent,
        )
      }

      // 10. Mapper
      const mapperContent = createMapperTemplate(entityName, entityConfig.properties)

      await createFile(
        path.join(modulePath, 'application', 'mappers', `${entityName}Mapper.ts`),
        mapperContent,
      )

      // ==============================
      // INFRASTRUCTURE LAYER
      // ==============================

      // 11. Repository Implementation
      const repositoryImplContent = createRepositoryImplTemplate(entityName)

      await createFile(
        path.join(modulePath, 'infrastructure', 'persistence', 'repositories', `${entityName}RepositoryImpl.ts`),
        repositoryImplContent,
      )

      // 12. API Service
      const apiServiceContent = createApiServiceTemplate(entityName, spec.moduleName)

      await createFile(
        path.join(modulePath, 'infrastructure', 'api', 'services', `${entityName}ApiService.ts`),
        apiServiceContent,
      )

      // 13. Endpoints
      const endpointsContent = createEndpointsTemplate(entityName)

      await createFile(
        path.join(modulePath, 'infrastructure', 'api', 'services', `${entityName}Endpoints.ts`),
        endpointsContent,
      )

      // ==============================
      // PRESENTATION LAYER
      // ==============================

      // 14. Vue Components
      const componentTypes = ['List', 'Form', 'Detail', 'Create', 'Edit']
      for (const componentType of componentTypes) {
        const componentContent = createVueComponentTemplate(entityName, componentType)

        await createFile(
          path.join(modulePath, 'presentation', 'views', `${entityName}${componentType}.vue`),
          componentContent,
        )
      }

      // 15. Pinia Store
      const storeContent = createStoreTemplate(entityName)

      await createFile(
        path.join(modulePath, 'presentation', 'stores', `${entityName.toLowerCase()}Store.ts`),
        storeContent,
      )
    }

    // ==============================
    // MODULE-LEVEL FILES
    // ==============================

    // 16. Router Routes
    console.log(chalk.yellow('📦 Generating module routes...'))

    const entities = Object.keys(spec.entities)
    const routesContent = createRoutesTemplate(spec.moduleName, entities)

    await createFile(
      path.join(modulePath, 'presentation', 'router', 'routes.ts'),
      routesContent,
    )

    console.log(chalk.green.bold(`✅ Module ${spec.moduleName} generated successfully!`))
    console.log(chalk.gray(`📁 Location: ${modulePath}`))
    console.log(chalk.cyan('🏗️ COMPLETE DDD Architecture Generated:'))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length} Entities with full DDD layers`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 2} Value Objects`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 3} Domain Events`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 2} Domain Exceptions`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 5} Use Cases`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 3} Commands`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 2} Queries`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 5} Handlers`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length * 5} Vue Components`))
    console.log(chalk.white(`   • ${Object.keys(spec.entities).length} Pinia Stores`))
    console.log(chalk.white('   • 1 Complete Router Configuration'))
    console.log(chalk.white('   • API Services, DTOs, Mappers, Repositories'))
    console.log(chalk.green(`   📊 Total: ~${Object.keys(spec.entities).length * 25 + 70} files generated`))
  }
  catch (error) {
    console.error(chalk.red.bold('❌ Error generating module:'), error.message)
    process.exit(1)
  }
}

async function main() {
  const specPath = process.argv[2]

  if (!specPath) {
    console.error(chalk.red('❌ Please provide a spec file path'))
    console.log(chalk.yellow('Usage: node generateModuleFromSpec.mjs <spec-file.json>'))
    process.exit(1)
  }

  if (!fs.existsSync(specPath)) {
    console.error(chalk.red(`❌ Spec file not found: ${specPath}`))
    process.exit(1)
  }

  await generateModuleFromSpec(specPath)
}

main().catch(console.error)
