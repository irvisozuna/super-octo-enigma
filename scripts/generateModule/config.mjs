// scripts/config.mjs
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración principal del generador DDD
export const CONFIG = {
  stubsPath: 'stubs',
  modulesPath: 'src/modules',
  docsPath: 'docs',
  testsPath: 'tests',

  // Configuración de características por defecto
  defaultFeatures: ['crud', 'websocket', 'cache', 'tests', 'docs'],

  // Configuración de la estructura DDD
  dddLayers: {
    domain: {
      description: 'Capa de dominio - Lógica de negocio pura',
      color: 'blue',
    },
    application: {
      description: 'Capa de aplicación - Casos de uso y coordinación',
      color: 'green',
    },
    infrastructure: {
      description: 'Capa de infraestructura - Implementaciones técnicas',
      color: 'yellow',
    },
    presentation: {
      description: 'Capa de presentación - UI y componentes Vue',
      color: 'magenta',
    },
    shared: {
      description: 'Recursos compartidos - Tipos, constantes, utilidades',
      color: 'cyan',
    },
  },

  // Plantillas de código por defecto
  codeTemplates: {
    vueVersion: '3',
    typeScriptStrict: true,
    useCompositionApi: true,
    storeLibrary: 'pinia',
    uiLibrary: 'vuetify',
    testingLibrary: 'vitest',
    e2eLibrary: 'cypress',
  },

  // Configuración de archivos
  fileExtensions: {
    vue: '.vue',
    typescript: '.ts',
    test: '.test.ts',
    spec: '.spec.ts',
    story: '.stories.ts',
  },

  // Configuración de naming conventions
  namingConventions: {
    components: 'PascalCase',
    composables: 'camelCase',
    stores: 'camelCase',
    types: 'PascalCase',
    interfaces: 'PascalCase',
    enums: 'PascalCase',
    constants: 'UPPER_SNAKE_CASE',
    files: {
      components: 'PascalCase',
      composables: 'camelCase',
      views: 'PascalCase',
      types: 'kebab-case',
      tests: 'kebab-case',
    },
  },

  // Configuración de importaciones
  importAliases: {
    '@': 'src',
    '@domain': 'src/modules/*/domain',
    '@application': 'src/modules/*/application',
    '@infrastructure': 'src/modules/*/infrastructure',
    '@presentation': 'src/modules/*/presentation',
    '@shared': 'src/shared',
    '@tests': 'tests',
  },

  // Configuración de linting y formato
  lintingRules: {
    eslint: true,
    prettier: true,
    stylelint: true,
    commitlint: true,
  },
}

// Estructura DDD completa del módulo
export const DDD_STRUCTURE = {
  domain: {
    entities: {
      description: 'Entidades del dominio y agregados',
      required: true,
    },
    valueObjects: {
      description: 'Objetos de valor inmutables',
      required: true,
    },
    aggregates: {
      description: 'Agregados que garantizan consistencia',
      required: false,
    },
    events: {
      description: 'Eventos del dominio',
      required: true,
    },
    exceptions: {
      description: 'Excepciones de negocio',
      required: true,
    },
    specifications: {
      description: 'Especificaciones de reglas de negocio',
      required: false,
    },
    contracts: {
      repositories: {
        description: 'Contratos de repositorios',
        required: true,
      },
      services: {
        description: 'Contratos de servicios del dominio',
        required: true,
      },
    },
  },

  application: {
    commands: {
      description: 'Comandos (CQRS)',
      required: true,
    },
    queries: {
      description: 'Consultas (CQRS)',
      required: true,
    },
    handlers: {
      description: 'Manejadores de comandos y consultas',
      required: true,
    },
    dtos: {
      description: 'Data Transfer Objects',
      required: true,
    },
    mappers: {
      description: 'Mapeadores entre capas',
      required: true,
    },
    services: {
      description: 'Servicios de aplicación',
      required: true,
    },
    useCases: {
      description: 'Casos de uso de la aplicación',
      required: true,
    },
    contracts: {
      description: 'Contratos de la capa de aplicación',
      required: false,
    },
  },

  infrastructure: {
    api: {
      services: {
        description: 'Servicios de API HTTP',
        required: true,
      },
      interceptors: {
        description: 'Interceptores HTTP',
        required: false,
      },
      transformers: {
        description: 'Transformadores de datos',
        required: true,
      },
    },
    persistence: {
      repositories: {
        description: 'Implementaciones de repositorios',
        required: true,
      },
      cache: {
        description: 'Servicios de caché',
        required: false,
      },
      indexedDb: {
        description: 'Persistencia local con IndexedDB',
        required: false,
      },
    },
    websocket: {
      handlers: {
        description: 'Manejadores de WebSocket',
        required: false,
      },
      events: {
        description: 'Eventos de WebSocket',
        required: false,
      },
    },
  },

  presentation: {
    views: {
      description: 'Vistas principales (páginas)',
      required: true,
    },
    components: {
      organisms: {
        description: 'Componentes complejos',
        required: true,
      },
      molecules: {
        description: 'Componentes medianos',
        required: true,
      },
      atoms: {
        description: 'Componentes básicos',
        required: true,
      },
    },
    composables: {
      description: 'Composables de Vue 3',
      required: true,
    },
    stores: {
      description: 'Stores de Pinia',
      required: true,
    },
    router: {
      description: 'Configuración de rutas',
      required: true,
    },
    layouts: {
      description: 'Layouts de páginas',
      required: false,
    },
  },

  shared: {
    types: {
      description: 'Tipos TypeScript compartidos',
      required: true,
    },
    constants: {
      description: 'Constantes del módulo',
      required: true,
    },
    utils: {
      description: 'Utilidades y helpers',
      required: true,
    },
    validators: {
      description: 'Esquemas de validación',
      required: true,
    },
    locales: {
      description: 'Archivos de traducción',
      required: true,
      subfolders: ['es', 'en'],
    },
  },

  // Archivos de configuración del módulo
  config: {
    container: {
      description: 'Contenedor de dependencias (Inversify)',
      required: true,
    },
    types: {
      description: 'Tipos para inyección de dependencias',
      required: true,
    },
    index: {
      description: 'Archivo principal de exportaciones',
      required: true,
    },
    moduleConfig: {
      description: 'Configuración del módulo',
      required: true,
    },
    menu: {
      description: 'Configuración del menú',
      required: true,
    },
    readme: {
      description: 'Documentación del módulo',
      required: true,
    },
  },

  tests: {
    unit: {
      domain: {
        description: 'Tests unitarios del dominio',
        required: true,
      },
      application: {
        description: 'Tests unitarios de aplicación',
        required: true,
      },
      infrastructure: {
        description: 'Tests unitarios de infraestructura',
        required: false,
      },
      presentation: {
        description: 'Tests unitarios de presentación',
        required: true,
      },
    },
    integration: {
      description: 'Tests de integración',
      required: false,
    },
    e2e: {
      description: 'Tests end-to-end',
      required: false,
    },
  },
}

// Rutas absolutas
export const STUBS_PATH = path.resolve(__dirname, '..', '..', CONFIG.stubsPath)
export const MODULES_PATH = path.resolve(__dirname, '..', '..', CONFIG.modulesPath)
export const DOCS_PATH = path.resolve(__dirname, '..', '..', CONFIG.docsPath)
export const TESTS_PATH = path.resolve(__dirname, '..', '..', CONFIG.testsPath)

// Validación de configuración
export function validateConfig() {
  const requiredPaths = [STUBS_PATH]
  const errors = []

  requiredPaths.forEach(p => {
    if (!fs.existsSync(p))
      errors.push(`Path no encontrado: ${p}`)
  })

  if (errors.length > 0)
    throw new Error(`Errores de configuración:\n${errors.join('\n')}`)
}

// Exportar configuración de TypeScript para los módulos
export const TS_CONFIG = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    skipLibCheck: true,

    // Module Resolution
    moduleResolution: 'node',
    allowImportingTsExtensions: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: true,

    // Type Checking
    strict: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noFallthroughCasesInSwitch: true,

    // Vue
    jsx: 'preserve',

    // Paths
    baseUrl: '.',
    paths: CONFIG.importAliases,
  },
}

// Configuración de Prettier
export const PRETTIER_CONFIG = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  arrowParens: 'avoid',
  endOfLine: 'lf',
  vueIndentScriptAndStyle: false,
}

// Configuración de ESLint
export const ESLINT_CONFIG = {
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
}
