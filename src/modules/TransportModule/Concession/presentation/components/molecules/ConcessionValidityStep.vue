<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

// Props
interface Props {
  modelValue: {
    valid_from: string
    valid_to: string
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: { valid_from: string; valid_to: string }]
  validate: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()

// State
const localData = ref({
  valid_from: props.modelValue.valid_from,
  valid_to: props.modelValue.valid_to,
})

// Computed
const isValid = computed(() => {
  return !!(localData.value.valid_from && localData.value.valid_to
           && new Date(localData.value.valid_from) < new Date(localData.value.valid_to))
})

const validFromFormatted = computed(() => {
  if (!localData.value.valid_from)
    return ''

  return new Date(localData.value.valid_from).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const validToFormatted = computed(() => {
  if (!localData.value.valid_to)
    return ''

  return new Date(localData.value.valid_to).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
})

const durationInDays = computed(() => {
  if (!localData.value.valid_from || !localData.value.valid_to)
    return 0
  const from = new Date(localData.value.valid_from)
  const to = new Date(localData.value.valid_to)
  const diffTime = Math.abs(to.getTime() - from.getTime())

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const durationInYears = computed(() => {
  return Math.floor(durationInDays.value / 365)
})

const remainingDays = computed(() => {
  return durationInDays.value % 365
})

const dateValidationMessage = computed(() => {
  if (!localData.value.valid_from || !localData.value.valid_to)
    return 'Ambas fechas son requeridas'

  if (new Date(localData.value.valid_from) >= new Date(localData.value.valid_to))
    return 'La fecha de inicio debe ser anterior a la fecha de fin'

  return ''
})

// Methods
const setCommonPeriod = (years: number) => {
  const startDate = new Date()
  const endDate = new Date()

  endDate.setFullYear(startDate.getFullYear() + years)

  localData.value.valid_from = startDate.toISOString().split('T')[0]
  localData.value.valid_to = endDate.toISOString().split('T')[0]
}

const minDate = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const minToDate = computed(() => {
  if (!localData.value.valid_from)
    return minDate.value
  const fromDate = new Date(localData.value.valid_from)

  fromDate.setDate(fromDate.getDate() + 1)

  return fromDate.toISOString().split('T')[0]
})

// Watchers
watch(localData, newValue => {
  emit('update:modelValue', newValue)
}, { deep: true })

watch(isValid, newValue => {
  emit('validate', newValue)
}, { immediate: true })
</script>

<template>
  <div class="concession-validity-step">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-h5 mb-2">
        <VIcon
          icon="tabler-calendar"
          size="20"
          class="me-2"
          color="primary"
        />
        Fechas de Vigencia
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Define el periodo durante el cual la concesión será válida y operativa.
      </p>
    </div>

    <!-- Quick Selection -->
    <VCard
      variant="outlined"
      class="mb-6"
    >
      <VCardTitle class="text-h6">
        <VIcon
          icon="tabler-clock"
          class="me-2"
        />
        Periodos Comunes
      </VCardTitle>
      <VCardText>
        <p class="text-body-2 mb-4">
          Selecciona un periodo estándar o define fechas personalizadas.
        </p>
        <div class="d-flex flex-wrap gap-3">
          <VBtn
            variant="outlined"
            size="small"
            @click="setCommonPeriod(1)"
          >
            1 Año
          </VBtn>
          <VBtn
            variant="outlined"
            size="small"
            @click="setCommonPeriod(3)"
          >
            3 Años
          </VBtn>
          <VBtn
            variant="outlined"
            size="small"
            @click="setCommonPeriod(5)"
          >
            5 Años
          </VBtn>
          <VBtn
            variant="outlined"
            size="small"
            @click="setCommonPeriod(10)"
          >
            10 Años
          </VBtn>
          <VBtn
            variant="outlined"
            size="small"
            @click="setCommonPeriod(20)"
          >
            20 Años
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Date Selection -->
    <VRow>
      <!-- Start Date -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-calendar-event"
              class="me-2"
            />
            Fecha de Inicio
          </VCardTitle>
          <VCardText>
            <VTextField
              v-model="localData.valid_from"
              type="date"
              label="Fecha de Inicio *"
              :min="minDate"
              :rules="[v => !!v || 'La fecha de inicio es requerida']"
              required
              prepend-inner-icon="tabler-calendar-event"
              variant="outlined"
              hint="Fecha a partir de la cual la concesión será válida"
              persistent-hint
            />
          </VCardText>
        </VCard>
      </VCol>

      <!-- End Date -->
      <VCol
        cols="12"
        md="6"
      >
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="tabler-calendar-x"
              class="me-2"
            />
            Fecha de Vencimiento
          </VCardTitle>
          <VCardText>
            <VTextField
              v-model="localData.valid_to"
              type="date"
              label="Fecha de Vencimiento *"
              :min="minToDate"
              :rules="[v => !!v || 'La fecha de vencimiento es requerida']"
              required
              prepend-inner-icon="tabler-calendar-x"
              variant="outlined"
              hint="Fecha en la que vence la concesión"
              persistent-hint
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Duration Info -->
    <VCard
      v-if="isValid"
      variant="outlined"
      color="info"
      class="mb-6"
    >
      <VCardTitle class="text-info">
        <VIcon
          icon="tabler-hourglass"
          class="me-2"
        />
        Duración de la Concesión
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-center">
              <div class="text-h4 text-info mb-2">
                {{ durationInDays }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Días totales
              </div>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-center">
              <div class="text-h4 text-info mb-2">
                {{ durationInYears }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Años completos
              </div>
            </div>
          </VCol>
          <VCol
            cols="12"
            md="4"
          >
            <div class="text-center">
              <div class="text-h4 text-info mb-2">
                {{ remainingDays }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Días adicionales
              </div>
            </div>
          </VCol>
        </VRow>
      </VCardText>
    </VCard>

    <!-- Preview Section -->
    <VCard
      v-if="isValid"
      variant="outlined"
      color="success"
      class="mb-6"
    >
      <VCardTitle class="text-success">
        <VIcon
          icon="tabler-check-circle"
          class="me-2"
        />
        Vista Previa del Periodo
      </VCardTitle>
      <VCardText>
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Inicia
            </div>
            <div class="text-h6 mb-3">
              {{ validFromFormatted }}
            </div>
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <div class="text-caption text-medium-emphasis">
              Vence
            </div>
            <div class="text-h6 mb-3">
              {{ validToFormatted }}
            </div>
          </VCol>
          <VCol cols="12">
            <VTimeline
              direction="horizontal"
              density="compact"
              class="mt-4"
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

    <!-- Important Notes -->
    <VCard
      variant="outlined"
      color="warning"
      class="mb-6"
    >
      <VCardTitle class="text-warning">
        <VIcon
          icon="tabler-alert-triangle"
          class="me-2"
        />
        Consideraciones Importantes
      </VCardTitle>
      <VCardText>
        <VList>
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-circle-check"
                color="warning"
                size="20"
              />
            </template>
            <VListItemTitle>
              La concesión será válida únicamente durante el periodo especificado
            </VListItemTitle>
          </VListItem>
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-circle-check"
                color="warning"
                size="20"
              />
            </template>
            <VListItemTitle>
              Se recomienda renovar la concesión antes de su vencimiento
            </VListItemTitle>
          </VListItem>
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-circle-check"
                color="warning"
                size="20"
              />
            </template>
            <VListItemTitle>
              Las fechas no podrán modificarse una vez creada la concesión
            </VListItemTitle>
          </VListItem>
          <VListItem>
            <template #prepend>
              <VIcon
                icon="tabler-circle-check"
                color="warning"
                size="20"
              />
            </template>
            <VListItemTitle>
              Los periodos más comunes son de 5 a 20 años
            </VListItemTitle>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>

    <!-- Validation Status -->
    <VAlert
      v-if="!isValid"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle>Fechas Requeridas</VAlertTitle>
      {{ dateValidationMessage }}
    </VAlert>

    <VAlert
      v-else
      type="success"
      variant="tonal"
      class="mb-4"
    >
      <VAlertTitle>¡Periodo Válido!</VAlertTitle>
      El periodo de vigencia está correctamente definido ({{ durationInYears }} años y {{ remainingDays }} días).
    </VAlert>
  </div>
</template>

<style scoped>
.concession-validity-step {
  max-width: 1000px;
}
</style>
