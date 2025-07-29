#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const MODULES_PATH = 'src/modules'

// ===============================================
// 1. ACL (ACCESS CONTROL LIST) ARCHITECTURE
// ===============================================

// Permission System Contract
const createPermissionSystemContract = () => {
  return `/**
 * Advanced ACL Permission System
 * Implements RBAC (Role-Based) + PBAC (Policy-Based) Access Control
 */

export interface IPermissionService {
  // Role-Based Access Control
  hasRole(userId: string, role: string): Promise<boolean>
  assignRole(userId: string, role: string): Promise<void>
  revokeRole(userId: string, role: string): Promise<void>
  getUserRoles(userId: string): Promise<string[]>
  
  // Permission-Based Access Control
  hasPermission(userId: string, permission: string, resource?: string): Promise<boolean>
  grantPermission(userId: string, permission: string, resource?: string): Promise<void>
  revokePermission(userId: string, permission: string, resource?: string): Promise<void>
  
  // Policy-Based Access Control
  evaluatePolicy(userId: string, action: string, resource: any, context?: any): Promise<boolean>
  registerPolicy(name: string, policy: IPolicy): void
  
  // Resource-Based Access Control
  canAccess(userId: string, resourceType: string, resourceId: string, action: string): Promise<boolean>
  
  // Context-Aware Permissions
  hasContextualPermission(userId: string, permission: string, context: PermissionContext): Promise<boolean>
}

export interface IPolicy {
  name: string
  description: string
  evaluate(user: User, action: string, resource: any, context?: any): Promise<boolean>
}

export interface PermissionContext {
  module: string
  entity: string
  entityId?: string
  action: string
  timestamp: Date
  clientInfo?: {
    ip: string
    userAgent: string
    location?: string
  }
}

// Permissions for Dashboard Monitor
export const DASHBOARD_PERMISSIONS = {
  // Reader permissions
  READER_VIEW: 'dashboard.reader.view',
  READER_CREATE: 'dashboard.reader.create',
  READER_EDIT: 'dashboard.reader.edit',
  READER_DELETE: 'dashboard.reader.delete',
  READER_ASSIGN_ROUTES: 'dashboard.reader.assign_routes',
  
  // Route permissions
  ROUTE_VIEW: 'dashboard.route.view',
  ROUTE_CREATE: 'dashboard.route.create',
  ROUTE_EDIT: 'dashboard.route.edit',
  ROUTE_DELETE: 'dashboard.route.delete',
  ROUTE_ASSIGN_READERS: 'dashboard.route.assign_readers',
  
  // Reading permissions
  READING_VIEW: 'dashboard.reading.view',
  READING_CREATE: 'dashboard.reading.create',
  READING_EDIT: 'dashboard.reading.edit',
  READING_DELETE: 'dashboard.reading.delete',
  READING_VERIFY: 'dashboard.reading.verify',
  READING_APPROVE: 'dashboard.reading.approve',
  
  // Meter permissions
  METER_VIEW: 'dashboard.meter.view',
  METER_CREATE: 'dashboard.meter.create',
  METER_EDIT: 'dashboard.meter.edit',
  METER_DELETE: 'dashboard.meter.delete',
  METER_MAINTENANCE: 'dashboard.meter.maintenance',
  
  // Dashboard permissions
  DASHBOARD_VIEW_ANALYTICS: 'dashboard.analytics.view',
  DASHBOARD_EXPORT_DATA: 'dashboard.export.data',
  DASHBOARD_ADMIN: 'dashboard.admin'
} as const

export const DASHBOARD_ROLES = {
  SUPER_ADMIN: 'dashboard.super_admin',
  ADMIN: 'dashboard.admin',
  SUPERVISOR: 'dashboard.supervisor',
  READER_MANAGER: 'dashboard.reader_manager',
  READER: 'dashboard.reader',
  VIEWER: 'dashboard.viewer'
} as const`
}

// Permission Guard for Vue Routes
const createPermissionGuard = () => {
  return `import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore } from '../stores/permissionStore'
import { DASHBOARD_PERMISSIONS } from '../shared/constants/permissions'

/**
 * Permission Guard for Routes
 * Validates user permissions before allowing route access
 */
export async function permissionGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore()
  const permissionStore = usePermissionStore()
  
  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Get required permission from route meta
  const requiredPermission = to.meta.permission as string
  const requiredRole = to.meta.role as string
  
  if (!requiredPermission && !requiredRole) {
    next()
    return
  }
  
  try {
    // Check role-based access
    if (requiredRole && !await permissionStore.hasRole(authStore.user.id, requiredRole)) {
      next('/forbidden')
      return
    }
    
    // Check permission-based access
    if (requiredPermission) {
      const context = {
        module: 'dashboard',
        entity: to.params.entity as string,
        entityId: to.params.id as string,
        action: getActionFromRoute(to),
        timestamp: new Date()
      }
      
      const hasPermission = await permissionStore.hasContextualPermission(
        authStore.user.id,
        requiredPermission,
        context
      )
      
      if (!hasPermission) {
        next('/forbidden')
        return
      }
    }
    
    next()
  } catch (error) {
    console.error('Permission guard error:', error)
    next('/error')
  }
}

function getActionFromRoute(route: RouteLocationNormalized): string {
  const routeName = route.name as string
  
  if (routeName.includes('List')) return 'view'
  if (routeName.includes('Create')) return 'create'
  if (routeName.includes('Edit')) return 'edit'
  if (routeName.includes('Detail')) return 'view'
  
  return 'view'
}`
}

// Permission Store (Pinia)
const createPermissionStore = () => {
  return `import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { IPermissionService, PermissionContext } from '../application/contracts/IPermissionService'
import { PermissionService } from '../infrastructure/services/PermissionService'

export const usePermissionStore = defineStore('permission', () => {
  const permissionService: IPermissionService = new PermissionService()
  
  const userRoles = ref<string[]>([])
  const userPermissions = ref<string[]>([])
  const loading = ref(false)
  
  // Computed permissions
  const isAdmin = computed(() => 
    userRoles.value.includes('dashboard.admin') || 
    userRoles.value.includes('dashboard.super_admin')
  )
  
  const isSupervisor = computed(() => 
    userRoles.value.includes('dashboard.supervisor')
  )
  
  const isReader = computed(() => 
    userRoles.value.includes('dashboard.reader')
  )
  
  // Actions
  const loadUserPermissions = async (userId: string) => {
    loading.value = true
    try {
      userRoles.value = await permissionService.getUserRoles(userId)
      // Load specific permissions if needed
    } finally {
      loading.value = false
    }
  }
  
  const hasRole = async (userId: string, role: string): Promise<boolean> => {
    return await permissionService.hasRole(userId, role)
  }
  
  const hasPermission = async (userId: string, permission: string, resource?: string): Promise<boolean> => {
    return await permissionService.hasPermission(userId, permission, resource)
  }
  
  const hasContextualPermission = async (
    userId: string, 
    permission: string, 
    context: PermissionContext
  ): Promise<boolean> => {
    return await permissionService.hasContextualPermission(userId, permission, context)
  }
  
  const canAccess = async (
    userId: string, 
    resourceType: string, 
    resourceId: string, 
    action: string
  ): Promise<boolean> => {
    return await permissionService.canAccess(userId, resourceType, resourceId, action)
  }
  
  return {
    // State
    userRoles,
    userPermissions,
    loading,
    
    // Computed
    isAdmin,
    isSupervisor,
    isReader,
    
    // Actions
    loadUserPermissions,
    hasRole,
    hasPermission,
    hasContextualPermission,
    canAccess
  }
})`
}

// ===============================================
// 2. i18N MODULAR ARCHITECTURE
// ===============================================

// i18n Configuration
const createI18nConfig = (moduleName) => {
  return `import { createI18n } from 'vue-i18n'
import { nextTick } from 'vue'

// Supported locales for ${moduleName}
export const SUPPORTED_LOCALES = ['es', 'en', 'fr', 'pt'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'es'

// Locale configuration
export interface LocaleConfig {
  name: string
  code: SupportedLocale
  flag: string
  dir: 'ltr' | 'rtl'
  dateFormat: string
  timeFormat: string
  numberFormat: Intl.NumberFormatOptions
}

export const LOCALE_CONFIGS: Record<SupportedLocale, LocaleConfig> = {
  es: {
    name: 'Español',
    code: 'es',
    flag: '🇪🇸',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  en: {
    name: 'English',
    code: 'en',
    flag: '🇺🇸',
    dir: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'hh:mm A',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  fr: {
    name: 'Français',
    code: 'fr',
    flag: '🇫🇷',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  pt: {
    name: 'Português',
    code: 'pt',
    flag: '🇧🇷',
    dir: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  }
}

// Dynamic locale loading
const loadedLanguages: SupportedLocale[] = []

async function loadLocaleMessages(locale: SupportedLocale) {
  if (loadedLanguages.includes(locale)) {
    return
  }

  try {
    // Load module-specific translations
    const messages = await import(\`../locales/\${locale}.json\`)
    i18n.global.setLocaleMessage(locale, messages.default)
    loadedLanguages.push(locale)
  } catch (error) {
    console.warn(\`Failed to load locale \${locale}:\`, error)
  }
}

// Create i18n instance
export const i18n = createI18n({
  legacy: false,
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'en',
  globalInjection: true,
  messages: {}
})

// Locale management
export async function setLocale(locale: SupportedLocale) {
  await loadLocaleMessages(locale)
  i18n.global.locale.value = locale
  
  // Update document direction
  const config = LOCALE_CONFIGS[locale]
  document.documentElement.dir = config.dir
  document.documentElement.lang = locale
  
  // Store preference
  localStorage.setItem('${moduleName.toLowerCase()}-locale', locale)
  
  await nextTick()
}

// Get user's preferred locale
export function getUserPreferredLocale(): SupportedLocale {
  const stored = localStorage.getItem('${moduleName.toLowerCase()}-locale') as SupportedLocale
  if (stored && SUPPORTED_LOCALES.includes(stored)) {
    return stored
  }
  
  const browser = navigator.language.split('-')[0] as SupportedLocale
  if (SUPPORTED_LOCALES.includes(browser)) {
    return browser
  }
  
  return DEFAULT_LOCALE
}

// Initialize i18n
export async function initializeI18n() {
  const locale = getUserPreferredLocale()
  await setLocale(locale)
  return i18n
}`
}

// Translation Files Template
const createTranslationFile = (moduleName, locale, entities) => {
  const translations = {
    common: {
      loading: locale === 'es' ? 'Cargando...' : locale === 'en' ? 'Loading...' : locale === 'fr' ? 'Chargement...' : 'Carregando...',
      save: locale === 'es' ? 'Guardar' : locale === 'en' ? 'Save' : locale === 'fr' ? 'Enregistrer' : 'Salvar',
      cancel: locale === 'es' ? 'Cancelar' : locale === 'en' ? 'Cancel' : locale === 'fr' ? 'Annuler' : 'Cancelar',
      delete: locale === 'es' ? 'Eliminar' : locale === 'en' ? 'Delete' : locale === 'fr' ? 'Supprimer' : 'Deletar',
      edit: locale === 'es' ? 'Editar' : locale === 'en' ? 'Edit' : locale === 'fr' ? 'Modifier' : 'Editar',
      view: locale === 'es' ? 'Ver' : locale === 'en' ? 'View' : locale === 'fr' ? 'Voir' : 'Ver',
      create: locale === 'es' ? 'Crear' : locale === 'en' ? 'Create' : locale === 'fr' ? 'Créer' : 'Criar',
      search: locale === 'es' ? 'Buscar' : locale === 'en' ? 'Search' : locale === 'fr' ? 'Chercher' : 'Buscar',
      filter: locale === 'es' ? 'Filtrar' : locale === 'en' ? 'Filter' : locale === 'fr' ? 'Filtrer' : 'Filtrar',
      export: locale === 'es' ? 'Exportar' : locale === 'en' ? 'Export' : locale === 'fr' ? 'Exporter' : 'Exportar',
      success: locale === 'es' ? 'Éxito' : locale === 'en' ? 'Success' : locale === 'fr' ? 'Succès' : 'Sucesso',
      error: locale === 'es' ? 'Error' : locale === 'en' ? 'Error' : locale === 'fr' ? 'Erreur' : 'Erro',
      warning: locale === 'es' ? 'Advertencia' : locale === 'en' ? 'Warning' : locale === 'fr' ? 'Avertissement' : 'Aviso',
      info: locale === 'es' ? 'Información' : locale === 'en' ? 'Information' : locale === 'fr' ? 'Information' : 'Informação'
    },
    navigation: {
      dashboard: locale === 'es' ? 'Panel de Control' : locale === 'en' ? 'Dashboard' : locale === 'fr' ? 'Tableau de bord' : 'Painel',
      settings: locale === 'es' ? 'Configuración' : locale === 'en' ? 'Settings' : locale === 'fr' ? 'Paramètres' : 'Configurações',
      profile: locale === 'es' ? 'Perfil' : locale === 'en' ? 'Profile' : locale === 'fr' ? 'Profil' : 'Perfil',
      logout: locale === 'es' ? 'Cerrar Sesión' : locale === 'en' ? 'Logout' : locale === 'fr' ? 'Déconnexion' : 'Sair'
    },
    permissions: {
      accessDenied: locale === 'es' ? 'Acceso Denegado' : locale === 'en' ? 'Access Denied' : locale === 'fr' ? 'Accès Refusé' : 'Acesso Negado',
      insufficientPermissions: locale === 'es' ? 'Permisos Insuficientes' : locale === 'en' ? 'Insufficient Permissions' : locale === 'fr' ? 'Permissions Insuffisantes' : 'Permissões Insuficientes',
      contactAdmin: locale === 'es' ? 'Contacte al Administrador' : locale === 'en' ? 'Contact Administrator' : locale === 'fr' ? 'Contacter l\'Administrateur' : 'Contate o Administrador'
    }
  }

  // Add entity-specific translations
  entities.forEach(entity => {
    const entityLower = entity.toLowerCase()
    const entityTranslation = {
      [entityLower]: {
        title: locale === 'es' ? entity : locale === 'en' ? entity : locale === 'fr' ? entity : entity,
        list: locale === 'es' ? `Lista de ${entity}s` : locale === 'en' ? `${entity} List` : locale === 'fr' ? `Liste des ${entity}s` : `Lista de ${entity}s`,
        create: locale === 'es' ? `Crear ${entity}` : locale === 'en' ? `Create ${entity}` : locale === 'fr' ? `Créer ${entity}` : `Criar ${entity}`,
        edit: locale === 'es' ? `Editar ${entity}` : locale === 'en' ? `Edit ${entity}` : locale === 'fr' ? `Modifier ${entity}` : `Editar ${entity}`,
        detail: locale === 'es' ? `Detalle de ${entity}` : locale === 'en' ? `${entity} Detail` : locale === 'fr' ? `Détail du ${entity}` : `Detalhe do ${entity}`,
        delete: locale === 'es' ? `Eliminar ${entity}` : locale === 'en' ? `Delete ${entity}` : locale === 'fr' ? `Supprimer ${entity}` : `Deletar ${entity}`,
        deleteConfirm: locale === 'es' ? `¿Está seguro de eliminar este ${entity}?` : locale === 'en' ? `Are you sure you want to delete this ${entity}?` : locale === 'fr' ? `Êtes-vous sûr de vouloir supprimer ce ${entity}?` : `Tem certeza de que deseja deletar este ${entity}?`,
        notFound: locale === 'es' ? `${entity} no encontrado` : locale === 'en' ? `${entity} not found` : locale === 'fr' ? `${entity} non trouvé` : `${entity} não encontrado`,
        createSuccess: locale === 'es' ? `${entity} creado exitosamente` : locale === 'en' ? `${entity} created successfully` : locale === 'fr' ? `${entity} créé avec succès` : `${entity} criado com sucesso`,
        updateSuccess: locale === 'es' ? `${entity} actualizado exitosamente` : locale === 'en' ? `${entity} updated successfully` : locale === 'fr' ? `${entity} mis à jour avec succès` : `${entity} atualizado com sucesso`,
        deleteSuccess: locale === 'es' ? `${entity} eliminado exitosamente` : locale === 'en' ? `${entity} deleted successfully` : locale === 'fr' ? `${entity} supprimé avec succès` : `${entity} deletado com sucesso`
      }
    }
    Object.assign(translations, entityTranslation)
  })

  return JSON.stringify(translations, null, 2)
}

// ===============================================
// 3. ATOMIC DESIGN ARCHITECTURE
// ===============================================

// Base Atom Component
const createBaseAtom = (atomName) => {
  return `<template>
  <component
    :is="tag"
    :class="atomClasses"
    v-bind="$attrs"
    @click="handleClick"
  >
    <slot></slot>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  tag?: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  click: [event: Event]
}>()

const atomClasses = computed(() => {
  return [
    '${atomName.toLowerCase()}',
    \`${atomName.toLowerCase()}--\${props.variant}\`,
    \`${atomName.toLowerCase()}--\${props.size}\`,
    {
      '${atomName.toLowerCase()}--disabled': props.disabled,
      '${atomName.toLowerCase()}--loading': props.loading
    }
  ]
})

const handleClick = (event: Event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.${atomName.toLowerCase()} {
  @apply inline-flex items-center justify-center;
  transition: all 0.2s ease-in-out;
}

.${atomName.toLowerCase()}--primary {
  @apply bg-blue-500 text-white hover:bg-blue-600;
}

.${atomName.toLowerCase()}--secondary {
  @apply bg-gray-500 text-white hover:bg-gray-600;
}

.${atomName.toLowerCase()}--success {
  @apply bg-green-500 text-white hover:bg-green-600;
}

.${atomName.toLowerCase()}--warning {
  @apply bg-yellow-500 text-white hover:bg-yellow-600;
}

.${atomName.toLowerCase()}--error {
  @apply bg-red-500 text-white hover:bg-red-600;
}

.${atomName.toLowerCase()}--info {
  @apply bg-blue-400 text-white hover:bg-blue-500;
}

.${atomName.toLowerCase()}--xs {
  @apply text-xs px-2 py-1;
}

.${atomName.toLowerCase()}--sm {
  @apply text-sm px-3 py-1.5;
}

.${atomName.toLowerCase()}--md {
  @apply text-base px-4 py-2;
}

.${atomName.toLowerCase()}--lg {
  @apply text-lg px-6 py-3;
}

.${atomName.toLowerCase()}--xl {
  @apply text-xl px-8 py-4;
}

.${atomName.toLowerCase()}--disabled {
  @apply opacity-50 cursor-not-allowed;
}

.${atomName.toLowerCase()}--loading {
  @apply cursor-wait;
}
</style>`
}

// Base Molecule Component
const createBaseMolecule = (moleculeName, atoms) => {
  return `<template>
  <div class="${moleculeName.toLowerCase()}">
    <slot name="header">
      <div class="${moleculeName.toLowerCase()}__header">
        <slot name="title">
          <h3 class="${moleculeName.toLowerCase()}__title">{{ title }}</h3>
        </slot>
        <slot name="actions"></slot>
      </div>
    </slot>
    
    <div class="${moleculeName.toLowerCase()}__content">
      <slot></slot>
    </div>
    
    <slot name="footer">
      <div v-if="$slots.footer" class="${moleculeName.toLowerCase()}__footer">
        <slot name="footer-content"></slot>
      </div>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
${atoms.map(atom => `import ${atom} from '../atoms/${atom}.vue'`).join('\n')}

interface Props {
  title?: string
  variant?: 'default' | 'card' | 'bordered' | 'elevated'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md'
})

const moleculeClasses = computed(() => {
  return [
    '${moleculeName.toLowerCase()}',
    \`${moleculeName.toLowerCase()}--\${props.variant}\`,
    \`${moleculeName.toLowerCase()}--\${props.size}\`
  ]
})
</script>

<style scoped>
.${moleculeName.toLowerCase()} {
  @apply w-full;
}

.${moleculeName.toLowerCase()}--default {
  @apply bg-white;
}

.${moleculeName.toLowerCase()}--card {
  @apply bg-white rounded-lg shadow-sm border;
}

.${moleculeName.toLowerCase()}--bordered {
  @apply border border-gray-200;
}

.${moleculeName.toLowerCase()}--elevated {
  @apply bg-white rounded-lg shadow-lg;
}

.${moleculeName.toLowerCase()}__header {
  @apply flex items-center justify-between mb-4;
}

.${moleculeName.toLowerCase()}__title {
  @apply text-lg font-semibold text-gray-900;
}

.${moleculeName.toLowerCase()}__content {
  @apply flex-1;
}

.${moleculeName.toLowerCase()}__footer {
  @apply mt-4 pt-4 border-t border-gray-200;
}

.${moleculeName.toLowerCase()}--sm .${moleculeName.toLowerCase()}__title {
  @apply text-base;
}

.${moleculeName.toLowerCase()}--lg .${moleculeName.toLowerCase()}__title {
  @apply text-xl;
}
</style>`
}

// Base Organism Component
const createBaseOrganism = (organismName, molecules) => {
  return `<template>
  <div class="${organismName.toLowerCase()}" :class="organismClasses">
    <slot name="header">
      <header v-if="title || $slots.actions" class="${organismName.toLowerCase()}__header">
        <div class="${organismName.toLowerCase()}__header-content">
          <slot name="title">
            <h2 v-if="title" class="${organismName.toLowerCase()}__title">{{ title }}</h2>
          </slot>
          <slot name="subtitle">
            <p v-if="subtitle" class="${organismName.toLowerCase()}__subtitle">{{ subtitle }}</p>
          </slot>
        </div>
        <div class="${organismName.toLowerCase()}__actions">
          <slot name="actions"></slot>
        </div>
      </header>
    </slot>
    
    <slot name="filters">
      <div v-if="$slots.filters" class="${organismName.toLowerCase()}__filters">
        <slot name="filters-content"></slot>
      </div>
    </slot>
    
    <main class="${organismName.toLowerCase()}__main">
      <slot></slot>
    </main>
    
    <slot name="footer">
      <footer v-if="$slots.footer" class="${organismName.toLowerCase()}__footer">
        <slot name="footer-content"></slot>
      </footer>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
${molecules.map(molecule => `import ${molecule} from '../molecules/${molecule}.vue'`).join('\n')}

interface Props {
  title?: string
  subtitle?: string
  layout?: 'default' | 'sidebar' | 'fullwidth' | 'contained'
  spacing?: 'tight' | 'normal' | 'loose'
  background?: 'white' | 'gray' | 'transparent'
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'default',
  spacing: 'normal',
  background: 'white'
})

const organismClasses = computed(() => {
  return [
    '${organismName.toLowerCase()}',
    \`${organismName.toLowerCase()}--\${props.layout}\`,
    \`${organismName.toLowerCase()}--\${props.spacing}\`,
    \`${organismName.toLowerCase()}--\${props.background}\`
  ]
})
</script>

<style scoped>
.${organismName.toLowerCase()} {
  @apply w-full min-h-full;
}

.${organismName.toLowerCase()}--default {
  @apply flex flex-col;
}

.${organismName.toLowerCase()}--sidebar {
  @apply grid grid-cols-12 gap-6;
}

.${organismName.toLowerCase()}--fullwidth {
  @apply w-full max-w-none;
}

.${organismName.toLowerCase()}--contained {
  @apply max-w-7xl mx-auto;
}

.${organismName.toLowerCase()}--tight {
  @apply space-y-2;
}

.${organismName.toLowerCase()}--normal {
  @apply space-y-4;
}

.${organismName.toLowerCase()}--loose {
  @apply space-y-8;
}

.${organismName.toLowerCase()}--white {
  @apply bg-white;
}

.${organismName.toLowerCase()}--gray {
  @apply bg-gray-50;
}

.${organismName.toLowerCase()}--transparent {
  @apply bg-transparent;
}

.${organismName.toLowerCase()}__header {
  @apply flex items-start justify-between py-4 border-b border-gray-200;
}

.${organismName.toLowerCase()}__header-content {
  @apply flex-1;
}

.${organismName.toLowerCase()}__title {
  @apply text-2xl font-bold text-gray-900;
}

.${organismName.toLowerCase()}__subtitle {
  @apply mt-1 text-sm text-gray-600;
}

.${organismName.toLowerCase()}__actions {
  @apply flex items-center space-x-3;
}

.${organismName.toLowerCase()}__filters {
  @apply py-4 border-b border-gray-200;
}

.${organismName.toLowerCase()}__main {
  @apply flex-1 py-6;
}

.${organismName.toLowerCase()}__footer {
  @apply py-4 border-t border-gray-200;
}
</style>`
}

// ===============================================
// MAIN GENERATOR FUNCTION
// ===============================================

async function createFile(filePath, content) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, content, 'utf8')
}

export async function generateAdvancedArchitecture(moduleName, entities) {
  const modulePath = path.join(MODULES_PATH, moduleName.toLowerCase())
  
  console.log(chalk.blue(`🚀 Generating Advanced Enterprise Architecture for: ${moduleName}`))
  console.log(chalk.gray(`📁 Path: ${modulePath}\n`))
  
  let filesCreated = 0
  
  // 1. ACL Permission System
  console.log(chalk.yellow('🔐 Generating ACL Permission System...'))
  
  // Permission contracts
  await createFile(
    path.join(modulePath, 'application', 'contracts', 'IPermissionService.ts'),
    createPermissionSystemContract()
  )
  
  // Permission guard
  await createFile(
    path.join(modulePath, 'presentation', 'guards', 'permissionGuard.ts'),
    createPermissionGuard()
  )
  
  // Permission store
  await createFile(
    path.join(modulePath, 'presentation', 'stores', 'permissionStore.ts'),
    createPermissionStore()
  )
  
  filesCreated += 3
  
  // 2. i18n System
  console.log(chalk.yellow('🌍 Generating i18n Modular System...'))
  
  // i18n configuration
  await createFile(
    path.join(modulePath, 'shared', 'i18n', 'config.ts'),
    createI18nConfig(moduleName)
  )
  
  // Translation files
  const locales = ['es', 'en', 'fr', 'pt']
  for (const locale of locales) {
    await createFile(
      path.join(modulePath, 'shared', 'locales', `${locale}.json`),
      createTranslationFile(moduleName, locale, entities)
    )
  }
  
  filesCreated += 5
  
  // 3. Atomic Design Components
  console.log(chalk.yellow('🧬 Generating Atomic Design Components...'))
  
  // Atoms
  const atoms = ['Button', 'Input', 'Badge', 'Icon', 'Avatar', 'Spinner']
  for (const atom of atoms) {
    await createFile(
      path.join(modulePath, 'presentation', 'components', 'atoms', `${atom}.vue`),
      createBaseAtom(atom)
    )
  }
  
  // Molecules
  const molecules = ['FormField', 'SearchBox', 'ActionBar', 'StatusCard']
  for (const molecule of molecules) {
    await createFile(
      path.join(modulePath, 'presentation', 'components', 'molecules', `${molecule}.vue`),
      createBaseMolecule(molecule, atoms.slice(0, 3))
    )
  }
  
  // Organisms
  const organisms = ['DataTable', 'FormContainer', 'DashboardLayout', 'FilterPanel']
  for (const organism of organisms) {
    await createFile(
      path.join(modulePath, 'presentation', 'components', 'organisms', `${organism}.vue`),
      createBaseOrganism(organism, molecules.slice(0, 2))
    )
  }
  
  filesCreated += atoms.length + molecules.length + organisms.length
  
  console.log(chalk.green.bold(`\n✅ Advanced Architecture Generation Completed!`))
  console.log(chalk.cyan(`🚀 Total files created: ${filesCreated}`))
  console.log(chalk.white(`   • 🔐 ACL Permission System (3 files)`))
  console.log(chalk.white(`   • 🌍 i18n Modular System (5 files)`))
  console.log(chalk.white(`   • 🧬 Atomic Design Components (${atoms.length + molecules.length + organisms.length} files)`))
  
  return filesCreated
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const moduleName = process.argv[2] || 'DashboardMonitor'
  const entities = ['Reader', 'Route', 'Reading', 'Meter']
  
  generateAdvancedArchitecture(moduleName, entities)
    .then(count => {
      console.log(chalk.green.bold(`\n🎉 Successfully generated ${count} advanced architecture files!`))
      process.exit(0)
    })
    .catch(error => {
      console.error(chalk.red(`Fatal error: ${error.message}`))
      process.exit(1)
    })
} 
