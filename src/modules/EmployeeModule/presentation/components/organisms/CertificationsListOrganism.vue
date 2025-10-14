<script setup lang="ts">
import { ref } from 'vue'
import type { EmployeeCertificationEntity } from '../../../domain/entities/EmployeeEntity'
import CertificationCardMolecule from '../molecules/CertificationCardMolecule.vue'
import CertificationFormMolecule from '../molecules/CertificationFormMolecule.vue'

interface Props {
  certifications: EmployeeCertificationEntity[]
  employeeId: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: true,
})

const emit = defineEmits<{
  add: [data: Partial<EmployeeCertificationEntity>]
  update: [id: string, data: Partial<EmployeeCertificationEntity>]
  delete: [id: string]
}>()

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const selectedCertification = ref<EmployeeCertificationEntity | null>(null)
const loading = ref(false)

function handleAdd(data: Partial<EmployeeCertificationEntity>) {
  emit('add', data)
  showAddDialog.value = false
}

function handleEdit(cert: EmployeeCertificationEntity) {
  selectedCertification.value = cert
  showEditDialog.value = true
}

function handleUpdate(data: Partial<EmployeeCertificationEntity>) {
  if (selectedCertification.value) {
    emit('update', selectedCertification.value.id!, data)
    showEditDialog.value = false
    selectedCertification.value = null
  }
}

function handleDelete(cert: EmployeeCertificationEntity) {
  if (confirm(`¿Eliminar la certificación "${cert.certification_name}"?`))
    emit('delete', cert.id!)
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h6 class="text-h6 mb-1">
          Certificaciones y Licencias
        </h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Certificaciones profesionales, licencias y documentos oficiales
        </p>
      </div>

      <VBtn
        v-if="editable"
        color="primary"
        variant="tonal"
        prepend-icon="tabler-certificate"
        @click="showAddDialog = true"
      >
        Agregar Certificación
      </VBtn>
    </div>

    <!-- Certifications Grid -->
    <VRow v-if="certifications.length > 0">
      <VCol
        v-for="cert in certifications"
        :key="cert.id"
        cols="12"
        md="6"
      >
        <CertificationCardMolecule
          :certification="cert"
          :editable="editable"
          @edit="handleEdit"
          @delete="handleDelete"
        />
      </VCol>
    </VRow>

    <!-- Empty State -->
    <VAlert
      v-else
      color="info"
      variant="tonal"
      icon="tabler-certificate-off"
    >
      <div class="text-body-2">
        No hay certificaciones registradas.
        <a
          v-if="editable"
          href="#"
          @click.prevent="showAddDialog = true"
        >Agregar la primera certificación</a>
      </div>
    </VAlert>

    <!-- Add Dialog -->
    <VDialog
      v-model="showAddDialog"
      max-width="700"
      persistent
    >
      <VCard>
        <VCardTitle>
          <div class="d-flex align-center justify-space-between">
            <span>Agregar Nueva Certificación</span>
            <VBtn
              icon
              variant="text"
              size="small"
              @click="showAddDialog = false"
            >
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pt-4">
          <CertificationFormMolecule
            :loading="loading"
            @submit="handleAdd"
            @cancel="showAddDialog = false"
          />
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Edit Dialog -->
    <VDialog
      v-model="showEditDialog"
      max-width="700"
      persistent
    >
      <VCard>
        <VCardTitle>
          <div class="d-flex align-center justify-space-between">
            <span>Editar Certificación</span>
            <VBtn
              icon
              variant="text"
              size="small"
              @click="showEditDialog = false; selectedCertification = null"
            >
              <VIcon>tabler-x</VIcon>
            </VBtn>
          </div>
        </VCardTitle>

        <VDivider />

        <VCardText class="pt-4">
          <CertificationFormMolecule
            :certification="selectedCertification"
            :loading="loading"
            @submit="handleUpdate"
            @cancel="showEditDialog = false; selectedCertification = null"
          />
        </VCardText>
      </VCard>
    </VDialog>
  </div>
</template>
