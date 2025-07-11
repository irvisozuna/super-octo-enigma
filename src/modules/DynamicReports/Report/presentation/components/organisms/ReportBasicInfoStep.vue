<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ReportMenuConfig from '../molecules/ReportMenuConfig.vue'

interface ReportCategory {
  id: string
  name: string
  icon: string
  color: string
  description: string
}

interface ReportTag {
  id: string
  name: string
  color: string
  icon?: string
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions?: string[]
}

interface Department {
  id: string
  name: string
  icon: string
  color: string
}

interface MenuConfig {
  show_in_menu: boolean
  menu_title?: string
  menu_icon?: string
  menu_category?: string
  menu_order?: number
  menu_permissions?: {
    action: string
    subject: string
  }
  menu_badge?: {
    content: string
    class: string
  }
}

interface BasicInfo {

  // Información básica
  name: string
  description: string
  dataSourceId: string
  isActive: boolean
  isPublic: boolean

  // Clasificación
  categoryId?: string
  tags?: string[]
  priority?: 'low' | 'medium' | 'high'
  departmentId?: string

  // Permisos
  permissions?: {
    type: 'public' | 'private' | 'custom'
    users?: string[]
    roles?: string[]
    departments?: string[]
    allowGuests?: boolean
    requireAuth?: boolean
    inheritFromCategory?: boolean
  }

  // Configuración de menú
  menu_config?: MenuConfig

  // Rendimiento
  performance?: {
    refreshInterval?: number
    autoRefresh?: boolean
    cacheEnabled?: boolean
    cacheTtl?: number
    maxExecutionTime?: number
    maxRows?: number
    timeout?: number
  }

  // Notificaciones
  notifications?: {
    enabled?: boolean
    onError?: boolean
    onSuccess?: boolean
    onSchedule?: boolean
    channels?: Array<'email' | 'slack' | 'teams' | 'webhook'>
    recipients?: string[]
    webhookUrl?: string
  }

  // Auditoría
  audit?: {
    enabled?: boolean
    retentionDays?: number
    trackViews?: boolean
    trackExports?: boolean
    trackModifications?: boolean
    anonymizeData?: boolean
  }

  // Configuración avanzada
  advanced?: {
    version?: string
    locale?: string
    timezone?: string
    customCSS?: string
    customJS?: string
    metadata?: Record<string, any>
  }
}

interface Props {
  modelValue: BasicInfo
  dataSources: Array<{ id: string; name: string; type?: string; status?: string }>
  users?: User[]
  roles?: Role[]
  departments?: Department[]
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: BasicInfo): void
  (e: 'validate', isValid: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  users: () => [],
  roles: () => [],
  departments: () => [],
  loading: false,
  error: null,
})

const emit = defineEmits<Emits>()
const { t } = useI18n()

// Estado - Valores por defecto
const defaultBasicInfo: BasicInfo = {
  name: '',
  description: '',
  dataSourceId: '',
  isActive: true,
  isPublic: false,
  permissions: {
    type: 'private',
    users: [],
    roles: [],
    departments: [],
    allowGuests: false,
    requireAuth: true,
    inheritFromCategory: false,
  },
  menu_config: {
    show_in_menu: false,
    menu_title: '',
    menu_icon: '',
    menu_category: '',
    menu_order: 0,
    menu_permissions: { action: 'read', subject: 'Report' },
    menu_badge: { content: '', class: '' },
  },
  performance: {
    refreshInterval: 60,
    autoRefresh: false,
    cacheEnabled: true,
    cacheTtl: 300,
    maxExecutionTime: 300,
    maxRows: 10000,
    timeout: 60,
  },
  notifications: {
    enabled: false,
    onError: true,
    onSuccess: false,
    onSchedule: false,
    channels: ['email'],
    recipients: [],
  },
  audit: {
    enabled: true,
    retentionDays: 90,
    trackViews: true,
    trackExports: true,
    trackModifications: true,
    anonymizeData: false,
  },
  advanced: {
    version: '1.0.0',
    locale: 'es-ES',
    timezone: 'America/Mexico_City',
  },
}

const basicInfo = ref<BasicInfo>({ ...defaultBasicInfo })

const activeTab = ref('basic')
const showAdvancedDialog = ref(false)
const searchUsers = ref('')
const searchRoles = ref('')
const newRecipientEmail = ref('')

// Categorías disponibles
const availableCategories: ReportCategory[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'tabler-dashboard',
    color: 'primary',
    description: 'Tableros de control e indicadores clave',
  },
  {
    id: 'operational',
    name: 'Operacional',
    icon: 'tabler-settings',
    color: 'warning',
    description: 'Reportes de operaciones diarias',
  },
  {
    id: 'financial',
    name: 'Financiero',
    icon: 'tabler-chart-line',
    color: 'success',
    description: 'Reportes financieros y contables',
  },
  {
    id: 'analytical',
    name: 'Analítico',
    icon: 'tabler-chart-bar',
    color: 'info',
    description: 'Análisis de datos y métricas',
  },
  {
    id: 'regulatory',
    name: 'Regulatorio',
    icon: 'tabler-shield-check',
    color: 'error',
    description: 'Reportes para cumplimiento normativo',
  },
]

// Tags disponibles con iconos
const availableTags = ref<ReportTag[]>([
  { id: 'financial', name: 'Financiero', color: 'success', icon: 'tabler-cash' },
  { id: 'sales', name: 'Ventas', color: 'primary', icon: 'tabler-shopping-cart' },
  { id: 'operations', name: 'Operaciones', color: 'warning', icon: 'tabler-settings' },
  { id: 'hr', name: 'Recursos Humanos', color: 'info', icon: 'tabler-users' },
  { id: 'marketing', name: 'Marketing', color: 'purple', icon: 'tabler-speakerphone' },
  { id: 'analytics', name: 'Analítica', color: 'error', icon: 'tabler-chart-pie' },
  { id: 'inventory', name: 'Inventario', color: 'secondary', icon: 'tabler-package' },
  { id: 'compliance', name: 'Cumplimiento', color: 'teal', icon: 'tabler-shield-check' },
])

// Departamentos disponibles
const availableDepartments: Department[] = [
  { id: 'management', name: 'Dirección', icon: 'tabler-briefcase', color: 'primary' },
  { id: 'finance', name: 'Finanzas', icon: 'tabler-cash', color: 'success' },
  { id: 'sales', name: 'Ventas', icon: 'tabler-shopping-cart', color: 'info' },
  { id: 'operations', name: 'Operaciones', icon: 'tabler-settings', color: 'warning' },
  { id: 'hr', name: 'RRHH', icon: 'tabler-users', color: 'purple' },
  { id: 'it', name: 'TI', icon: 'tabler-devices', color: 'error' },
]

// Prioridades
const priorityOptions = [
  { value: 'low', title: 'Baja', color: 'success', icon: 'tabler-arrow-down', description: 'Ejecución en segundo plano' },
  { value: 'medium', title: 'Media', color: 'warning', icon: 'tabler-arrow-right', description: 'Ejecución normal' },
  { value: 'high', title: 'Alta', color: 'error', icon: 'tabler-arrow-up', description: 'Ejecución prioritaria' },
]

// Intervalos de actualización
const refreshIntervalOptions = [
  { value: 0, title: 'Sin actualización automática' },
  { value: 60, title: 'Cada minuto' },
  { value: 300, title: 'Cada 5 minutos' },
  { value: 900, title: 'Cada 15 minutos' },
  { value: 1800, title: 'Cada 30 minutos' },
  { value: 3600, title: 'Cada hora' },
  { value: 21600, title: 'Cada 6 horas' },
  { value: 86400, title: 'Diario' },
]

// Canales de notificación
const notificationChannels = [
  { value: 'email', title: 'Email', icon: 'tabler-mail', color: 'primary' },
  // { value: 'slack', title: 'Slack', icon: 'tabler-brand-slack', color: 'purple' },
  // { value: 'teams', title: 'Teams', icon: 'tabler-brand-teams', color: 'info' },
  { value: 'webhook', title: 'Webhook', icon: 'tabler-webhook', color: 'warning' },
]

// Función para hacer merge profundo de objetos
const deepMerge = (target: any, source: any): any => {
  const result = { ...target }

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]))
      result[key] = deepMerge(target[key] || {}, source[key])
    else
      result[key] = source[key]
  }

  return result
}

// Inicializar
onMounted(() => {
  if (props.modelValue) {
    isUpdatingFromProps.value = true
    basicInfo.value = deepMerge(defaultBasicInfo, props.modelValue)
    nextTick(() => {
      isUpdatingFromProps.value = false
    })
  }

  validateConfig()
})

// Watchers
watch(() => props.modelValue, newVal => {
  if (newVal) {
    isUpdatingFromProps.value = true
    basicInfo.value = deepMerge(defaultBasicInfo, newVal)

    // Usar nextTick para restaurar la flag después de que se complete la actualización
    nextTick(() => {
      isUpdatingFromProps.value = false
    })
  }
}, { deep: true })

// Flag para prevenir bucles de actualización
const isUpdatingFromProps = ref(false)

watch(basicInfo, () => {
  if (!isUpdatingFromProps.value)
    emitUpdate()
}, { deep: true })

// Métodos
const emitUpdate = () => {
  emit('update:modelValue', basicInfo.value)
  validateConfig()
}

const validateConfig = () => {
  const isValid = !!(
    basicInfo.value.name?.trim()
    && basicInfo.value.dataSourceId
  )

  emit('validate', isValid)
}

// Gestión de tags
const toggleTag = (tagId: string) => {
  if (!basicInfo.value.tags)
    basicInfo.value.tags = []
  const index = basicInfo.value.tags.indexOf(tagId)

  if (index > -1)
    basicInfo.value.tags.splice(index, 1)
  else
    basicInfo.value.tags.push(tagId)
}

const isTagSelected = (tagId: string) => {
  return (basicInfo.value.tags || []).includes(tagId)
}

// Gestión de permisos
const toggleUser = (userId: string) => {
  if (!basicInfo.value.permissions)
    basicInfo.value.permissions = { type: 'custom' }
  if (!basicInfo.value.permissions.users)
    basicInfo.value.permissions.users = []

  const index = basicInfo.value.permissions.users.indexOf(userId)
  if (index > -1)
    basicInfo.value.permissions.users.splice(index, 1)
  else
    basicInfo.value.permissions.users.push(userId)
}

const toggleRole = (roleId: string) => {
  if (!basicInfo.value.permissions)
    basicInfo.value.permissions = { type: 'custom' }
  if (!basicInfo.value.permissions.roles)
    basicInfo.value.permissions.roles = []

  const index = basicInfo.value.permissions.roles.indexOf(roleId)
  if (index > -1)
    basicInfo.value.permissions.roles.splice(index, 1)
  else
    basicInfo.value.permissions.roles.push(roleId)
}

const toggleDepartment = (departmentId: string) => {
  if (!basicInfo.value.permissions)
    basicInfo.value.permissions = { type: 'custom' }
  if (!basicInfo.value.permissions.departments)
    basicInfo.value.permissions.departments = []

  const index = basicInfo.value.permissions.departments.indexOf(departmentId)
  if (index > -1)
    basicInfo.value.permissions.departments.splice(index, 1)
  else
    basicInfo.value.permissions.departments.push(departmentId)
}

// Gestión de notificaciones
const toggleNotificationChannel = (channel: string) => {
  if (!basicInfo.value.notifications)
    basicInfo.value.notifications = { enabled: false }
  if (!basicInfo.value.notifications.channels)
    basicInfo.value.notifications.channels = []

  const index = basicInfo.value.notifications.channels.indexOf(channel as any)
  if (index > -1)
    basicInfo.value.notifications.channels.splice(index, 1)
  else
    basicInfo.value.notifications.channels.push(channel as any)
}

const addRecipient = () => {
  if (!basicInfo.value.notifications)
    basicInfo.value.notifications = { enabled: false }
  if (!basicInfo.value.notifications.recipients)
    basicInfo.value.notifications.recipients = []

  const email = newRecipientEmail.value.trim()
  if (email && isValidEmail(email) && !basicInfo.value.notifications.recipients.includes(email)) {
    basicInfo.value.notifications.recipients.push(email)
    newRecipientEmail.value = ''
  }
}

const removeRecipient = (index: number) => {
  if (basicInfo.value.notifications?.recipients)
    basicInfo.value.notifications.recipients.splice(index, 1)
}

// Helpers
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(email)
}

const getDataSourceIcon = (type?: string) => {
  const icons: Record<string, string> = {
    mysql: 'tabler-brand-mysql',
    postgresql: 'tabler-brand-postgresql',
    mongodb: 'tabler-brand-mongodb',
    api: 'tabler-api',
    csv: 'tabler-file-text',
    excel: 'tabler-file-spreadsheet',
  }

  return icons[type || ''] || 'tabler-database'
}

const getDataSourceStatus = (status?: string) => {
  const statuses: Record<string, { color: string; icon: string }> = {
    active: { color: 'success', icon: 'tabler-circle-check' },
    inactive: { color: 'error', icon: 'tabler-circle-x' },
    connecting: { color: 'warning', icon: 'tabler-loader' },
  }

  return statuses[status || ''] || { color: 'default', icon: 'tabler-circle' }
}

// Computed
const filteredUsers = computed(() => {
  if (!searchUsers.value)
    return props.users
  const search = searchUsers.value.toLowerCase()

  return props.users.filter(user =>
    user.name.toLowerCase().includes(search)
    || user.email.toLowerCase().includes(search),
  )
})

const filteredRoles = computed(() => {
  if (!searchRoles.value)
    return props.roles
  const search = searchRoles.value.toLowerCase()

  return props.roles.filter(role =>
    role.name.toLowerCase().includes(search)
    || role.description.toLowerCase().includes(search),
  )
})

const selectedCategory = computed(() => {
  return availableCategories.find(cat => cat.id === basicInfo.value.categoryId)
})

const selectedDepartment = computed(() => {
  return availableDepartments.find(dept => dept.id === basicInfo.value.departmentId)
})

const selectedPriority = computed(() => {
  return priorityOptions.find(p => p.value === basicInfo.value.priority)
})

const permissionsSummary = computed(() => {
  const permissions = basicInfo.value.permissions
  if (!permissions)
    return 'Sin configurar'

  switch (permissions.type) {
    case 'public':
      return 'Público - Todos pueden ver'
    case 'private':
      return 'Privado - Solo el creador'
    case 'custom':
      const counts = []
      if (permissions.users?.length)
        counts.push(`${permissions.users.length} usuarios`)
      if (permissions.roles?.length)
        counts.push(`${permissions.roles.length} roles`)
      if (permissions.departments?.length)
        counts.push(`${permissions.departments.length} departamentos`)
      return counts.length ? counts.join(', ') : 'Personalizado'
    default:
      return 'Sin configurar'
  }
})

const isConfigValid = computed(() => {
  return !!(basicInfo.value.name?.trim() && basicInfo.value.dataSourceId)
})

// Función para manejar la validación del menú
const onMenuConfigValidate = (isValid: boolean) => {
  // La validación del menú se maneja internamente en el componente ReportMenuConfig
  // Aquí podríamos agregar lógica adicional si es necesario
}

// Funciones de formato
const getCacheTtlLabel = (seconds: number) => {
  if (seconds < 60)
    return `${seconds}s`
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)}h`

  return `${Math.floor(seconds / 86400)}d`
}

const getRetentionLabel = (days: number) => {
  if (days < 30)
    return `${days} días`
  if (days < 365)
    return `${Math.floor(days / 30)} meses`

  return `${Math.floor(days / 365)} años`
}
</script>

<template>
  <div class="report-basic-info-advanced">
    <VRow>
      <VCol cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h6 class="text-h6 font-weight-medium mb-0">
            Información y Configuración del Reporte
          </h6>
          <VChip
            :color="isConfigValid ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            <VIcon
              :icon="isConfigValid ? 'tabler-check' : 'tabler-alert-circle'"
              size="16"
              start
            />
            {{ isConfigValid ? 'Configuración válida' : 'Faltan campos requeridos' }}
          </VChip>
        </div>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Define la información básica, permisos y configuraciones avanzadas del reporte.
        </p>
      </VCol>
    </VRow>

    <!-- Tabs principales -->
    <VTabs
      v-model="activeTab"
      class="mb-4"
    >
      <VTab value="basic">
        <VIcon
          icon="tabler-info-circle"
          start
        />
        Información
      </VTab>
      <VTab value="permissions">
        <VIcon
          icon="tabler-lock"
          start
        />
        Permisos
      </VTab>
      <VTab value="classification">
        <VIcon
          icon="tabler-tag"
          start
        />
        Clasificación
      </VTab>
      <VTab value="menu">
        <VIcon
          icon="tabler-menu-2"
          start
        />
        Menú
      </VTab>
      <VTab value="performance">
        <VIcon
          icon="tabler-gauge"
          start
        />
        Rendimiento
      </VTab>
      <VTab value="notifications">
        <VIcon
          icon="tabler-bell"
          start
        />
        Notificaciones
      </VTab>
      <VTab value="audit">
        <VIcon
          icon="tabler-shield-check"
          start
        />
        Auditoría
      </VTab>
    </VTabs>

    <VWindow v-model="activeTab">
      <!-- Tab Información Básica -->
      <VWindowItem value="basic">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center pa-4">
            <VIcon
              icon="tabler-file-text"
              class="me-2"
            />
            Información del Reporte
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model="basicInfo.name"
                  label="Nombre del reporte"
                  placeholder="Ej: Reporte de Ventas Mensual"
                  variant="outlined"
                  :rules="[v => !!v || 'El nombre es requerido']"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-file-text" />
                  </template>
                </VTextField>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="basicInfo.dataSourceId"
                  label="Fuente de datos"
                  :items="props.dataSources"
                  item-title="name"
                  item-value="id"
                  variant="outlined"
                  :rules="[v => !!v || 'La fuente de datos es requerida']"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-database" />
                  </template>
                  <template #item="{ props, item }">
                    <VListItem v-bind="props">
                      <template #prepend>
                        <VIcon :icon="getDataSourceIcon(item.raw.type)" />
                      </template>
                      <template #append>
                        <VIcon
                          :icon="getDataSourceStatus(item.raw.status).icon"
                          :color="getDataSourceStatus(item.raw.status).color"
                          size="16"
                        />
                      </template>
                    </VListItem>
                  </template>
                </VSelect>
              </VCol>

              <VCol cols="12">
                <VTextarea
                  v-model="basicInfo.description"
                  label="Descripción"
                  placeholder="Describe el propósito y contenido del reporte..."
                  rows="3"
                  variant="outlined"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-align-left" />
                  </template>
                </VTextarea>
              </VCol>

              <VCol cols="12">
                <div class="d-flex flex-wrap gap-4">
                  <VSwitch
                    v-model="basicInfo.isActive"
                    label="Reporte activo"
                    color="primary"
                  >
                    <template #label>
                      <span>Reporte activo</span>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon
                            icon="tabler-info-circle"
                            size="16"
                            class="ms-1"
                            v-bind="props"
                          />
                        </template>
                        <span>Los reportes inactivos no pueden ser ejecutados por los usuarios</span>
                      </VTooltip>
                    </template>
                  </VSwitch>

                  <VSwitch
                    v-model="basicInfo.isPublic"
                    label="Visible públicamente"
                    color="warning"
                  >
                    <template #label>
                      <span>Visible públicamente</span>
                      <VTooltip location="top">
                        <template #activator="{ props }">
                          <VIcon
                            icon="tabler-info-circle"
                            size="16"
                            class="ms-1"
                            v-bind="props"
                          />
                        </template>
                        <span>Los reportes públicos aparecen en el catálogo general</span>
                      </VTooltip>
                    </template>
                  </VSwitch>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Permisos -->
      <VWindowItem value="permissions">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-lock"
                class="me-2"
              />
              <span>Control de Acceso</span>
            </div>
            <VChip
              size="small"
              variant="tonal"
            >
              {{ permissionsSummary }}
            </VChip>
          </VCardTitle>
          <VCardText>
            <!-- Tipo de permisos -->
            <VRow>
              <VCol cols="12">
                <VRadioGroup
                  v-model="basicInfo.permissions!.type"
                  inline
                >
                  <VRadio value="public">
                    <template #label>
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-world"
                          size="20"
                          class="me-2"
                        />
                        <div>
                          <div class="font-weight-medium">
                            Público
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            Todos pueden ver este reporte
                          </div>
                        </div>
                      </div>
                    </template>
                  </VRadio>
                  <VRadio value="private">
                    <template #label>
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-lock"
                          size="20"
                          class="me-2"
                        />
                        <div>
                          <div class="font-weight-medium">
                            Privado
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            Solo yo puedo ver este reporte
                          </div>
                        </div>
                      </div>
                    </template>
                  </VRadio>
                  <VRadio value="custom">
                    <template #label>
                      <div class="d-flex align-center">
                        <VIcon
                          icon="tabler-users"
                          size="20"
                          class="me-2"
                        />
                        <div>
                          <div class="font-weight-medium">
                            Personalizado
                          </div>
                          <div class="text-caption text-medium-emphasis">
                            Definir usuarios y roles específicos
                          </div>
                        </div>
                      </div>
                    </template>
                  </VRadio>
                </VRadioGroup>
              </VCol>
            </VRow>

            <!-- Configuración personalizada -->
            <template v-if="basicInfo.permissions?.type === 'custom'">
              <VDivider class="my-4" />

              <!-- Usuarios -->
              <VRow>
                <VCol cols="12">
                  <h6 class="text-subtitle-1 mb-3">
                    <VIcon
                      icon="tabler-user"
                      size="20"
                      class="me-2"
                    />
                    Usuarios con acceso
                  </h6>
                  <VTextField
                    v-model="searchUsers"
                    placeholder="Buscar usuarios..."
                    density="compact"
                    variant="outlined"
                    clearable
                    class="mb-3"
                  >
                    <template #prepend-inner>
                      <VIcon
                        icon="tabler-search"
                        size="18"
                      />
                    </template>
                  </VTextField>

                  <div class="users-list">
                    <VCard
                      v-for="user in filteredUsers"
                      :key="user.id"
                      variant="outlined"
                      :class="{ 'border-primary': basicInfo.permissions!.users?.includes(user.id) }"
                      class="mb-2 cursor-pointer"
                      @click="toggleUser(user.id)"
                    >
                      <VCardText class="pa-3">
                        <div class="d-flex align-center">
                          <VAvatar
                            size="32"
                            class="me-3"
                          >
                            <img
                              v-if="user.avatar"
                              :src="user.avatar"
                              :alt="user.name"
                            >
                            <span v-else>{{ user.name.charAt(0) }}</span>
                          </VAvatar>
                          <div class="flex-grow-1">
                            <div class="font-weight-medium">
                              {{ user.name }}
                            </div>
                            <div class="text-caption text-medium-emphasis">
                              {{ user.email }}
                            </div>
                          </div>
                          <VCheckbox
                            :model-value="basicInfo.permissions!.users?.includes(user.id)"
                            hide-details
                            @click.stop
                          />
                        </div>
                      </VCardText>
                    </VCard>
                  </div>
                </VCol>

                <!-- Roles -->
                <VCol cols="12">
                  <h6 class="text-subtitle-1 mb-3">
                    <VIcon
                      icon="tabler-users-group"
                      size="20"
                      class="me-2"
                    />
                    Roles con acceso
                  </h6>
                  <div class="d-flex flex-wrap gap-2">
                    <VChip
                      v-for="role in props.roles"
                      :key="role.id"
                      :color="basicInfo.permissions!.roles?.includes(role.id) ? 'primary' : 'default'"
                      :variant="basicInfo.permissions!.roles?.includes(role.id) ? 'flat' : 'outlined'"
                      class="cursor-pointer"
                      @click="toggleRole(role.id)"
                    >
                      <VIcon
                        :icon="basicInfo.permissions!.roles?.includes(role.id) ? 'tabler-check' : 'tabler-plus'"
                        size="16"
                        start
                      />
                      {{ role.name }}
                    </VChip>
                  </div>
                </VCol>

                <!-- Departamentos -->
                <!-- <VCol cols="12">
                  <h6 class="text-subtitle-1 mb-3">
                    <VIcon
                      icon="tabler-building"
                      size="20"
                      class="me-2"
                    />
                    Departamentos con acceso
                  </h6>
                  <VRow>
                    <VCol
                      v-for="dept in availableDepartments"
                      :key="dept.id"
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <VCard
                        variant="outlined"
                        :class="{ 'border-primary': basicInfo.permissions!.departments?.includes(dept.id) }"
                        class="cursor-pointer"
                        @click="toggleDepartment(dept.id)"
                      >
                        <VCardText class="pa-3">
                          <div class="d-flex align-center justify-space-between">
                            <div class="d-flex align-center">
                              <VIcon
                                :icon="dept.icon"
                                :color="dept.color"
                                size="24"
                                class="me-2"
                              />
                              <span class="font-weight-medium">{{ dept.name }}</span>
                            </div>
                            <VCheckbox
                              :model-value="basicInfo.permissions!.departments?.includes(dept.id)"
                              hide-details
                              @click.stop
                            />
                          </div>
                        </VCardText>
                      </VCard>
                    </VCol>
                  </VRow>
                </VCol> -->

                <!-- Opciones adicionales -->
                <VCol cols="12">
                  <VDivider class="my-2" />
                  <div class="d-flex flex-wrap gap-4 mt-4">
                    <VSwitch
                      v-model="basicInfo.permissions!.allowGuests"
                      label="Permitir usuarios invitados"
                      color="warning"
                      density="compact"
                    >
                      <template #label>
                        <span>Permitir usuarios invitados</span>
                        <VTooltip location="top">
                          <template #activator="{ props }">
                            <VIcon
                              icon="tabler-info-circle"
                              size="16"
                              class="ms-1"
                              v-bind="props"
                            />
                          </template>
                          <span>Los usuarios sin cuenta podrán ver el reporte con un enlace especial</span>
                        </VTooltip>
                      </template>
                    </VSwitch>

                    <VSwitch
                      v-model="basicInfo.permissions!.requireAuth"
                      label="Requerir autenticación"
                      color="error"
                      density="compact"
                    />

                    <VSwitch
                      v-model="basicInfo.permissions!.inheritFromCategory"
                      label="Heredar permisos de categoría"
                      color="info"
                      density="compact"
                    >
                      <template #label>
                        <span>Heredar permisos de categoría</span>
                        <VTooltip location="top">
                          <template #activator="{ props }">
                            <VIcon
                              icon="tabler-info-circle"
                              size="16"
                              class="ms-1"
                              v-bind="props"
                            />
                          </template>
                          <span>Aplicar automáticamente los permisos definidos en la categoría del reporte</span>
                        </VTooltip>
                      </template>
                    </VSwitch>
                  </div>
                </VCol>
              </VRow>
            </template>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Clasificación -->
      <VWindowItem value="classification">
        <VRow>
          <!-- Categoría -->
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="d-flex align-center pa-4">
                <VIcon
                  icon="tabler-category"
                  class="me-2"
                />
                Categoría del Reporte
                <VTooltip location="top">
                  <template #activator="{ props }">
                    <VIcon
                      icon="tabler-help-circle"
                      size="18"
                      class="ms-2 text-medium-emphasis"
                      v-bind="props"
                    />
                  </template>
                  <span>La categoría ayuda a organizar los reportes y puede definir permisos heredados</span>
                </VTooltip>
              </VCardTitle>
              <VCardText>
                <VRow>
                  <VCol
                    v-for="category in availableCategories"
                    :key="category.id"
                    cols="12"
                    sm="6"
                    md="4"
                  >
                    <VCard
                      variant="outlined"
                      :class="{ 'border-primary': basicInfo.categoryId === category.id }"
                      class="category-card cursor-pointer"
                      @click="basicInfo.categoryId = category.id"
                    >
                      <VCardText class="pa-4">
                        <div class="d-flex align-center justify-space-between mb-2">
                          <VIcon
                            :icon="category.icon"
                            :color="category.color"
                            size="32"
                          />
                          <VRadio
                            :model-value="basicInfo.categoryId"
                            :value="category.id"
                            :color="category.color"
                            hide-details
                            @click.stop
                          />
                        </div>
                        <h6 class="text-subtitle-1 font-weight-medium mb-1">
                          {{ category.name }}
                        </h6>
                        <p class="text-caption text-medium-emphasis mb-0">
                          {{ category.description }}
                        </p>
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Departamento -->
          <!-- <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="d-flex align-center pa-4">
                <VIcon
                  icon="tabler-building"
                  class="me-2"
                />
                Departamento
              </VCardTitle>
              <VCardText>
                <VRow>
                  <VCol
                    v-for="dept in availableDepartments"
                    :key="dept.id"
                    cols="6"
                    sm="4"
                    md="3"
                  >
                    <VCard
                      variant="outlined"
                      :class="{ 'border-primary': basicInfo.departmentId === dept.id }"
                      class="text-center cursor-pointer pa-3"
                      @click="basicInfo.departmentId = dept.id"
                    >
                      <VIcon
                        :icon="dept.icon"
                        :color="dept.color"
                        size="32"
                        class="mb-2"
                      />
                      <div class="text-caption font-weight-medium">
                        {{ dept.name }}
                      </div>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol> -->

          <!-- Etiquetas -->
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="d-flex align-center pa-4">
                <VIcon
                  icon="tabler-tags"
                  class="me-2"
                />
                Etiquetas
                <VChip
                  size="small"
                  class="ms-2"
                  :color="(basicInfo.tags || []).length > 0 ? 'primary' : 'default'"
                >
                  {{ (basicInfo.tags || []).length }} seleccionadas
                </VChip>
              </VCardTitle>
              <VCardText>
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <VChip
                    v-for="tag in availableTags"
                    :key="tag.id"
                    :color="isTagSelected(tag.id) ? tag.color : 'default'"
                    :variant="isTagSelected(tag.id) ? 'flat' : 'outlined'"
                    class="cursor-pointer"
                    @click="toggleTag(tag.id)"
                  >
                    <VIcon
                      :icon="tag.icon || 'tabler-tag'"
                      size="16"
                      start
                    />
                    {{ tag.name }}
                    <VIcon
                      v-if="isTagSelected(tag.id)"
                      icon="tabler-check"
                      size="16"
                      end
                    />
                  </VChip>
                </div>
                <VAlert
                  type="info"
                  variant="tonal"
                  density="compact"
                >
                  <VIcon
                    icon="tabler-bulb"
                    size="18"
                  />
                  Las etiquetas facilitan la búsqueda y filtrado de reportes en el catálogo
                </VAlert>
              </VCardText>
            </VCard>
          </VCol>

          <!-- Prioridad -->
          <VCol cols="12">
            <VCard variant="outlined">
              <VCardTitle class="d-flex align-center pa-4">
                <VIcon
                  icon="tabler-flag"
                  class="me-2"
                />
                Prioridad de Ejecución
              </VCardTitle>
              <VCardText>
                <VRow>
                  <VCol
                    v-for="priority in priorityOptions"
                    :key="priority.value"
                    cols="12"
                    sm="4"
                  >
                    <VCard
                      variant="outlined"
                      :class="{ 'border-primary': basicInfo.priority === priority.value }"
                      class="priority-card cursor-pointer"
                      @click="basicInfo.priority = priority.value"
                    >
                      <VCardText class="pa-4">
                        <div class="d-flex align-center mb-2">
                          <VIcon
                            :icon="priority.icon"
                            :color="priority.color"
                            size="24"
                            class="me-2"
                          />
                          <span class="text-subtitle-1 font-weight-medium">
                            {{ priority.title }}
                          </span>
                        </div>
                        <p class="text-caption text-medium-emphasis mb-2">
                          {{ priority.description }}
                        </p>
                        <VRadio
                          :model-value="basicInfo.priority"
                          :value="priority.value"
                          :color="priority.color"
                          hide-details
                          @click.stop
                        />
                      </VCardText>
                    </VCard>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VWindowItem>

      <!-- Tab Rendimiento -->
      <VWindowItem value="performance">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center pa-4">
            <VIcon
              icon="tabler-gauge"
              class="me-2"
            />
            Configuración de Rendimiento
          </VCardTitle>
          <VCardText>
            <VRow>
              <!-- Actualización automática -->
              <VCol cols="12">
                <div class="d-flex align-center justify-space-between mb-3">
                  <div>
                    <h6 class="text-subtitle-1 mb-1">
                      Actualización Automática
                    </h6>
                    <p class="text-caption text-medium-emphasis mb-0">
                      El reporte se actualizará automáticamente según el intervalo configurado
                    </p>
                  </div>
                  <VSwitch
                    v-model="basicInfo.performance!.autoRefresh"
                    color="primary"
                    hide-details
                  />
                </div>
              </VCol>

              <VCol
                v-if="basicInfo.performance?.autoRefresh"
                cols="12"
                md="6"
              >
                <VSelect
                  v-model="basicInfo.performance!.refreshInterval"
                  :items="refreshIntervalOptions"
                  label="Intervalo de actualización"
                  variant="outlined"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-refresh" />
                  </template>
                </VSelect>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model.number="basicInfo.performance!.maxExecutionTime"
                  label="Tiempo máximo de ejecución"
                  type="number"
                  min="1"
                  max="3600"
                  variant="outlined"
                  suffix="segundos"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-clock" />
                  </template>
                </VTextField>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model.number="basicInfo.performance!.maxRows"
                  label="Máximo de filas"
                  type="number"
                  min="1"
                  max="1000000"
                  variant="outlined"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-table" />
                  </template>
                </VTextField>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VTextField
                  v-model.number="basicInfo.performance!.timeout"
                  label="Timeout de consulta"
                  type="number"
                  min="1"
                  max="300"
                  variant="outlined"
                  suffix="segundos"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-hourglass" />
                  </template>
                </VTextField>
              </VCol>

              <!-- Cache -->
              <VCol cols="12">
                <VDivider class="my-2" />
                <div class="d-flex align-center justify-space-between my-3">
                  <div>
                    <h6 class="text-subtitle-1 mb-1">
                      Cache de Resultados
                    </h6>
                    <p class="text-caption text-medium-emphasis mb-0">
                      Almacena temporalmente los resultados para mejorar el rendimiento
                    </p>
                  </div>
                  <VSwitch
                    v-model="basicInfo.performance!.cacheEnabled"
                    color="primary"
                    hide-details
                  />
                </div>
              </VCol>

              <VCol
                v-if="basicInfo.performance?.cacheEnabled"
                cols="12"
              >
                <VSlider
                  v-model="basicInfo.performance!.cacheTtl"
                  label="Tiempo de vida del cache"
                  min="60"
                  max="86400"
                  step="60"
                  thumb-label="always"
                  color="primary"
                >
                  <template #thumb-label="{ modelValue }">
                    {{ getCacheTtlLabel(modelValue) }}
                  </template>
                </VSlider>
              </VCol>
            </VRow>

            <VAlert
              type="info"
              variant="tonal"
              class="mt-4"
            >
              <template #prepend>
                <VIcon icon="tabler-bulb" />
              </template>
              <div>
                <strong>Recomendaciones de rendimiento:</strong>
                <ul class="mb-0 mt-2">
                  <li>Para reportes con muchos datos, establece un límite de filas apropiado</li>
                  <li>Usa cache para reportes que no requieren datos en tiempo real</li>
                  <li>Configura timeouts adecuados según la complejidad de las consultas</li>
                </ul>
              </div>
            </VAlert>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Notificaciones -->
      <VWindowItem value="notifications">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-bell"
                class="me-2"
              />
              <span>Notificaciones y Alertas</span>
            </div>
            <VSwitch
              v-model="basicInfo.notifications!.enabled"
              color="primary"
              hide-details
            />
          </VCardTitle>

          <VCardText v-if="basicInfo.notifications?.enabled">
            <VRow>
              <!-- Eventos de notificación -->
              <VCol cols="12">
                <h6 class="text-subtitle-1 mb-3">
                  Notificar cuando:
                </h6>
                <div class="d-flex flex-column gap-3">
                  <VCheckbox
                    v-model="basicInfo.notifications!.onError"
                    label="Ocurra un error en la ejecución"
                    color="error"
                    hide-details
                  />
                  <VCheckbox
                    v-model="basicInfo.notifications!.onSuccess"
                    label="Se complete exitosamente"
                    color="success"
                    hide-details
                  />
                  <VCheckbox
                    v-model="basicInfo.notifications!.onSchedule"
                    label="Se ejecute de forma programada"
                    color="info"
                    hide-details
                  />
                </div>
              </VCol>

              <!-- Canales de notificación -->
              <VCol cols="12">
                <VDivider class="my-3" />
                <h6 class="text-subtitle-1 mb-3">
                  Canales de notificación:
                </h6>
                <div class="d-flex flex-wrap gap-3">
                  <VCard
                    v-for="channel in notificationChannels"
                    :key="channel.value"
                    variant="outlined"
                    :class="{ 'border-primary': basicInfo.notifications!.channels?.includes(channel.value) }"
                    class="channel-card cursor-pointer"
                    @click="toggleNotificationChannel(channel.value)"
                  >
                    <VCardText class="pa-3 text-center">
                      <VIcon
                        :icon="channel.icon"
                        :color="channel.color"
                        size="32"
                        class="mb-2"
                      />
                      <div class="text-caption font-weight-medium">
                        {{ channel.title }}
                      </div>
                    </VCardText>
                  </VCard>
                </div>
              </VCol>

              <!-- Destinatarios -->
              <VCol cols="12">
                <VDivider class="my-3" />
                <h6 class="text-subtitle-1 mb-3">
                  Destinatarios de email:
                </h6>
                <VTextField
                  v-model="newRecipientEmail"
                  label="Agregar email"
                  placeholder="usuario@ejemplo.com"
                  density="compact"
                  variant="outlined"
                  @keydown.enter="addRecipient"
                >
                  <template #append>
                    <VBtn
                      icon="tabler-plus"
                      variant="tonal"
                      size="small"
                      @click="addRecipient"
                    />
                  </template>
                </VTextField>

                <div class="mt-3">
                  <VChip
                    v-for="(email, index) in basicInfo.notifications!.recipients"
                    :key="email"
                    closable
                    class="ma-1"
                    @click:close="removeRecipient(index)"
                  >
                    <VIcon
                      icon="tabler-mail"
                      size="16"
                      start
                    />
                    {{ email }}
                  </VChip>
                </div>
              </VCol>

              <!-- Webhook -->
              <VCol
                v-if="basicInfo.notifications!.channels?.includes('webhook')"
                cols="12"
              >
                <VTextField
                  v-model="basicInfo.notifications!.webhookUrl"
                  label="URL del Webhook"
                  placeholder="https://api.ejemplo.com/webhook"
                  variant="outlined"
                >
                  <template #prepend-inner>
                    <VIcon icon="tabler-webhook" />
                  </template>
                </VTextField>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Auditoría -->
      <VWindowItem value="audit">
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-shield-check"
                class="me-2"
              />
              <span>Auditoría y Cumplimiento</span>
            </div>
            <VSwitch
              v-model="basicInfo.audit!.enabled"
              color="primary"
              hide-details
            />
          </VCardTitle>

          <VCardText v-if="basicInfo.audit?.enabled">
            <VRow>
              <VCol cols="12">
                <h6 class="text-subtitle-1 mb-3">
                  Registrar eventos de:
                </h6>
                <div class="d-flex flex-column gap-3">
                  <VCheckbox
                    v-model="basicInfo.audit!.trackViews"
                    label="Visualización del reporte"
                    hide-details
                  >
                    <template #label>
                      <span>Visualización del reporte</span>
                      <VChip
                        size="x-small"
                        class="ms-2"
                      >
                        Quién y cuándo
                      </VChip>
                    </template>
                  </VCheckbox>
                  <VCheckbox
                    v-model="basicInfo.audit!.trackExports"
                    label="Exportación de datos"
                    hide-details
                  >
                    <template #label>
                      <span>Exportación de datos</span>
                      <VChip
                        size="x-small"
                        class="ms-2"
                      >
                        Formato y destino
                      </VChip>
                    </template>
                  </VCheckbox>
                  <VCheckbox
                    v-model="basicInfo.audit!.trackModifications"
                    label="Modificaciones al reporte"
                    hide-details
                  >
                    <template #label>
                      <span>Modificaciones al reporte</span>
                      <VChip
                        size="x-small"
                        class="ms-2"
                      >
                        Cambios y versiones
                      </VChip>
                    </template>
                  </VCheckbox>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VSlider
                  v-model="basicInfo.audit!.retentionDays"
                  label="Retención de logs"
                  min="7"
                  max="3650"
                  step="1"
                  thumb-label="always"
                  color="primary"
                  class="slider-retention"
                >
                  <template #thumb-label="{ modelValue }">
                    {{ getRetentionLabel(modelValue) }}
                  </template>
                </VSlider>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VSwitch
                  v-model="basicInfo.audit!.anonymizeData"
                  label="Anonimizar datos sensibles"
                  color="warning"
                >
                  <template #label>
                    <span>Anonimizar datos sensibles</span>
                    <VTooltip location="top">
                      <template #activator="{ props }">
                        <VIcon
                          icon="tabler-info-circle"
                          size="16"
                          class="ms-1"
                          v-bind="props"
                        />
                      </template>
                      <span>Oculta información personal en los logs de auditoría</span>
                    </VTooltip>
                  </template>
                </VSwitch>
              </VCol>
            </VRow>

            <VAlert
              type="info"
              variant="tonal"
              class="mt-4"
            >
              <template #prepend>
                <VIcon icon="tabler-shield-lock" />
              </template>
              Los registros de auditoría ayudan a cumplir con regulaciones de seguridad y privacidad
            </VAlert>
          </VCardText>
        </VCard>
      </VWindowItem>

      <!-- Tab Menú -->
      <VWindowItem value="menu">
        <ReportMenuConfig
          v-model="basicInfo.menu_config"
          :report-name="basicInfo.name"
          @validate="onMenuConfigValidate"
        />
      </VWindowItem>
    </VWindow>

    <!-- Resumen de configuración -->
    <VCard
      variant="tonal"
      class="mt-4"
    >
      <VCardText class="pa-4">
        <div class="d-flex align-center mb-3">
          <VIcon
            icon="tabler-info-circle"
            size="20"
            class="me-2"
          />
          <span class="text-subtitle-1 font-weight-medium">Resumen de Configuración</span>
        </div>

        <VRow>
          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="d-flex align-center">
              <VIcon
                :icon="selectedCategory?.icon || 'tabler-category'"
                :color="selectedCategory?.color || 'default'"
                size="20"
                class="me-2"
              />
              <div>
                <div class="text-caption text-medium-emphasis">
                  Categoría
                </div>
                <div class="text-body-2 font-weight-medium">
                  {{ selectedCategory?.name || 'Sin categoría' }}
                </div>
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-lock"
                :color="basicInfo.permissions?.type === 'public' ? 'success' : 'warning'"
                size="20"
                class="me-2"
              />
              <div>
                <div class="text-caption text-medium-emphasis">
                  Acceso
                </div>
                <div class="text-body-2 font-weight-medium">
                  {{ permissionsSummary }}
                </div>
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="d-flex align-center">
              <VIcon
                :icon="selectedPriority?.icon || 'tabler-flag'"
                :color="selectedPriority?.color || 'default'"
                size="20"
                class="me-2"
              />
              <div>
                <div class="text-caption text-medium-emphasis">
                  Prioridad
                </div>
                <div class="text-body-2 font-weight-medium">
                  {{ selectedPriority?.title || 'Media' }}
                </div>
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-gauge"
                :color="basicInfo.performance?.cacheEnabled ? 'success' : 'default'"
                size="20"
                class="me-2"
              />
              <div>
                <div class="text-caption text-medium-emphasis">
                  Rendimiento
                </div>
                <div class="text-body-2 font-weight-medium">
                  {{ basicInfo.performance?.cacheEnabled ? 'Cache activo' : 'Sin cache' }}
                </div>
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="d-flex align-center">
              <VIcon
                icon="tabler-menu-2"
                :color="basicInfo.menu_config?.show_in_menu ? 'success' : 'default'"
                size="20"
                class="me-2"
              />
              <div>
                <div class="text-caption text-medium-emphasis">
                  Menú
                </div>
                <div class="text-body-2 font-weight-medium">
                  {{ basicInfo.menu_config?.show_in_menu ? 'Visible en menú' : 'No visible' }}
                </div>
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Mensajes de error -->
    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
    >
      {{ error }}
    </VAlert>

    <!-- Botón de configuración avanzada -->
    <div class="text-center mt-4">
      <VBtn
        variant="outlined"
        @click="showAdvancedDialog = true"
      >
        <VIcon
          icon="tabler-adjustments"
          start
        />
        Configuración Avanzada
      </VBtn>
    </div>

    <!-- Dialog de configuración avanzada -->
    <VDialog
      v-model="showAdvancedDialog"
      max-width="600"
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>Configuración Avanzada</span>
          <VBtn
            icon
            variant="text"
            @click="showAdvancedDialog = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="basicInfo.advanced!.version"
                label="Versión del reporte"
                variant="outlined"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="basicInfo.advanced!.locale"
                label="Idioma"
                :items="[
                  { value: 'es-ES', title: 'Español' },
                  { value: 'en-US', title: 'English' },
                  { value: 'pt-BR', title: 'Português' },
                ]"
                variant="outlined"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="basicInfo.advanced!.timezone"
                label="Zona horaria"
                :items="[
                  { value: 'America/Mexico_City', title: 'Ciudad de México' },
                  { value: 'America/New_York', title: 'Nueva York' },
                  { value: 'Europe/Madrid', title: 'Madrid' },
                ]"
                variant="outlined"
              />
            </VCol>
            <VCol cols="12">
              <VTextarea
                v-model="basicInfo.advanced!.customCSS"
                label="CSS personalizado"
                placeholder=".report-header { background: #f0f0f0; }"
                rows="3"
                variant="outlined"
              />
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showAdvancedDialog = false"
          >
            Cerrar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.report-basic-info-advanced {
  .category-card,
  .priority-card,
  .channel-card {
    border: 2px solid transparent;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 10%);
      transform: translateY(-2px);
    }

    &.border-primary {
      border-color: rgb(var(--v-theme-primary));
      background-color: rgba(var(--v-theme-primary), 0.05);
    }
  }

  .users-list {
    max-block-size: 300px;
    overflow-y: auto;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .v-tabs {
    .v-tab {
      font-weight: 500;
      text-transform: none;
    }
  }
}
</style>
<style>
.slider-retention .v-slider-thumb__label {
  inline-size: 4.4vw !important;
}
</style>
