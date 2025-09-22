<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConcessionHolderStore } from '../../../../ConcessionHolder/presentation/stores/concessionholderStore'
import type { ConcessionWizardData } from '../../stores/concessionWizardStore'

// Props
interface Props {
  concessionData: ConcessionWizardData
  validValues: {
    modalities?: Record<string, string>
    statuses?: Record<string, string>
    [key: string]: any
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  submit: []
  cancel: []
}>()

// Composables
const { t } = useI18n()
const concessionHolderStore = useConcessionHolderStore()

// State
const isSubmitting = ref(false)

// Computed
const selectedHolder = computed(() => {
  return concessionHolderStore.items.find(holder => holder.id === props.concessionData.holder_id)
})

const modalityLabel = computed(() => {
  return props.validValues.modalities?.[props.concessionData.modality] || props.concessionData.modality
})

const statusLabel = computed(() => {
  return props.validValues.statuses?.[props.concessionData.status || 'PENDING'] || props.concessionData.status
})

const validFromFormatted = computed(() => {
  return new Date(props.concessionData.valid_from).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const validToFormatted = computed(() => {
  return new Date(props.concessionData.valid_to).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const durationInDays = computed(() => {
  const from = new Date(props.concessionData.valid_from)
  const to = new Date(props.concessionData.valid_to)
  const diffTime = Math.abs(to.getTime() - from.getTime())

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const durationInYears = computed(() => {
  return Math.floor(durationInDays.value / 365)
})

const servicesByCategory = computed(() => {
  const grouped: Record<string, any[]> = {}

  props.concessionData.authorized_services?.forEach(service => {
    if (!grouped[service.category])
      grouped[service.category] = []

    grouped[service.category].push(service)
  })

  return grouped
})

const hasRequiredData = computed(() => {
  return !!(
    props.concessionData.holder_id
    && props.concessionData.number
    && props.concessionData.modality
    && props.concessionData.municipality
    && props.concessionData.valid_from
    && props.concessionData.valid_to
  )
})

// Methods
const handleSubmit = () => {
  if (!hasRequiredData.value || isSubmitting.value)
    return

  isSubmitting.value = true
  emit('submit')
}

const handleCancel = () => {
  emit('cancel')
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    GENERAL: 'primary',
    URBAN: 'success',
    SUBURBAN: 'info',
    INTERCITY: 'warning',
    TOURIST: 'purple',
    SCHOOL: 'orange',
    SPECIAL: 'error',
  }

  return colors[category] || 'primary'
}

const getStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    ACTIVE: 'success',
    PENDING: 'warning',
    SUSPENDED: 'error',
    EXPIRED: 'error',
  }

  return colors[status || 'PENDING'] || 'default'
}

// Initialize
onMounted(async () => {
  // Ensure holder data is loaded
  if (concessionHolderStore.items.length === 0)
    await concessionHolderStore.fetchList()
})
</script>

<template>
  <div class="concession-summary-step">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-h5 mb-2">
        <VIcon
          icon="tabler-check"
          size="20"
          class="me-2"
          color="primary"
        />
        Resumen de la Concesión
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Revisa toda la información antes de crear la concesión. Una vez creada, algunos datos no podrán modificarse.
      </p>
    </div>

    <!-- Main Summary Card -->
    <VCard
      variant="outlined"
      color="success"
      class="mb-6"
    >
      <VCardTitle class="text-success">
        <VIcon
          icon="tabler-certificate"
          class="me-2"
        />
        {{ concessionData.number }}
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Modalidad
            </div>
            <div class="text-h6 mb-3">
              {{ modalityLabel }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Estado
            </div>
            <VChip
              :color="getStatusColor(concessionData.status)"
              size="small"
              class="mb-3"
            >
              {{ statusLabel }}
            </VChip>
          </VCol>
          <VCol cols="12">
            <div class="text-caption text-medium-emphasis">
              Municipio de Operación
            </div>
            <div class="text-h6">
              {{ concessionData.municipality }}
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Holder Information -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle>
        <VIcon
          icon="tabler-user"
          class="me-2"
        />
        Titular de la Concesión
      </VCardTitle>
      <VCardText>
        <div
          v-if="selectedHolder"
          class="d-flex align-center"
        >
          <VAvatar
            size="64"
            color="primary"
            variant="tonal"
            class="me-4"
          >
            <VIcon size="32">
              {{ selectedHolder.holderType === 'NATURAL' ? 'tabler-user' : 'tabler-building' }}
            </VIcon>
          </VAvatar>
          <div>
            <h3 class="text-h6 mb-1">
              {{ selectedHolder.fullName }}
            </h3>
            <div class="d-flex flex-wrap gap-2 mb-2">
              <VChip
                size="small"
                color="info"
                variant="tonal"
              >
                {{ selectedHolder.holderType === 'NATURAL' ? 'Persona Física' : 'Persona Moral' }}
              </VChip>
              <VChip
                size="small"
                color="primary"
                variant="tonal"
              >
                {{ selectedHolder.identificationNumber }}
              </VChip>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-0">
              ID: {{ selectedHolder.id }}
            </p>
          </div>
        </div>
        <VAlert
          v-else
          type="warning"
          variant="tonal"
        >
          No se pudo cargar la información del titular
        </VAlert>
      </VCardText>
    </VCard>

    <!-- Location and Service Area -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle>
        <VIcon
          icon="tabler-map-pin"
          class="me-2"
        />
        Ubicación y Área de Servicio
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Municipio
            </div>
            <div class="text-h6 mb-3">
              {{ concessionData.municipality }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Descripción del Área
            </div>
            <VChip
              :color="concessionData.route_or_site ? 'success' : 'warning'"
              size="small"
              class="mb-3"
            >
              {{ concessionData.route_or_site ? 'Descrita' : 'Sin descripción' }}
            </VChip>
          </VCol>
          <VCol
            v-if="concessionData.route_or_site"
            cols="12"
          >
            <div class="text-caption text-medium-emphasis mb-2">
              Descripción de Ruta/Sitio
            </div>
            <div class="text-body-2 pa-3 bg-surface-variant rounded">
              {{ concessionData.route_or_site }}
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Validity Period -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle>
        <VIcon
          icon="tabler-calendar"
          class="me-2"
        />
        Periodo de Vigencia
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-medium-emphasis">
              Fecha de Inicio
            </div>
            <div class="text-h6 mb-3">
              {{ validFromFormatted }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-medium-emphasis">
              Fecha de Vencimiento
            </div>
            <div class="text-h6 mb-3">
              {{ validToFormatted }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-caption text-medium-emphasis">
              Duración
            </div>
            <div class="text-h6 mb-3">
              {{ durationInYears }} años
            </div>
          </VCol>
          <VCol cols="12">
            <VTimeline
              direction="horizontal"
              density="compact"
            >
              <VTimelineItem
                dot-color="success"
                size="small"
              >
                <div class="text-caption">
                  Inicio
                </div>
                <div class="text-body-2">
                  {{ validFromFormatted }}
                </div>
              </VTimelineItem>
              <VTimelineItem
                dot-color="warning"
                size="small"
              >
                <div class="text-caption">
                  Vencimiento
                </div>
                <div class="text-body-2">
                  {{ validToFormatted }}
                </div>
              </VTimelineItem>
            </VTimeline>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Authorized Services -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle>
        <VIcon
          icon="tabler-list-check"
          class="me-2"
        />
        Servicios Autorizados
        <VChip
          v-if="concessionData.authorized_services?.length"
          size="small"
          color="primary"
          class="ms-2"
        >
          {{ concessionData.authorized_services.length }}
        </VChip>
      </VCardTitle>
      <VCardText>
        <div v-if="concessionData.authorized_services?.length">
          <div
            v-for="(services, category) in servicesByCategory"
            :key="category"
            class="mb-4"
          >
            <h4 class="text-subtitle-1 mb-2 d-flex align-center">
              <VChip
                :color="getCategoryColor(category)"
                size="small"
                variant="tonal"
                class="me-2"
              >
                {{ category }}
              </VChip>
              ({{ services.length }})
            </h4>
            <VRow>
              <VCol
                v-for="service in services"
                :key="service.code"
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  :color="getCategoryColor(service.category)"
                  density="compact"
                >
                  <VCardText class="pa-3">
                    <VChip
                      :color="getCategoryColor(service.category)"
                      size="x-small"
                      variant="flat"
                      class="mb-2"
                    >
                      {{ $t(service.code) }}
                    </VChip>
                    <p class="text-body-2 mb-0">
                      {{ service.description }}
                    </p>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </div>
        </div>
        <VAlert
          v-else
          type="info"
          variant="tonal"
        >
          <VAlertTitle>Servicios Generales</VAlertTitle>
          No se han definido servicios específicos. La concesión operará bajo los servicios generales de la modalidad {{ modalityLabel }}.
        </VAlert>
      </VCardText>
    </VCard>

    <!-- Restrictions -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle>
        <VIcon
          icon="tabler-alert-octagon"
          class="me-2"
        />
        Restricciones Operativas
        <VChip
          v-if="concessionData.restrictions?.length"
          size="small"
          color="warning"
          class="ms-2"
        >
          {{ concessionData.restrictions.length }}
        </VChip>
      </VCardTitle>
      <VCardText>
        <div v-if="concessionData.restrictions?.length">
          <VRow>
            <VCol
              v-for="restriction in concessionData.restrictions"
              :key="restriction.code"
              cols="12"
              md="6"
            >
              <VCard
                variant="tonal"
                color="warning"
                density="compact"
              >
                <VCardText class="pa-3">
                  <VChip
                    color="warning"
                    size="x-small"
                    variant="flat"
                    class="mb-2"
                  >
                    {{ $t(restriction.code) }}
                  </VChip>
                  <h5 class="text-subtitle-2 mb-1">
                    {{ restriction.description }}:
                  </h5>
                  <p class="text-body-2 mb-0">
                    <!-- <strong>{{ restriction.label }}:</strong>  -->
                    {{ restriction.value }}
                  </p>
                </VCardText>
              </VCard>
            </VCol>
          </VRow>
        </div>
        <VAlert
          v-else
          type="info"
          variant="tonal"
        >
          <VAlertTitle>Sin Restricciones Específicas</VAlertTitle>
          No se han definido restricciones operativas específicas. La concesión operará bajo las regulaciones generales aplicables.
        </VAlert>
      </VCardText>
    </VCard>

    <!-- Validation Status -->
    <VAlert
      v-if="!hasRequiredData"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      <VAlertTitle>Información Incompleta</VAlertTitle>
      Faltan datos requeridos para crear la concesión. Revisa los pasos anteriores.
    </VAlert>

    <VAlert
      v-else
      type="success"
      variant="tonal"
      class="mb-6"
    >
      <VAlertTitle>¡Listo para Crear!</VAlertTitle>
      Todos los datos requeridos están completos. Puedes proceder a crear la concesión.
    </VAlert>

    <!-- Important Notice -->
    <VCard
      variant="outlined"
      color="warning"
      class="mt-6"
    >
      <VCardTitle class="text-warning">
        <VIcon
          icon="tabler-info-circle"
          class="me-2"
        />
        Aviso Importante
      </VCardTitle>
      <VCardText>
        <VList>
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-alert-circle"
                color="warning"
                size="20"
              />
            </template>
            <VListItemTitle>
              Una vez creada, algunos datos como el número y fechas de vigencia no podrán modificarse
            </VListItemTitle>
          </VListItem>
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-alert-circle"
                color="warning"
                size="20"
              />
            </template>
            <VListItemTitle>
              La concesión quedará en estado "{{ statusLabel }}" hasta su activación
            </VListItemTitle>
          </VListItem>
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-alert-circle"
                color="warning"
                size="20"
              />
            </template>
            <VListItemTitle>
              Asegúrate de que toda la información sea correcta antes de continuar
            </VListItemTitle>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.concession-summary-step {
  max-inline-size: 1000px;
}
</style>
