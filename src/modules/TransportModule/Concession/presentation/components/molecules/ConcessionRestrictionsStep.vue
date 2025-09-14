<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RestrictionItem } from '../../../application/dtos/ConcessionDtos'

// Props
interface Props {
  restrictions: RestrictionItem[]
  validValues: {
    restrictions?: Record<string, any>
    [key: string]: any
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:restrictions': [restrictions: RestrictionItem[]]
  validate: [isValid: boolean]
}>()

// Composables
const { t } = useI18n()

// State
const selectedRestrictions = ref<Record<string, any>>({})
const customValues = ref<Record<string, string>>({})
const customRestrictions = ref<Array<{code: string, title: string, value: string}>>([])
const customRestrictionForm = ref({
  title: '',
  value: ''
})
const showCustomDialog = ref(false)

// Initialize from props
props.restrictions.forEach(restriction => {
  selectedRestrictions.value[restriction.code] = true
  customValues.value[restriction.code] = restriction.value
})

// Available restrictions from API
const availableRestrictions = computed(() => {
  const restrictions = props.validValues.restrictions || {}
  return Object.entries(restrictions).map(([code, restriction]: [string, any]) => ({
    code,
    title: restriction.description || restriction.label || code,
    description: restriction.description || '',
    options: restriction.options || {},
    allowCustom: restriction.allowCustom || false,
    required: restriction.required || false,
  }))
})

// Computed
const isValid = computed(() => true) // Optional step
const hasSelectedRestrictions = computed(() =>
  Object.values(selectedRestrictions.value).some(Boolean) || customRestrictions.value.length > 0
)

const selectedCount = computed(() =>
  Object.values(selectedRestrictions.value).filter(Boolean).length + customRestrictions.value.length
)

// Methods
const toggleRestriction = (code: string) => {
  if (selectedRestrictions.value[code]) {
    selectedRestrictions.value[code] = false
    delete customValues.value[code]
  } else {
    selectedRestrictions.value[code] = true
    // Set default value if available
    const restriction = availableRestrictions.value.find(r => r.code === code)
    const defaultOption = Object.keys(restriction?.options || {})[0]
    if (defaultOption) {
      customValues.value[code] = defaultOption
    }
  }
}

const selectAll = () => {
  availableRestrictions.value.forEach(restriction => {
    selectedRestrictions.value[restriction.code] = true
    if (!customValues.value[restriction.code]) {
      const defaultOption = Object.keys(restriction.options)[0]
      if (defaultOption) {
        customValues.value[restriction.code] = defaultOption
      }
    }
  })
}

const clearAll = () => {
  selectedRestrictions.value = {}
  customValues.value = {}
  customRestrictions.value = []
}

const openCustomDialog = () => {
  customRestrictionForm.value = {
    title: '',
    value: ''
  }
  showCustomDialog.value = true
}

const saveCustomRestriction = () => {
  if (!customRestrictionForm.value.title.trim()) return

  const customCode = `CUSTOM_${Date.now()}`
  customRestrictions.value.push({
    code: customCode,
    title: customRestrictionForm.value.title,
    value: customRestrictionForm.value.value
  })

  showCustomDialog.value = false
}

const removeCustomRestriction = (index: number) => {
  customRestrictions.value.splice(index, 1)
}

const getRestrictionIcon = (code: string) => {
  const icons: Record<string, string> = {
    'MAX_PASSENGERS': 'tabler-users',
    'SCHEDULE_RESTRICTION': 'tabler-clock',
    'ROUTE_LIMITATION': 'tabler-map-pin',
    'VEHICLE_TYPE': 'tabler-car',
    'SPEED_LIMIT': 'tabler-speed',
    'LOAD_CAPACITY': 'tabler-weight',
    'ZONE_RESTRICTION': 'tabler-map-2',
    'TIME_LIMIT': 'tabler-hourglass',
  }
  return icons[code] || 'tabler-alert-circle'
}

// Watchers
watch([selectedRestrictions, customValues, customRestrictions], () => {
  // Standard restrictions
  const standardRestrictions = Object.entries(selectedRestrictions.value)
    .filter(([_, selected]) => selected)
    .map(([code, _]) => {
      const restriction = availableRestrictions.value.find(r => r.code === code)
      let value = customValues.value[code] || ''

      // Handle "Others" option with custom value
      if (value === 'OTHERS' && customValues.value[code + '_custom']) {
        value = customValues.value[code + '_custom']
      }

      const options = restriction?.options || {}
      const valueLabel = value === 'OTHERS' ? customValues.value[code + '_custom'] : (options[value] || value)

      return {
        code,
        description: restriction?.title || code,
        value,
        label: restriction?.title || code
      }
    })

  // Custom restrictions
  const customRestrictionsFormatted = customRestrictions.value.map(custom => ({
    code: custom.code,
    description: custom.title,
    value: custom.value,
    label: custom.title
  }))

  const allRestrictions = [...standardRestrictions, ...customRestrictionsFormatted]
  emit('update:restrictions', allRestrictions)
}, { deep: true, immediate: true })

watch(isValid, (newValue) => {
  emit('validate', newValue)
}, { immediate: true })
</script>

<template>
  <div class="concession-restrictions-step">
    <!-- Header -->
    <div class="mb-4">
      <h2 class="text-h6 mb-1 d-flex align-center">
        <VIcon
          icon="tabler-alert-circle"
          size="18"
          class="me-2"
          color="warning"
        />
        Restricciones Operativas
      </h2>
      <p class="text-body-2 text-medium-emphasis">
        Define las limitaciones y restricciones específicas para esta concesión (opcional)
      </p>
    </div>

    <!-- Quick Actions -->
    <VCard
      variant="outlined"
      class="mb-3"
    >
      <VCardText class="pa-3">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <div class="d-flex align-center gap-3 flex-wrap">
            <VBtn
              color="warning"
              variant="outlined"
              size="small"
              @click="selectAll"
            >
              <VIcon
                icon="tabler-check"
                size="14"
                start
              />
              Seleccionar todas
            </VBtn>
            <VBtn
              color="primary"
              variant="outlined"
              size="small"
              @click="openCustomDialog"
            >
              <VIcon
                icon="tabler-plus"
                size="14"
                start
              />
              Agregar personalizada
            </VBtn>
            <VDivider vertical />
            <div class="text-caption text-medium-emphasis">
              {{ selectedCount }} restricciones totales
            </div>
          </div>

          <VBtn
            v-if="hasSelectedRestrictions"
            color="secondary"
            variant="text"
            size="small"
            @click="clearAll"
          >
            <VIcon
              icon="tabler-x"
              size="14"
              start
            />
            Limpiar todo
          </VBtn>
        </div>
      </VCardText>
    </VCard>

    <!-- Restrictions List -->
    <div v-if="availableRestrictions.length > 0">
      <div
        v-for="restriction in availableRestrictions"
        :key="restriction.code"
        class="mb-3"
      >
        <VCard
          variant="outlined"
          :color="selectedRestrictions[restriction.code] ? 'warning' : undefined"
          :class="{ 'restriction-selected': selectedRestrictions[restriction.code] }"
        >
          <VCardTitle class="text-subtitle-1 pa-3 pb-2 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <VCheckbox
                :model-value="selectedRestrictions[restriction.code]"
                density="compact"
                hide-details
                @click="toggleRestriction(restriction.code)"
              />
              <VIcon
                :icon="getRestrictionIcon(restriction.code)"
                size="16"
                class="me-2"
                :color="selectedRestrictions[restriction.code] ? 'warning' : 'default'"
              />
              <span>{{ restriction.title }}</span>
              <VChip
                v-if="restriction.required"
                color="error"
                size="x-small"
                variant="flat"
                class="ms-2"
              >
                Requerido
              </VChip>
            </div>
          </VCardTitle>

          <!-- Restriction Value Selector -->
          <VCardText
            v-if="selectedRestrictions[restriction.code]"
            class="pt-0 pb-3"
          >
            <!-- Predefined options -->
            <div v-if="Object.keys(restriction.options).length > 0">
              <VSelect
                v-model="customValues[restriction.code]"
                :items="[
                  ...Object.entries(restriction.options).map(([value, label]) => ({ title: label, value })),
                  { title: 'Otros', value: 'OTHERS' }
                ]"
                label="Selecciona un valor"
                variant="outlined"
                density="compact"
                hide-details
              />

              <!-- Custom input when Others is selected -->
              <VTextField
                v-if="customValues[restriction.code] === 'OTHERS'"
                v-model="customValues[restriction.code + '_custom']"
                label="Especifica el valor personalizado"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="Ingresa el valor personalizado"
                class="mt-2"
              />
            </div>

            <!-- Custom input -->
            <div v-else-if="restriction.allowCustom">
              <VTextField
                v-model="customValues[restriction.code]"
                label="Especifica el valor"
                variant="outlined"
                density="compact"
                hide-details
                placeholder="Ingresa un valor personalizado"
              />
            </div>

            <!-- Default text input -->
            <div v-else>
              <VTextField
                v-model="customValues[restriction.code]"
                label="Valor de la restricción"
                variant="outlined"
                density="compact"
                hide-details
              />
            </div>

            <!-- Helper text -->
            <div
              v-if="restriction.description"
              class="text-caption text-medium-emphasis mt-2"
            >
              {{ restriction.description }}
            </div>
          </VCardText>
        </VCard>
      </div>
    </div>

    <!-- Custom Restrictions Section -->
    <div v-if="customRestrictions.length > 0" class="mb-3">
      <VCard
        variant="outlined"
        color="primary"
      >
        <VCardTitle class="text-subtitle-1 pa-3 pb-2 text-primary">
          <VIcon
            icon="tabler-edit"
            size="16"
            class="me-2"
          />
          Restricciones Personalizadas ({{ customRestrictions.length }})
        </VCardTitle>
        <VCardText class="pt-0 pb-3">
          <VList density="compact">
            <VListItem
              v-for="(restriction, index) in customRestrictions"
              :key="restriction.code"
            >
              <template #prepend>
                <VIcon
                  icon="tabler-edit"
                  size="16"
                  color="primary"
                />
              </template>
              <VListItemTitle>{{ restriction.title }}</VListItemTitle>
              <VListItemSubtitle v-if="restriction.value">
                Valor: {{ restriction.value }}
              </VListItemSubtitle>
              <template #append>
                <VBtn
                  icon="tabler-trash"
                  size="x-small"
                  variant="text"
                  color="error"
                  @click="removeCustomRestriction(index)"
                />
              </template>
            </VListItem>
          </VList>
        </VCardText>
      </VCard>
    </div>

    <!-- No restrictions available -->
    <VAlert
      v-if="availableRestrictions.length === 0"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <VAlertTitle>No hay restricciones específicas disponibles</VAlertTitle>
      Se aplicarán las regulaciones generales. Puedes agregar restricciones personalizadas si es necesario.
    </VAlert>

    <!-- Summary -->
    <VAlert
      type="success"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      <VAlertTitle>Configuración Completada</VAlertTitle>
      <div v-if="hasSelectedRestrictions">
        Has configurado {{ selectedCount }} restricción(es) operativa(s).
      </div>
      <div v-else>
        Sin restricciones específicas. Se aplicarán las regulaciones generales.
      </div>
    </VAlert>

    <!-- Selected Restrictions Preview -->
    <VCard
      v-if="hasSelectedRestrictions"
      variant="outlined"
      color="warning"
      class="mb-3"
    >
      <VCardTitle class="text-subtitle-1 pa-3 pb-1 text-warning">
        <VIcon
          icon="tabler-eye"
          size="16"
          class="me-2"
        />
        Restricciones Seleccionadas
      </VCardTitle>
      <VCardText class="pt-1 pb-3">
        <VList density="compact">
          <!-- Standard restrictions -->
          <VListItem
            v-for="[code, selected] in Object.entries(selectedRestrictions).filter(([_, selected]) => selected)"
            :key="code"
            class="px-0"
          >
            <template #prepend>
              <VIcon
                :icon="getRestrictionIcon(code)"
                size="16"
                color="warning"
              />
            </template>
            <VListItemTitle>
              {{ availableRestrictions.find(r => r.code === code)?.title }}
            </VListItemTitle>
            <VListItemSubtitle v-if="customValues[code]">
              Valor: {{
                customValues[code] === 'OTHERS' && customValues[code + '_custom']
                  ? customValues[code + '_custom']
                  : customValues[code]
              }}
            </VListItemSubtitle>
          </VListItem>

          <!-- Custom restrictions -->
          <VListItem
            v-for="restriction in customRestrictions"
            :key="restriction.code"
            class="px-0"
          >
            <template #prepend>
              <VIcon
                icon="tabler-edit"
                size="16"
                color="primary"
              />
            </template>
            <VListItemTitle>
              {{ restriction.title }}
              <VChip
                color="primary"
                size="x-small"
                variant="flat"
                class="ms-2"
              >
                Personalizada
              </VChip>
            </VListItemTitle>
            <VListItemSubtitle v-if="restriction.value">
              Valor: {{ restriction.value }}
            </VListItemSubtitle>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>

    <!-- Custom Restriction Dialog -->
    <VDialog
      v-model="showCustomDialog"
      max-width="500"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center">
          <VIcon
            icon="tabler-plus"
            size="20"
            class="me-2"
            color="primary"
          />
          Agregar Restricción Personalizada
        </VCardTitle>

        <VCardText>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Define una restricción específica que no esté en la lista predefinida.
          </p>

          <VForm>
            <VTextField
              v-model="customRestrictionForm.title"
              label="Nombre de la restricción *"
              placeholder="Ej: Horario nocturno prohibido"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'El nombre es requerido']"
              class="mb-4"
            />

            <VTextField
              v-model="customRestrictionForm.value"
              label="Valor o descripción"
              placeholder="Ej: De 22:00 a 06:00 hrs"
              variant="outlined"
              density="comfortable"
              hint="Especifica el valor o detalle de la restricción"
              persistent-hint
            />
          </VForm>
        </VCardText>

        <VCardActions class="px-6 pb-4">
          <VSpacer />
          <VBtn
            color="secondary"
            variant="text"
            @click="showCustomDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            :disabled="!customRestrictionForm.title.trim()"
            @click="saveCustomRestriction"
          >
            <VIcon
              icon="tabler-check"
              size="16"
              start
            />
            Agregar Restricción
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.concession-restrictions-step {
  max-width: 1000px;
}

.restriction-selected {
  border-width: 2px;
}
</style>