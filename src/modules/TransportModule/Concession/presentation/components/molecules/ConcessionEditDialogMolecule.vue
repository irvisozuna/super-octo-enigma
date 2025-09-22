<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConcessionStore } from '../../stores/concessionStore'

// Props
interface Props {
  visible: boolean
  item?: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Composables
const { t } = useI18n()
const concessionStore = useConcessionStore()

// State
const loading = ref(false)

const editForm = ref({
  concession_number: '',
  concession_type: '',
  service_area: '',
  route_description: '',
  issue_date: '',
  expiry_date: '',
  status: 'PENDING',
})

// Computed
const dialogValue = computed({
  get: () => props.visible,
  set: value => {
    if (!value)
      emit('close')
  },
})

const concessionTypeOptions = [
  { title: 'Urbano', value: 'URBAN' },
  { title: 'Suburbano', value: 'SUBURBAN' },
  { title: 'Foráneo', value: 'INTERCITY' },
  { title: 'Turístico', value: 'TOURIST' },
  { title: 'Escolar', value: 'SCHOOL' },
  { title: 'Especializado', value: 'SPECIALIZED' },
]

const statusOptions = [
  { title: 'Pendiente', value: 'PENDING' },
  { title: 'Activo', value: 'ACTIVE' },
  { title: 'Inactivo', value: 'INACTIVE' },
  { title: 'Suspendido', value: 'SUSPENDED' },
  { title: 'Expirado', value: 'EXPIRED' },
]

const isValid = computed(() => {
  return !!(
    editForm.value.concession_number?.trim()
    && editForm.value.concession_type
    && editForm.value.service_area?.trim()
    && editForm.value.issue_date
    && editForm.value.expiry_date
  )
})

// Watch for item changes to populate form
watch(() => props.item, newItem => {
  if (newItem) {
    editForm.value = {
      concession_number: newItem.concessionNumber || '',
      concession_type: newItem.concessionType || 'URBAN',
      service_area: newItem.serviceArea || '',
      route_description: newItem.routeDescription || '',
      issue_date: newItem.issueDate || '',
      expiry_date: newItem.expiryDate || '',
      status: newItem.status || 'PENDING',
    }
  }
}, { immediate: true })

// Methods
const handleCancel = () => {
  emit('close')
}

const handleSave = async () => {
  if (!isValid.value)
    return

  loading.value = true
  try {
    await concessionStore.updateItem(props.item.id, editForm.value)
    emit('success')
  }
  catch (error) {
    console.error('Error updating concession:', error)
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <VDialog
    v-model="dialogValue"
    max-width="600"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="tabler-edit"
          size="20"
          class="me-2"
          color="primary"
        />
        Editar Concesión
      </VCardTitle>

      <VCardText>
        <VForm>
          <VRow>
            <!-- Número de Concesión -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="editForm.concession_number"
                label="Número de Concesión *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-certificate"
                readonly
                hint="Número generado automáticamente"
                persistent-hint
              />
            </VCol>

            <!-- Tipo de Concesión -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="editForm.concession_type"
                label="Tipo de Concesión *"
                :items="concessionTypeOptions"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-car"
                :rules="[v => !!v || 'El tipo de concesión es requerido']"
              />
            </VCol>

            <!-- Área de Servicio -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="editForm.service_area"
                label="Área de Servicio *"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-map-pin"
                :rules="[v => !!v || 'El área de servicio es requerida']"
              />
            </VCol>

            <!-- Estado -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="editForm.status"
                label="Estado *"
                :items="statusOptions"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-flag"
                :rules="[v => !!v || 'El estado es requerido']"
              />
            </VCol>

            <!-- Descripción de Ruta -->
            <VCol cols="12">
              <VTextField
                v-model="editForm.route_description"
                label="Descripción de Ruta"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-route"
                hint="Descripción de la ruta o sitio autorizado"
                persistent-hint
              />
            </VCol>

            <!-- Fechas de Vigencia -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="editForm.issue_date"
                label="Fecha de Emisión *"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-calendar"
                :rules="[v => !!v || 'La fecha de emisión es requerida']"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="editForm.expiry_date"
                label="Fecha de Vencimiento *"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="tabler-calendar"
                :rules="[v => !!v || 'La fecha de vencimiento es requerida']"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VCardActions class="px-6 pb-4">
        <VSpacer />
        <VBtn
          color="secondary"
          variant="text"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          :disabled="!isValid"
          :loading="loading"
          @click="handleSave"
        >
          <VIcon
            icon="tabler-device-floppy"
            size="16"
            start
          />
          Guardar Cambios
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
