<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useConcessionStore } from '../../stores/concessionStore'
import { useConcessionWizardStore } from '../../stores/concessionWizardStore'

// Step components
import ConcessionHolderStep from '../molecules/ConcessionHolderStep.vue'
import ConcessionBasicInfoStep from '../molecules/ConcessionBasicInfoStep.vue'
import ConcessionLocationStep from '../molecules/ConcessionLocationStep.vue'
import ConcessionValidityStep from '../molecules/ConcessionValidityStep.vue'
import ConcessionServicesStep from '../molecules/ConcessionServicesStep.vue'
import ConcessionRestrictionsStep from '../molecules/ConcessionRestrictionsStep.vue'
import ConcessionSummaryStep from '../molecules/ConcessionSummaryStep.vue'

// Props
interface Props {
  concessionId?: string
}

const props = withDefaults(defineProps<Props>(), {
  concessionId: undefined,
})

// Emits
const emit = defineEmits<{
  submit: [data: any]
  cancel: []
}>()

// Composables
const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const concessionStore = useConcessionStore()
const wizardStore = useConcessionWizardStore()

// State
const loading = ref(false)
const isTransitioning = ref(false)

// Detect edit mode
const isEdit = computed(() => !!route.params.id)

// Steps configuration
const steps = [
  {
    title: 'Titular',
    subtitle: 'Responsable',
    icon: 'tabler-user',
  },
  {
    title: 'Información',
    subtitle: 'Datos básicos',
    icon: 'tabler-info-circle',
  },
  {
    title: 'Ubicación',
    subtitle: 'Área operación',
    icon: 'tabler-map-pin',
  },
  {
    title: 'Vigencia',
    subtitle: 'Fechas validez',
    icon: 'tabler-calendar',
  },
  {
    title: 'Servicios',
    subtitle: 'Autorizados',
    icon: 'tabler-list-check',
  },
  {
    title: 'Restricciones',
    subtitle: 'Operativas',
    icon: 'tabler-alert-circle',
  },
  {
    title: 'Resumen',
    subtitle: 'Confirmar datos',
    icon: 'tabler-check',
  },
]

// Computed
const currentStep = computed(() => wizardStore.currentStep)
const isFirstStep = computed(() => currentStep.value === 0)
const isLastStep = computed(() => currentStep.value === steps.length - 1)

const canProceedToNextStep = computed(() => {
  return wizardStore.stepValidations[currentStep.value] === true
})

const stepStates = computed(() => {
  return steps.map((_, idx) => {
    if (idx < currentStep.value) {
      return wizardStore.stepValidations[idx] ? 'completed' : 'incomplete'
    } else if (idx === currentStep.value) {
      return 'active'
    } else {
      return 'pending'
    }
  })
})

const headerTitle = computed(() =>
  isEdit.value
    ? `Editar Concesión${wizardStore.wizardData.number ? `: ${wizardStore.wizardData.number}` : ''}`
    : 'Crear Concesión'
)

// Methods
const navigateToStep = async (stepIdx: number) => {
  if (typeof stepIdx !== 'number' || stepIdx < 0 || stepIdx >= steps.length) {
    console.warn('❌ Invalid step navigation:', { stepIdx, currentStep: currentStep.value })
    return
  }

  if (isTransitioning.value) {
    console.warn('❌ Navigation blocked: transition in progress')
    return
  }

  // Check if we can navigate to this step
  if (!wizardStore.canNavigateToStep(stepIdx)) {
    console.warn(`❌ Cannot navigate to step ${stepIdx}: previous steps not completed`)
    return
  }

  isTransitioning.value = true
  try {
    wizardStore.setCurrentStep(stepIdx)
    console.log('✅ Navigation successful to step:', stepIdx)
  } catch (error) {
    console.error('❌ Navigation error:', error)
  } finally {
    await nextTick()
    isTransitioning.value = false
  }
}

const nextStep = () => {
  if (canProceedToNextStep.value && !isLastStep.value) {
    wizardStore.nextStep()
  }
}

const previousStep = () => {
  if (!isFirstStep.value) {
    wizardStore.previousStep()
  }
}

const handleSubmit = async () => {
  try {
    if (isTransitioning.value) {
      console.warn('❌ Submit blocked: transition in progress')
      return
    }

    loading.value = true

    console.log('🚀 Submitting concession data:', wizardStore.wizardData)

    if (isEdit.value) {
      await concessionStore.updateItem(route.params.id as string, wizardStore.wizardData)
    } else {
      await concessionStore.createItem(wizardStore.wizardData)
    }

    // Clear draft after successful submission
    wizardStore.clearDraft(wizardStore.wizardData.holder_id)

    emit('submit', wizardStore.wizardData)
    await router.push('/concessions')
  } catch (error) {
    console.error('❌ Submit error:', error)
    // Show error message (could use global snackbar here)
  } finally {
    loading.value = false
  }
}

const handleCancel = async () => {
  emit('cancel')
  await router.push('/concessions')
}

// Validation handlers for each step
const handleStepValidation = (stepIndex: number, isValid: boolean) => {
  wizardStore.stepValidations[stepIndex] = isValid
}

// Initialize wizard
const initializeWizard = async () => {
  try {
    // Load valid values for services and restrictions
    await concessionStore.fetchValidValues()

    // Initialize wizard
    wizardStore.initializeWizard(isEdit.value, props.concessionId)

    return true
  } catch (error) {
    console.error('Error initializing wizard:', error)
    return false
  }
}

// Lifecycle
onMounted(async () => {
  loading.value = true
  try {
    await initializeWizard()

    if (isEdit.value && route.params.id) {
      // Load existing concession data
      await concessionStore.fetchById(route.params.id as string)
      // TODO: Map store data to wizard data
    }

    await nextTick()
  } catch (error) {
    console.error('❌ Error during wizard initialization:', error)
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  isTransitioning.value = false
})
</script>

<template>
  <VCard>
    <!-- Loading Overlay -->
    <VOverlay
      v-model="loading"
      class="align-center justify-center"
    >
      <VProgressCircular
        indeterminate
        size="64"
      />
    </VOverlay>

    <!-- Header -->
    <VCardTitle class="pa-4 border-b">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h5 mb-1">
            {{ headerTitle }}
          </h1>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ steps[currentStep]?.subtitle }}
          </p>
        </div>

        <!-- Progress indicator -->
        <div class="text-center" v-if="$vuetify.display.mdAndUp">
          <VCircularProgress
            :model-value="wizardStore.progress"
            size="48"
            width="3"
            color="primary"
          >
            <span class="text-caption font-weight-medium">{{ Math.round(wizardStore.progress) }}%</span>
          </VCircularProgress>
        </div>
      </div>
    </VCardTitle>

    <!-- Mobile Progress Bar -->
    <div v-if="$vuetify.display.smAndDown" class="px-4 py-3 border-b">
      <VProgressLinear
        :model-value="wizardStore.progress"
        color="primary"
        height="4"
        rounded
        class="mb-2"
      />
      <div class="d-flex justify-space-between align-center">
        <div>
          <div class="text-subtitle-2">{{ steps[currentStep]?.title }}</div>
          <div class="text-caption text-medium-emphasis">Paso {{ currentStep + 1 }} de {{ steps.length }}</div>
        </div>
        <VChip
          color="primary"
          size="x-small"
          variant="tonal"
        >
          {{ Math.round(wizardStore.progress) }}%
        </VChip>
      </div>
    </div>

    <VRow no-gutters>
      <!-- Desktop Sidebar with stepper -->
      <VCol
        v-if="$vuetify.display.mdAndUp"
        cols="3"
        class="border-e"
      >
        <VCardText class="pa-3">
          <!-- Custom Compact Stepper -->
          <div class="stepper-compact">
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="stepper-item"
              :class="{
                'stepper-item--active': index === currentStep,
                'stepper-item--completed': stepStates[index] === 'completed',
                'stepper-item--clickable': wizardStore.canNavigateToStep(index)
              }"
              @click="wizardStore.canNavigateToStep(index) && navigateToStep(index)"
            >
              <div class="stepper-indicator">
                <VIcon
                  v-if="stepStates[index] === 'completed'"
                  icon="tabler-check"
                  size="14"
                  color="success"
                />
                <span v-else class="stepper-number">{{ index + 1 }}</span>
              </div>
              <div class="stepper-content">
                <div class="stepper-title">{{ step.title }}</div>
                <div class="stepper-subtitle">{{ step.subtitle }}</div>
              </div>
            </div>
          </div>

          <!-- Auto-save indicator -->
          <div
            v-if="wizardStore.lastSaved"
            class="mt-3 text-caption text-medium-emphasis d-flex align-center"
          >
            <VIcon
              icon="tabler-device-floppy"
              size="12"
              class="me-1"
            />
            {{ new Date(wizardStore.lastSaved).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) }}
          </div>
        </VCardText>
      </VCol>

      <!-- Main content area -->
      <VCol
        cols="12"
        :md="$vuetify.display.mdAndUp ? 9 : 12"
      >
        <VCardText class="pa-3 pa-md-4">
          <VForm>
            <VWindow
              :model-value="currentStep"
              class="disable-tab-transition"
            >
              <!-- Step 1: Holder Selection -->
              <VWindowItem :value="0">
                <ConcessionHolderStep
                  v-model="wizardStore.wizardData.holder_id"
                  @validate="(isValid: boolean) => handleStepValidation(0, isValid)"
                />
              </VWindowItem>

              <!-- Step 2: Basic Info -->
              <VWindowItem :value="1">
                <ConcessionBasicInfoStep
                  :model-value="{
                    number: wizardStore.wizardData.number,
                    modality: wizardStore.wizardData.modality,
                    status: wizardStore.wizardData.status
                  }"
                  :valid-values="concessionStore.validValues"
                  @update:model-value="wizardStore.updateBasicInfo"
                  @validate="(isValid: boolean) => handleStepValidation(1, isValid)"
                />
              </VWindowItem>

              <!-- Step 3: Location -->
              <VWindowItem :value="2">
                <ConcessionLocationStep
                  :model-value="{
                    municipality: wizardStore.wizardData.municipality,
                    route_or_site: wizardStore.wizardData.route_or_site
                  }"
                  @update:model-value="wizardStore.updateLocationInfo"
                  @validate="(isValid: boolean) => handleStepValidation(2, isValid)"
                />
              </VWindowItem>

              <!-- Step 4: Validity Dates -->
              <VWindowItem :value="3">
                <ConcessionValidityStep
                  :model-value="{
                    valid_from: wizardStore.wizardData.valid_from,
                    valid_to: wizardStore.wizardData.valid_to
                  }"
                  @update:model-value="wizardStore.updateValidityDates"
                  @validate="(isValid: boolean) => handleStepValidation(3, isValid)"
                />
              </VWindowItem>

              <!-- Step 5: Services -->
              <VWindowItem :value="4">
                <ConcessionServicesStep
                  :authorized-services="wizardStore.wizardData.authorized_services"
                  :valid-values="concessionStore.validValues"
                  @update:services="wizardStore.updateServices"
                  @validate="(isValid: boolean) => handleStepValidation(4, isValid)"
                />
              </VWindowItem>

              <!-- Step 6: Restrictions -->
              <VWindowItem :value="5">
                <ConcessionRestrictionsStep
                  :restrictions="wizardStore.wizardData.restrictions"
                  :valid-values="concessionStore.validValues"
                  @update:restrictions="wizardStore.updateRestrictions"
                  @validate="(isValid: boolean) => handleStepValidation(5, isValid)"
                />
              </VWindowItem>

              <!-- Step 7: Summary -->
              <VWindowItem :value="6">
                <ConcessionSummaryStep
                  :concession-data="wizardStore.wizardData"
                  :valid-values="concessionStore.validValues"
                  @submit="handleSubmit"
                  @cancel="handleCancel"
                />
              </VWindowItem>
            </VWindow>

            <!-- Navigation buttons -->
            <VDivider class="mt-4 mb-3" />
            <div class="d-flex align-center justify-space-between">
              <VBtn
                v-if="!isFirstStep"
                color="secondary"
                variant="outlined"
                size="small"
                :disabled="isTransitioning"
                @click="previousStep"
              >
                <VIcon
                  icon="tabler-arrow-left"
                  size="16"
                  start
                />
                Atrás
              </VBtn>
              <div v-else></div>

              <div class="d-flex gap-2">
                <!-- Cancel button -->
                <VBtn
                  color="error"
                  variant="text"
                  size="small"
                  @click="handleCancel"
                >
                  Cancelar
                </VBtn>

                <!-- Final submit button -->
                <VBtn
                  v-if="isLastStep"
                  color="success"
                  :disabled="!canProceedToNextStep || isTransitioning"
                  :loading="isTransitioning"
                  @click="handleSubmit"
                >
                  <VIcon
                    icon="tabler-check"
                    size="16"
                    start
                  />
                  {{ isEdit ? 'Actualizar' : 'Crear' }} Concesión
                </VBtn>

                <!-- Next button -->
                <VBtn
                  v-else
                  color="primary"
                  :disabled="!canProceedToNextStep || isTransitioning"
                  @click="nextStep"
                >
                  Continuar
                  <VIcon
                    icon="tabler-arrow-right"
                    size="16"
                    end
                  />
                </VBtn>
              </div>
            </div>
          </VForm>
        </VCardText>
      </VCol>
    </VRow>
  </VCard>
</template>

<style scoped>
.disable-tab-transition {
  overflow: hidden;
}

.disable-tab-transition .v-window__container {
  transition: none !important;
}

.disable-tab-transition .v-window-item {
  transition: none !important;
}

/* Custom compact stepper */
.stepper-compact {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stepper-item {
  display: flex;
  align-items: center;
  border-radius: 8px;
  cursor: default;
  gap: 12px;
  padding-block: 8px;
  padding-inline: 12px;
  transition: all 0.2s ease;
}

.stepper-item--clickable {
  cursor: pointer;
}

.stepper-item--clickable:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}

.stepper-item--active {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.stepper-indicator {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(var(--v-theme-outline), 0.3);
  border-radius: 50%;
  background-color: rgba(var(--v-theme-surface-variant), 1);
  block-size: 24px;
  inline-size: 24px;
}

.stepper-item--active .stepper-indicator {
  border-color: rgba(var(--v-theme-primary), 1);
  background-color: rgba(var(--v-theme-primary), 1);
}

.stepper-item--completed .stepper-indicator {
  border-color: rgba(var(--v-theme-success), 1);
  background-color: rgba(var(--v-theme-success), 1);
}

.stepper-number {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 12px;
  font-weight: 600;
}

.stepper-item--active .stepper-number {
  color: rgba(var(--v-theme-on-primary), 1);
}

.stepper-content {
  flex: 1;
  min-inline-size: 0;
}

.stepper-title {
  color: rgba(var(--v-theme-on-surface), 0.87);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
}

.stepper-subtitle {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 12px;
  line-height: 1.2;
  margin-block-start: 2px;
}

.stepper-item--active .stepper-title {
  color: rgba(var(--v-theme-primary), 1);
  font-weight: 600;
}
</style>
