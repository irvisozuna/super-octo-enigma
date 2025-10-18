<script setup lang="ts">
import { computed, ref, watch } from 'vue'

export interface ProjectStatusDialogsProps {
  startDialog?: boolean
  suspendDialog?: boolean
  resumeDialog?: boolean
  completeDialog?: boolean
  cancelDialog?: boolean
  loading?: boolean
}

const props = defineProps<ProjectStatusDialogsProps>()

const emit = defineEmits<{
  'update:startDialog': [value: boolean]
  'update:suspendDialog': [value: boolean]
  'update:resumeDialog': [value: boolean]
  'update:completeDialog': [value: boolean]
  'update:cancelDialog': [value: boolean]
  'start': [data: any]
  'suspend': [data: any]
  'resume': [data: any]
  'complete': [data: any]
  'cancel': [data: any]
}>()

// Forms refs
const startForm = ref()
const suspendForm = ref()
const resumeForm = ref()
const completeForm = ref()
const cancelForm = ref()

// Local dialog states
const localStartDialog = computed({
  get: () => props.startDialog,
  set: value => emit('update:startDialog', value),
})

const localSuspendDialog = computed({
  get: () => props.suspendDialog,
  set: value => emit('update:suspendDialog', value),
})

const localResumeDialog = computed({
  get: () => props.resumeDialog,
  set: value => emit('update:resumeDialog', value),
})

const localCompleteDialog = computed({
  get: () => props.completeDialog,
  set: value => emit('update:completeDialog', value),
})

const localCancelDialog = computed({
  get: () => props.cancelDialog,
  set: value => emit('update:cancelDialog', value),
})

// Form data
const startData = ref({
  start_date: new Date().toISOString().split('T')[0],
  notes: '',
})

const suspendData = ref({
  suspension_date: new Date().toISOString().split('T')[0],
  reason: '',
  expected_resume_date: '',
})

const resumeData = ref({
  resume_date: new Date().toISOString().split('T')[0],
  notes: '',
})

const completeData = ref({
  completion_date: new Date().toISOString().split('T')[0],
  final_cost: null as number | null,
  completion_notes: '',
})

const cancelData = ref({
  cancellation_date: new Date().toISOString().split('T')[0],
  reason: '',
})

// Handlers
const handleStart = async () => {
  const { valid } = await startForm.value.validate()
  if (!valid)
    return

  emit('start', { ...startData.value })
  localStartDialog.value = false
  resetForms()
}

const handleSuspend = async () => {
  const { valid } = await suspendForm.value.validate()
  if (!valid)
    return

  emit('suspend', { ...suspendData.value })
  localSuspendDialog.value = false
  resetForms()
}

const handleResume = async () => {
  const { valid } = await resumeForm.value.validate()
  if (!valid)
    return

  emit('resume', { ...resumeData.value })
  localResumeDialog.value = false
  resetForms()
}

const handleComplete = async () => {
  const { valid } = await completeForm.value.validate()
  if (!valid)
    return

  emit('complete', { ...completeData.value })
  localCompleteDialog.value = false
  resetForms()
}

const handleCancel = async () => {
  const { valid } = await cancelForm.value.validate()
  if (!valid)
    return

  emit('cancel', { ...cancelData.value })
  localCancelDialog.value = false
  resetForms()
}

const resetForms = () => {
  startData.value = {
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  }
  suspendData.value = {
    suspension_date: new Date().toISOString().split('T')[0],
    reason: '',
    expected_resume_date: '',
  }
  resumeData.value = {
    resume_date: new Date().toISOString().split('T')[0],
    notes: '',
  }
  completeData.value = {
    completion_date: new Date().toISOString().split('T')[0],
    final_cost: null,
    completion_notes: '',
  }
  cancelData.value = {
    cancellation_date: new Date().toISOString().split('T')[0],
    reason: '',
  }
}
</script>

<template>
  <div>
    <!-- Start Project Dialog -->
    <VDialog
      v-model="localStartDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-player-play"
            color="success"
          />
          Iniciar Proyecto
        </VCardTitle>
        <VCardText>
          <VForm
            ref="startForm"
            @submit.prevent="handleStart"
          >
            <VTextField
              v-model="startData.start_date"
              label="Fecha de Inicio"
              type="date"
              :rules="[v => !!v || 'La fecha es requerida']"
              required
            />
            <VTextarea
              v-model="startData.notes"
              label="Notas"
              rows="3"
              placeholder="Notas sobre el inicio del proyecto..."
            />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="localStartDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="success"
            :loading="loading"
            @click="handleStart"
          >
            Iniciar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Suspend Project Dialog -->
    <VDialog
      v-model="localSuspendDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-pause"
            color="warning"
          />
          Suspender Proyecto
        </VCardTitle>
        <VCardText>
          <VForm
            ref="suspendForm"
            @submit.prevent="handleSuspend"
          >
            <VTextField
              v-model="suspendData.suspension_date"
              label="Fecha de Suspensión"
              type="date"
              :rules="[v => !!v || 'La fecha es requerida']"
              required
            />
            <VTextarea
              v-model="suspendData.reason"
              label="Razón de Suspensión"
              rows="3"
              :rules="[v => !!v || 'La razón es requerida']"
              required
              placeholder="Ej: Condiciones climáticas adversas..."
            />
            <VTextField
              v-model="suspendData.expected_resume_date"
              label="Fecha Estimada de Reanudación"
              type="date"
            />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="localSuspendDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="warning"
            :loading="loading"
            @click="handleSuspend"
          >
            Suspender
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Resume Project Dialog -->
    <VDialog
      v-model="localResumeDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-player-play"
            color="success"
          />
          Reanudar Proyecto
        </VCardTitle>
        <VCardText>
          <VForm
            ref="resumeForm"
            @submit.prevent="handleResume"
          >
            <VTextField
              v-model="resumeData.resume_date"
              label="Fecha de Reanudación"
              type="date"
              :rules="[v => !!v || 'La fecha es requerida']"
              required
            />
            <VTextarea
              v-model="resumeData.notes"
              label="Notas"
              rows="3"
              placeholder="Notas sobre la reanudación del proyecto..."
            />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="localResumeDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="success"
            :loading="loading"
            @click="handleResume"
          >
            Reanudar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Complete Project Dialog -->
    <VDialog
      v-model="localCompleteDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-check"
            color="success"
          />
          Completar Proyecto
        </VCardTitle>
        <VCardText>
          <VForm
            ref="completeForm"
            @submit.prevent="handleComplete"
          >
            <VTextField
              v-model="completeData.completion_date"
              label="Fecha de Completación"
              type="date"
              :rules="[v => !!v || 'La fecha es requerida']"
              required
            />
            <VTextField
              v-model="completeData.final_cost"
              label="Costo Final"
              type="number"
              prefix="$"
              placeholder="0.00"
            />
            <VTextarea
              v-model="completeData.completion_notes"
              label="Notas de Completación"
              rows="3"
              placeholder="Resumen del proyecto completado..."
            />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="localCompleteDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="success"
            :loading="loading"
            @click="handleComplete"
          >
            Completar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Cancel Project Dialog -->
    <VDialog
      v-model="localCancelDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-x"
            color="error"
          />
          Cancelar Proyecto
        </VCardTitle>
        <VCardText>
          <VAlert
            type="warning"
            variant="tonal"
            class="mb-4"
          >
            Esta acción cancelará permanentemente el proyecto. Esta acción puede ser irreversible.
          </VAlert>
          <VForm
            ref="cancelForm"
            @submit.prevent="handleCancel"
          >
            <VTextField
              v-model="cancelData.cancellation_date"
              label="Fecha de Cancelación"
              type="date"
              :rules="[v => !!v || 'La fecha es requerida']"
              required
            />
            <VTextarea
              v-model="cancelData.reason"
              label="Razón de Cancelación"
              rows="3"
              :rules="[v => !!v || 'La razón es requerida']"
              required
              placeholder="Ej: Recorte presupuestario..."
            />
          </VForm>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="localCancelDialog = false"
          >
            Cerrar
          </VBtn>
          <VBtn
            color="error"
            :loading="loading"
            @click="handleCancel"
          >
            Cancelar Proyecto
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
