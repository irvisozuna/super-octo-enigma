<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  concession: any
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// Computed properties
const overviewData = computed(() => [
  {
    title: 'Número de Concesión',
    value: props.concession?.concessionNumber || props.concession?.number || '-',
    icon: 'tabler-certificate',
    category: 'identificacion',
  },
  {
    title: 'Modalidad de Transporte',
    value: props.concession?.modalityLabel || '-',
    icon: 'tabler-category',
    category: 'identificacion',
  },
  {
    title: 'Municipio/Jurisdicción',
    value: props.concession?.municipality || '-',
    icon: 'tabler-map-pin',
    category: 'identificacion',
  },
  {
    title: 'Estado de Operación',
    value: props.concession?.statusLabel || '-',
    icon: 'tabler-flag',
    category: 'operacion',
    statusColor: getStatusColor(props.concession?.status),
  },
  {
    title: 'Fecha de Emisión',
    value: formatDate(props.concession?.validFrom),
    icon: 'tabler-calendar-plus',
    category: 'vigencia',
  },
  {
    title: 'Fecha de Vencimiento',
    value: formatDate(props.concession?.validTo),
    icon: 'tabler-calendar-x',
    category: 'vigencia',
    isExpiring: props.concession?.daysUntilExpiration <= 30,
    isExpired: props.concession?.isExpired,
  },
  {
    title: 'Ruta o Sitio Autorizado',
    value: props.concession?.routeOrSite || 'No especificada',
    icon: 'tabler-route',
    category: 'operacion',
  },
  {
    title: 'Número de Resolución',
    value: props.concession?.resolutionNumber || 'Pendiente',
    icon: 'tabler-file-certificate',
    category: 'legal',
  },
])

const holderInfo = computed(() => [
  {
    title: 'Nombre Completo',
    value: props.concession?.holder?.fullName || 'Sin asignar',
    icon: 'tabler-user',
  },
  {
    title: 'Tipo de Persona',
    value: props.concession?.holder?.holderTypeLabel || '-',
    icon: 'tabler-building',
  },
  {
    title: 'Documento de Identidad',
    value: props.concession?.holder?.documentNumber || '-',
    icon: 'tabler-id',
  },
  {
    title: 'Email de Contacto',
    value: props.concession?.holder?.email || '-',
    icon: 'tabler-mail',
  },
  {
    title: 'Teléfono',
    value: props.concession?.holder?.phone || '-',
    icon: 'tabler-phone',
  },
  {
    title: 'Dirección',
    value: props.concession?.holder?.address || 'No registrada',
    icon: 'tabler-map-pin',
  },
])

function getCategoryTitle(category: string) {
  const titles = {
    identificacion: 'Identificación',
    vigencia: 'Vigencia y Validez',
    operacion: 'Operación y Servicio',
    legal: 'Información Legal',
  }

  return titles[category] || category
}

function getServiceField(service: any, field: string) {
  // Handle string format
  if (typeof service === 'string')
    return field === 'label' ? service : null

  // Handle object format
  if (typeof service === 'object' && service !== null) {
    switch (field) {
      case 'label':
        return service.label || service.name || service.title || null
      case 'description':
        return service.description || service.desc || null
      case 'value':
        return service.value || service.code || service.id || null
      default:
        return null
    }
  }

  return null
}

function getRestrictionField(restriction: any, field: string) {
  // Handle string format
  if (typeof restriction === 'string')
    return field === 'label' ? restriction : null

  // Handle object format
  if (typeof restriction === 'object' && restriction !== null) {
    switch (field) {
      case 'label':
        return restriction.label || restriction.name || restriction.title || restriction.type || null
      case 'description':
        return restriction.description || restriction.desc || restriction.reason || null
      case 'value':
        return restriction.value || restriction.details || restriction.limit || restriction.scope || null
      default:
        return null
    }
  }

  return null
}

const quickStats = computed(() => {
  const daysUntilExpiration = props.concession?.daysUntilExpiration || 0
  const isExpired = props.concession?.isExpired
  const isActive = props.concession?.isActive

  return [
    {
      title: 'Días hasta Vencimiento',
      value: isExpired ? 'VENCIDA' : daysUntilExpiration,
      icon: 'tabler-calendar-time',
      color: isExpired
        ? 'error'
        : daysUntilExpiration <= 30
          ? 'warning'
          : daysUntilExpiration <= 90 ? 'info' : 'success',
      subtitle: isExpired
        ? 'Renovación requerida'
        : daysUntilExpiration <= 30
          ? 'Acción requerida'
          : 'Vigente',
    },
    {
      title: 'Servicios Autorizados',
      value: props.concession?.authorizedServices?.length || 0,
      icon: 'tabler-list-check',
      color: 'info',
      subtitle: 'Modalidades permitidas',
    },
    {
      title: 'Restricciones Activas',
      value: props.concession?.restrictions?.length || 0,
      icon: 'tabler-alert-circle',
      color: (props.concession?.restrictions?.length || 0) > 0 ? 'warning' : 'success',
      subtitle: (props.concession?.restrictions?.length || 0) > 0 ? 'Limitaciones vigentes' : 'Sin limitaciones',
    },
    {
      title: 'Estado Regulatorio',
      value: getComplianceStatus(),
      icon: 'tabler-shield-check',
      color: getComplianceColor(),
      subtitle: getComplianceSubtitle(),
    },
  ]
})

// Helper functions
function formatDate(date: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

function formatCurrency(amount: number) {
  if (!amount)
    return '$0.00'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function isExpiringSoon(expiryDate: string, days = 90) {
  if (!expiryDate)
    return false
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays <= days && diffDays >= 0
}

function daysUntilExpiration(expiryDate: string): number {
  if (!expiryDate)
    return 0
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function getExpiryColor(expiryDate: string): string {
  const days = daysUntilExpiration(expiryDate)
  if (days <= 0)
    return 'error'
  if (days <= 30)
    return 'warning'
  if (days <= 90)
    return 'info'

  return 'success'
}

function getStatusColor(status: string) {
  const colors = {
    ACTIVE: 'success',
    INACTIVE: 'warning',
    EXPIRED: 'error',
    SUSPENDED: 'error',
    PENDING: 'info',
    REVOKED: 'error',
  }

  return colors[status?.toUpperCase()] || 'default'
}

function getComplianceStatus() {
  const concession = props.concession
  if (!concession)
    return 'PENDIENTE'

  if (concession.isExpired)
    return 'NO CUMPLE'
  if (!concession.isActive)
    return 'INACTIVA'
  if (concession.status === 'SUSPENDED')
    return 'SUSPENDIDA'
  if (concession.daysUntilExpiration <= 30)
    return 'POR REVISAR'

  return 'CUMPLE'
}

function getComplianceColor() {
  const status = getComplianceStatus()

  const colors = {
    'CUMPLE': 'success',
    'POR REVISAR': 'warning',
    'NO CUMPLE': 'error',
    'SUSPENDIDA': 'error',
    'INACTIVA': 'warning',
    'PENDIENTE': 'info',
  }

  return colors[status] || 'default'
}

function getComplianceSubtitle() {
  const status = getComplianceStatus()

  const subtitles = {
    'CUMPLE': 'Todos los requisitos',
    'POR REVISAR': 'Próxima a vencer',
    'NO CUMPLE': 'Requiere renovación',
    'SUSPENDIDA': 'Operación restringida',
    'INACTIVA': 'Verificar estado',
    'PENDIENTE': 'En proceso',
  }

  return subtitles[status] || 'Estado desconocido'
}
</script>

<template>
  <VCardText class="pa-6">
    <VRow>
      <!-- Quick Stats Cards -->
      <VCol cols="12">
        <div class="d-flex align-center justify-space-between mb-4">
          <h4 class="text-h6 d-flex align-center">
            <VIcon class="me-2">
              tabler-dashboard
            </VIcon>
            Estado Regulatorio y Cumplimiento
          </h4>
          <VChip
            :color="getComplianceColor()"
            size="small"
            variant="tonal"
            class="font-weight-medium"
          >
            {{ getComplianceStatus() }}
          </VChip>
        </div>

        <VRow>
          <VCol
            v-for="stat in quickStats"
            :key="stat.title"
            cols="12"
            sm="6"
            lg="3"
          >
            <VCard
              variant="tonal"
              :color="stat.color"
              class="text-center"
            >
              <VCardText class="pa-4">
                <VIcon
                  :icon="stat.icon"
                  size="32"
                  class="mb-2"
                />
                <div class="text-h4 font-weight-bold">
                  {{ stat.value }}
                </div>
                <div class="text-subtitle-2 font-weight-medium mb-1">
                  {{ stat.title }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ stat.subtitle }}
                </div>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
      </VCol>

      <!-- Concession Details -->
      <VCol
        cols="12"
        lg="6"
      >
        <VCard
          variant="elevated"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon class="me-2">
                tabler-info-circle
              </VIcon>
              Información de la Concesión
            </div>
            <VChip
              :color="getStatusColor(concession?.status)"
              size="small"
              variant="outlined"
            >
              {{ concession?.statusLabel || 'Pendiente' }}
            </VChip>
          </VCardTitle>

          <VCardText>
            <!-- Group by categories for better organization -->
            <div
              v-for="category in ['identificacion', 'vigencia', 'operacion', 'legal']"
              :key="category"
              class="mb-4"
            >
              <div class="text-subtitle-2 font-weight-bold text-primary mb-2 text-uppercase">
                {{ getCategoryTitle(category) }}
              </div>

              <VList density="compact">
                <VListItem
                  v-for="item in overviewData.filter(i => i.category === category)"
                  :key="item.title"
                  class="px-0"
                >
                  <template #prepend>
                    <VIcon
                      :icon="item.icon"
                      :color="item.statusColor || 'primary'"
                      class="me-3"
                    />
                  </template>

                  <VListItemTitle class="font-weight-medium text-sm">
                    {{ item.title }}
                  </VListItemTitle>

                  <VListItemSubtitle
                    :class="{
                      'text-error font-weight-bold': item.isExpired,
                      'text-warning font-weight-bold': item.isExpiring && !item.isExpired,
                      'font-weight-medium': item.category === 'identificacion',
                    }"
                  >
                    {{ item.value }}
                    <VChip
                      v-if="item.isExpired"
                      color="error"
                      size="x-small"
                      class="ms-2"
                      variant="flat"
                    >
                      <VIcon
                        start
                        size="10"
                      >
                        tabler-alert-circle
                      </VIcon>
                      ¡VENCIDA!
                    </VChip>
                    <VChip
                      v-else-if="item.isExpiring"
                      color="warning"
                      size="x-small"
                      class="ms-2"
                      variant="flat"
                    >
                      <VIcon
                        start
                        size="10"
                      >
                        tabler-clock-exclamation
                      </VIcon>
                      POR VENCER
                    </VChip>
                  </VListItemSubtitle>
                </VListItem>
              </VList>

              <VDivider
                v-if="category !== 'legal'"
                class="mt-3"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Holder Information -->
      <VCol
        cols="12"
        lg="6"
      >
        <VCard
          variant="elevated"
          class="h-100"
        >
          <VCardTitle class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VIcon class="me-2">
                tabler-user
              </VIcon>
              Información del Concesionario
            </div>
            <VChip
              :color="concession?.holder ? 'success' : 'warning'"
              size="small"
              variant="tonal"
            >
              {{ concession?.holder ? 'Asignado' : 'Pendiente' }}
            </VChip>
          </VCardTitle>

          <VCardText>
            <VList density="compact">
              <VListItem
                v-for="item in holderInfo"
                :key="item.title"
                class="px-0"
              >
                <template #prepend>
                  <VIcon
                    :icon="item.icon"
                    class="me-3"
                  />
                </template>

                <VListItemTitle class="font-weight-medium">
                  {{ item.title }}
                </VListItemTitle>

                <VListItemSubtitle>{{ item.value }}</VListItemSubtitle>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Route and Service Description -->
      <VCol
        v-if="concession?.routeDescription || concession?.authorizedServices?.length"
        cols="12"
      >
        <VCard variant="elevated">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-route
            </VIcon>
            Descripción de Servicios Autorizados
          </VCardTitle>

          <VCardText>
            <div
              v-if="concession.routeDescription"
              class="mb-4"
            >
              <div class="text-subtitle-2 font-weight-medium mb-2">
                Descripción de Ruta:
              </div>
              <p class="text-body-2 mb-0">
                {{ concession.routeDescription }}
              </p>
            </div>

            <div
              v-if="concession?.authorizedServices?.length"
              class="mb-4"
            >
              <div class="text-subtitle-2 font-weight-medium mb-3">
                <VIcon
                  class="me-2"
                  size="16"
                >
                  tabler-list-check
                </VIcon>
                Servicios Autorizados
              </div>

              <div class="d-flex flex-column gap-2">
                <VCard
                  v-for="service in concession.authorizedServices"
                  :key="service.id || service"
                  variant="tonal"
                  color="success"
                  class="pa-3"
                >
                  <div class="d-flex align-start">
                    <VIcon
                      class="me-3 mt-1"
                      color="success"
                      size="16"
                    >
                      tabler-check-circle
                    </VIcon>
                    <div class="flex-grow-1">
                      <div class="font-weight-bold text-success mb-1">
                        {{ getServiceField(service, 'label') || 'Servicio Autorizado' }}
                      </div>
                      <div
                        v-if="getServiceField(service, 'description')"
                        class="text-body-2 mb-2"
                      >
                        {{ getServiceField(service, 'description') }}
                      </div>
                      <div
                        v-if="getServiceField(service, 'value')"
                        class="text-caption font-weight-medium"
                      >
                        <span class="text-medium-emphasis">Valor:</span> {{ getServiceField(service, 'value') }}
                      </div>
                    </div>
                  </div>
                </VCard>
              </div>
            </div>

            <div v-if="concession?.restrictions?.length">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                <VIcon
                  class="me-2"
                  size="16"
                  color="warning"
                >
                  tabler-alert-triangle
                </VIcon>
                Restricciones Aplicadas
              </div>

              <div class="d-flex flex-column gap-2">
                <VCard
                  v-for="restriction in concession.restrictions"
                  :key="restriction.id || restriction"
                  variant="tonal"
                  color="warning"
                  class="pa-3"
                >
                  <div class="d-flex align-start">
                    <VIcon
                      class="me-3 mt-1"
                      color="warning"
                      size="16"
                    >
                      tabler-exclamation-circle
                    </VIcon>
                    <div class="flex-grow-1">
                      <div class="font-weight-bold text-warning mb-1">
                        {{ getRestrictionField(restriction, 'label') || 'Restricción Aplicada' }}
                      </div>
                      <div
                        v-if="getRestrictionField(restriction, 'description')"
                        class="text-body-2 mb-2"
                      >
                        {{ getRestrictionField(restriction, 'description') }}
                      </div>
                      <div
                        v-if="getRestrictionField(restriction, 'value')"
                        class="text-caption font-weight-medium"
                      >
                        <span class="text-medium-emphasis">Detalle:</span> {{ getRestrictionField(restriction, 'value') }}
                      </div>
                    </div>
                  </div>
                </VCard>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Legal Information -->
      <VCol
        v-if="concession?.termsConditions || concession?.resolutionNumber"
        cols="12"
      >
        <VCard variant="elevated">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-file-certificate
            </VIcon>
            Marco Legal y Normativo
          </VCardTitle>

          <VCardText>
            <VRow>
              <VCol
                v-if="concession.resolutionNumber"
                cols="12"
                md="6"
              >
                <div class="text-subtitle-2 font-weight-medium mb-2">
                  Número de Resolución:
                </div>
                <VChip
                  color="primary"
                  variant="outlined"
                  class="mb-2"
                >
                  <VIcon
                    start
                    size="12"
                  >
                    tabler-file-certificate
                  </VIcon>
                  {{ concession.resolutionNumber }}
                </VChip>
              </VCol>

              <VCol
                v-if="concession.legalFramework"
                cols="12"
                md="6"
              >
                <div class="text-subtitle-2 font-weight-medium mb-2">
                  Marco Normativo:
                </div>
                <div class="text-body-2">
                  {{ concession.legalFramework }}
                </div>
              </VCol>
            </VRow>

            <div
              v-if="concession.termsConditions"
              class="mt-4"
            >
              <div class="text-subtitle-2 font-weight-medium mb-2">
                Términos y Condiciones:
              </div>
              <p class="text-body-2 mb-0">
                {{ concession.termsConditions }}
              </p>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Administrative Notes and Observations -->
      <VCol
        v-if="concession?.notes || concession?.adminNotes"
        cols="12"
      >
        <VCard variant="elevated">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-notes
            </VIcon>
            Observaciones Administrativas
          </VCardTitle>

          <VCardText>
            <VAlert
              v-if="concession.adminNotes"
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <VAlertTitle>Notas Administrativas:</VAlertTitle>
              {{ concession.adminNotes }}
            </VAlert>

            <div v-if="concession.notes">
              <div class="text-subtitle-2 font-weight-medium mb-2">
                Observaciones Generales:
              </div>
              <p class="text-body-2 mb-0">
                {{ concession.notes }}
              </p>
            </div>

            <!-- Audit Trail -->
            <div
              v-if="concession.createdAt"
              class="mt-4"
            >
              <VDivider class="mb-3" />
              <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                <span>Creada el: {{ formatDate(concession.createdAt) }}</span>
                <span v-if="concession.updatedAt">Última actualización: {{ formatDate(concession.updatedAt) }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VCardText>
</template>

<style scoped>
.v-list-item {
  min-block-size: 48px;
}

.v-card--variant-tonal {
  transition: all 0.3s ease;
}

.v-card--variant-tonal:hover {
  box-shadow: 0 4px 12px rgba(var(--v-theme-on-surface), 0.1);
  transform: translateY(-2px);
}
</style>
