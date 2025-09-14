<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConcessionStore } from '../../stores/concessionStore'

// Props
interface Props {
  modelValue: boolean
  concession?: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
  cancel: []
}>()

// Composables
const { t } = useI18n()
const concessionStore = useConcessionStore()

// State
const loading = ref(false)
const confirmationText = ref('')

// Computed
const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const canDelete = computed(() => {
  return confirmationText.value.toLowerCase() === 'eliminar'
})

const hasActiveVehicles = computed(() => {
  return props.concession?.active_vehicles_count > 0
})

const hasUnpaidFines = computed(() => {
  return props.concession?.unpaid_fines_count > 0
})

const cannotDelete = computed(() => {
  return hasActiveVehicles.value || hasUnpaidFines.value
})

// Methods
const handleCancel = () => {
  confirmationText.value = ''
  emit('cancel')
}

const handleDelete = async () => {
  if (!canDelete.value || cannotDelete.value) return

  loading.value = true
  try {
    await concessionStore.deleteItem(props.concession.id)
    emit('success')
  } catch (error) {
    console.error('Error deleting concession:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    v-model="dialogValue"
    max-width="500"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-alert-triangle"
          size="20"
          class="me-2"
          color="error"
        />
        Eliminar Concesión
      </VCardTitle>

      <VCardText>
        <VAlert
          type="error"
          variant="tonal"
          class="mb-4"
          density="compact"
        >
          <VAlertTitle>¡Acción Irreversible!</VAlertTitle>
          Esta acción eliminará permanentemente la concesión y todos sus datos asociados.
        </VAlert>

        <!-- Concession Info -->
        <div class="mb-4">
          <div class="text-subtitle-2 text-medium-emphasis mb-2">
            Concesión a Eliminar
          </div>
          <VCard
            variant="outlined"
            color="error"
            class="pa-3"
          >
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-subtitle-1 font-weight-medium">
                  {{ concession?.concessionNumber || 'N/A' }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ concession?.concessionType || 'N/A' }} - {{ concession?.serviceArea || 'N/A' }}
                </div>
              </div>
              <VChip
                color="error"
                size="small"
              >
                {{ concession?.status || 'PENDING' }}
              </VChip>
            </div>
          </VCard>
        </div>

        <!-- Warnings for active dependencies -->
        <div v-if="cannotDelete">
          <VAlert
            type="warning"
            variant="tonal"
            class="mb-3"
            density="compact"
          >
            <VAlertTitle>No se puede eliminar</VAlertTitle>
            Esta concesión tiene dependencias activas que deben resolverse antes de eliminarla.
          </VAlert>

          <VList density="compact">
            <VListItem
              v-if="hasActiveVehicles"
              prepend-icon="tabler-car"
              class="text-warning"
            >
              <VListItemTitle>{{ concession?.active_vehicles_count }} vehículo(s) activo(s)</VListItemTitle>
              <VListItemSubtitle>Debe desasociar los vehículos primero</VListItemSubtitle>
            </VListItem>

            <VListItem
              v-if="hasUnpaidFines"
              prepend-icon="tabler-alert-triangle"
              class="text-warning"
            >
              <VListItemTitle>{{ concession?.unpaid_fines_count }} multa(s) pendiente(s)</VListItemTitle>
              <VListItemSubtitle>Debe resolver las multas pendientes primero</VListItemSubtitle>
            </VListItem>
          </VList>
        </div>

        <!-- Confirmation input -->
        <div v-else>
          <p class="text-body-2 mb-4">
            Para confirmar la eliminación, escribe <strong>ELIMINAR</strong> en el campo de abajo:
          </p>

          <VTextField
            v-model="confirmationText"
            label="Confirmación *"
            placeholder="Escribe ELIMINAR para confirmar"
            variant="outlined"
            density="comfortable"
            :rules="[v => v?.toLowerCase() === 'eliminar' || 'Debes escribir ELIMINAR para confirmar']"
            hint="Esta acción no se puede deshacer"
            persistent-hint
          />
        </div>
      </VCardText>

      <VCardActions class="px-6 pb-4">
        <VSpacer />
        <VBtn
          color="secondary"
          variant="text"
          @click="handleCancel"
          :disabled="loading"
        >
          Cancelar
        </VBtn>
        <VBtn
          v-if="!cannotDelete"
          color="error"
          :disabled="!canDelete"
          :loading="loading"
          @click="handleDelete"
        >
          <VIcon
            icon="tabler-trash"
            size="16"
            start
          />
          Eliminar Concesión
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>