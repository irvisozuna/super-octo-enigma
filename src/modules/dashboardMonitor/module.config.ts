import type { ModuleConfig } from '@/types/module'

export const dashboardmonitorConfig: ModuleConfig = {
  name: 'DashboardMonitor',
  version: '1.0.0',
  description: 'Módulo DashboardMonitor - Personaliza esta descripción',
  author: 'Development Team',
  framework: 'vue',
  language: 'typescript',
  
  // Entities configuration
  entities: {
    'DashboardMonitorEntity': {
      name: 'DashboardMonitorEntity',
      table: 'dashboard_monitor',
      description: 'Entidad principal del módulo DashboardMonitor',
      fields: [
      "id",
      "name",
      "description",
      "status",
      "created_at",
      "updated_at"
]
    }
  },

  // Features
  features: {
    crud: true,
    websocket: false,
    export: true,
    import: true,
    audit: true,
    cache: true,
    tests: true,
    e2e: false,
    docs: true,
  },

  // UI Configuration
  ui: {
    theme: {
      primary: '#3B82F6',
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
    basePath: '/dashboardmonitor',
    routes: [
      { path: '', name: 'DashboardMonitorList', component: 'DashboardMonitorList' },
      { path: '/create', name: 'DashboardMonitorCreate', component: 'DashboardMonitorCreate' },
      { path: '/:id', name: 'DashboardMonitorDetail', component: 'DashboardMonitorDetail' },
      { path: '/:id/edit', name: 'DashboardMonitorEdit', component: 'DashboardMonitorEdit' }
    ],
  },

  // Permissions
  permissions: {
    casl: {
      enabled: true,
      subjects: ['DashboardMonitor'],
      actions: ['create', 'read', 'update', 'delete', 'export'],
      abilities: [],
      roles: ['admin', 'user', 'readonly'],
    },
    legacy: {},
  },

  // API Configuration
  api: {
    baseUrl: '/api/v1',
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
      content: [`src/modules/dashboardmonitor/**/*.{vue,ts,js}`]
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

export default dashboardmonitorConfig