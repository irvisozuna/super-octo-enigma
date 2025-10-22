<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '../stores/employeeStore'
import { EmployeeDomain } from '../../domain/entities/EmployeeEntity'
import SkillsListOrganism from '../components/organisms/SkillsListOrganism.vue'
import CertificationsListOrganism from '../components/organisms/CertificationsListOrganism.vue'
import EmploymentHistoryOrganism from '../components/organisms/EmploymentHistoryOrganism.vue'
import type { EmployeeCertificationEntity, EmployeeSkillEntity } from '../../domain/entities/EmployeeEntity'
import ActionConfirmationDialog from '@/components/shared/ActionConfirmationDialog.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()

const loading = ref(false)
const employee = computed(() => employeeStore.currentItem)

const tabs = ref('info')

// Action confirmation dialog state
const showSuspendDialog = ref(false)
const showReactivateDialog = ref(false)
const showTerminateDialog = ref(false)
const actionLoading = ref(false)

// Métodos
async function loadEmployee() {
  const id = route.params.id as string

  loading.value = true

  try {
    await employeeStore.fetchById(id)
  }
  catch (error) {
    console.error('Error loading employee:', error)
    router.push({ name: 'employees-list' })
  }
  finally {
    loading.value = false
  }
}

function navigateToEdit() {
  router.push({ name: 'employees-edit', params: { id: route.params.id } })
}

function openSuspendDialog() {
  showSuspendDialog.value = true
}

function openReactivateDialog() {
  showReactivateDialog.value = true
}

function openTerminateDialog() {
  showTerminateDialog.value = true
}

async function handleSuspendConfirm(data: { reason?: string; notes?: string; effective_date?: string }) {
  if (!employee.value)
    return

  console.log('🔍 EmployeeDetail - handleSuspendConfirm called with:', data)

  actionLoading.value = true

  try {
    await employeeStore.suspendEmployee(employee.value.id, data.reason, data.notes, data.effective_date)
    showSuspendDialog.value = false
    await loadEmployee()
  }
  catch (error) {
    console.error('Error suspending employee:', error)
  }
  finally {
    actionLoading.value = false
  }
}

async function handleReactivateConfirm(data: { reason?: string; notes?: string; effective_date?: string }) {
  if (!employee.value)
    return

  actionLoading.value = true

  try {
    await employeeStore.reactivateEmployee(employee.value.id, data.reason, data.notes, data.effective_date)
    showReactivateDialog.value = false
    await loadEmployee()
  }
  catch (error) {
    console.error('Error reactivating employee:', error)
  }
  finally {
    actionLoading.value = false
  }
}

async function handleTerminateConfirm(data: { reason?: string; notes?: string; effective_date?: string }) {
  if (!employee.value)
    return

  actionLoading.value = true

  try {
    await employeeStore.terminateEmployee(employee.value.id, data.reason, data.notes, data.effective_date)
    showTerminateDialog.value = false
    await loadEmployee()
  }
  catch (error) {
    console.error('Error terminating employee:', error)
  }
  finally {
    actionLoading.value = false
  }
}

function getStatusColor(status: string) {
  return EmployeeDomain.getStatusColor(status as any)
}

function formatDate(date?: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

// Skills management
async function handleAddSkill(data: Partial<EmployeeSkillEntity>) {
  if (!employee.value)
    return

  try {
    await employeeStore.addSkill(employee.value.id, data)
    await loadEmployee()
  }
  catch (error) {
    console.error('Error adding skill:', error)
  }
}

async function handleUpdateSkill(skillId: string, data: Partial<EmployeeSkillEntity>) {
  if (!employee.value)
    return

  try {
    await employeeStore.updateSkill(employee.value.id, skillId, data)
    await loadEmployee()
  }
  catch (error) {
    console.error('Error updating skill:', error)
  }
}

async function handleDeleteSkill(skillId: string) {
  if (!employee.value)
    return

  try {
    await employeeStore.deleteSkill(employee.value.id, skillId)
    await loadEmployee()
  }
  catch (error) {
    console.error('Error deleting skill:', error)
  }
}

// Certifications management
async function handleAddCertification(data: Partial<EmployeeCertificationEntity>) {
  if (!employee.value)
    return

  try {
    await employeeStore.addCertification(employee.value.id, data)
    await loadEmployee()
  }
  catch (error) {
    console.error('Error adding certification:', error)
  }
}

async function handleUpdateCertification(certId: string, data: Partial<EmployeeCertificationEntity>) {
  if (!employee.value)
    return

  try {
    await employeeStore.updateCertification(employee.value.id, certId, data)
    await loadEmployee()
  }
  catch (error) {
    console.error('Error updating certification:', error)
  }
}

async function handleDeleteCertification(certId: string) {
  if (!employee.value)
    return

  try {
    await employeeStore.deleteCertification(employee.value.id, certId)
    await loadEmployee()
  }
  catch (error) {
    console.error('Error deleting certification:', error)
  }
}

onMounted(() => {
  loadEmployee()
})
</script>

<template>
  <div v-if="loading">
    <VProgressLinear indeterminate />
  </div>

  <div v-else-if="employee">
    <!-- Header -->
    <VCard class="mb-4">
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div class="d-flex align-center gap-4">
            <VAvatar
              size="80"
              :color="employee.photo_url ? undefined : 'primary'"
            >
              <VImg
                v-if="employee.photo_url"
                :src="employee.photo_url"
              />
              <span
                v-else
                class="text-h4"
              >{{ employee.first_name?.charAt(0) }}{{ employee.last_name?.charAt(0) }}</span>
            </VAvatar>

            <div>
              <h4 class="text-h4 mb-1">
                {{ employee.full_name }}
              </h4>
              <div class="d-flex align-center gap-2 flex-wrap">
                <VChip
                  size="small"
                  variant="tonal"
                >
                  {{ t(`EmployeeModule.positions.${employee.position}`) }}
                </VChip>
                <VChip
                  size="small"
                  :color="getStatusColor(employee.status)"
                  variant="tonal"
                >
                  {{ t(`EmployeeModule.status.${employee.status}`) }}
                </VChip>
                <span class="text-body-2 text-disabled">
                  {{ employee.employee_code }}
                </span>
              </div>
            </div>
          </div>

          <div class="d-flex gap-2">
            <VBtn
              variant="outlined"
              @click="router.back()"
            >
              <VIcon start>
                tabler-arrow-left
              </VIcon>
              {{ t('EmployeeModule.common.back') }}
            </VBtn>

            <VBtn
              v-if="employee.status === 'active'"
              color="warning"
              @click="openSuspendDialog"
            >
              {{ t('EmployeeModule.actions.suspend') }}
            </VBtn>

            <VBtn
              v-if="employee.status === 'suspended'"
              color="success"
              @click="openReactivateDialog"
            >
              {{ t('EmployeeModule.actions.reactivate') }}
            </VBtn>

            <VBtn
              v-if="employee.status === 'active' || employee.status === 'suspended'"
              color="error"
              @click="openTerminateDialog"
            >
              {{ t('EmployeeModule.actions.terminate') }}
            </VBtn>

            <VBtn
              color="primary"
              @click="navigateToEdit"
            >
              <VIcon start>
                tabler-pencil
              </VIcon>
              {{ t('EmployeeModule.common.edit') }}
            </VBtn>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Tabs -->
    <VCard>
      <VTabs v-model="tabs">
        <VTab value="info">
          <VIcon start>
            tabler-info-circle
          </VIcon>
          {{ t('EmployeeModule.tabs.info') }}
        </VTab>
        <VTab value="contact">
          <VIcon start>
            tabler-phone
          </VIcon>
          {{ t('EmployeeModule.tabs.contact') }}
        </VTab>
        <VTab value="employment">
          <VIcon start>
            tabler-briefcase
          </VIcon>
          {{ t('EmployeeModule.tabs.employment') }}
        </VTab>
        <VTab value="skills">
          <VIcon start>
            tabler-bulb
          </VIcon>
          Habilidades
          <VChip
            v-if="employee.skills && employee.skills.length > 0"
            size="x-small"
            color="primary"
            class="ml-2"
          >
            {{ employee.skills.length }}
          </VChip>
        </VTab>
        <VTab value="certifications">
          <VIcon start>
            tabler-certificate
          </VIcon>
          Certificaciones
          <VChip
            v-if="employee.certifications && employee.certifications.length > 0"
            size="x-small"
            color="success"
            class="ml-2"
          >
            {{ employee.certifications.length }}
          </VChip>
        </VTab>
        <VTab value="history">
          <VIcon start>
            tabler-history
          </VIcon>
          Historial
        </VTab>
      </VTabs>

      <VCardText>
        <VWindow v-model="tabs">
          <!-- Info Tab -->
          <VWindowItem value="info">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.first_name') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.first_name }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.last_name') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.last_name }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.date_of_birth') }}
                  </div>
                  <div class="text-body-1">
                    {{ formatDate(employee.date_of_birth) }}
                  </div>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.gender') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.gender ? t(`EmployeeModule.gender.${employee.gender}`) : '-' }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.tax_id') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.tax_id || '-' }}
                  </div>
                </div>
              </VCol>
            </VRow>
          </VWindowItem>

          <!-- Contact Tab -->
          <VWindowItem value="contact">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.email') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.email || '-' }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.primary_phone') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.primary_phone || '-' }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.secondary_phone') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.secondary_phone || '-' }}
                  </div>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.address') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.address_line_1 || '-' }}
                  </div>
                  <div
                    v-if="employee.city || employee.state"
                    class="text-body-2"
                  >
                    {{ employee.city }}, {{ employee.state }} {{ employee.postal_code }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.emergency_contact') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.emergency_contact_name || '-' }}
                  </div>
                  <div
                    v-if="employee.emergency_contact_phone"
                    class="text-body-2"
                  >
                    {{ employee.emergency_contact_phone }}
                  </div>
                </div>
              </VCol>
            </VRow>
          </VWindowItem>

          <!-- Employment Tab -->
          <VWindowItem value="employment">
            <VRow>
              <VCol
                cols="12"
                md="6"
              >
                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.hire_date') }}
                  </div>
                  <div class="text-body-1">
                    {{ formatDate(employee.hire_date) }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.position') }}
                  </div>
                  <div class="text-body-1">
                    {{ t(`EmployeeModule.positions.${employee.position}`) }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.department') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.department || '-' }}
                  </div>
                </div>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.employment_type') }}
                  </div>
                  <div class="text-body-1">
                    {{ t(`EmployeeModule.employment_types.${employee.employment_type}`) }}
                  </div>
                </div>

                <div
                  v-if="employee.termination_date"
                  class="mb-4"
                >
                  <div class="text-caption text-disabled mb-1">
                    {{ t('EmployeeModule.fields.termination_date') }}
                  </div>
                  <div class="text-body-1">
                    {{ formatDate(employee.termination_date) }}
                  </div>
                </div>
              </VCol>
            </VRow>
          </VWindowItem>

          <!-- Skills Tab -->
          <VWindowItem value="skills">
            <SkillsListOrganism
              :skills="employee.skills || []"
              :employee-id="employee.id"
              :editable="true"
              @add="handleAddSkill"
              @update="handleUpdateSkill"
              @delete="handleDeleteSkill"
            />
          </VWindowItem>

          <!-- Certifications Tab -->
          <VWindowItem value="certifications">
            <CertificationsListOrganism
              :certifications="employee.certifications || []"
              :employee-id="employee.id"
              :editable="true"
              @add="handleAddCertification"
              @update="handleUpdateCertification"
              @delete="handleDeleteCertification"
            />
          </VWindowItem>

          <!-- History Tab -->
          <VWindowItem value="history">
            <EmploymentHistoryOrganism
              :history="employee.employment_history || []"
              :loading="loading"
            />
          </VWindowItem>
        </VWindow>
      </VCardText>
    </VCard>
  </div>

  <div v-else>
    <VAlert
      type="error"
      variant="tonal"
    >
      {{ t('EmployeeModule.not_found') }}
    </VAlert>
  </div>

  <!-- Action Confirmation Dialogs -->
  <ActionConfirmationDialog
    v-if="employee"
    :visible="showSuspendDialog"
    title="Suspender Empleado"
    action-type="suspend"
    entity-name="Empleado"
    :entity-info="employee.full_name"
    :loading="actionLoading"
    @close="showSuspendDialog = false"
    @confirm="handleSuspendConfirm"
  />

  <ActionConfirmationDialog
    v-if="employee"
    :visible="showReactivateDialog"
    title="Reactivar Empleado"
    action-type="reactivate"
    entity-name="Empleado"
    :entity-info="employee.full_name"
    :loading="actionLoading"
    @close="showReactivateDialog = false"
    @confirm="handleReactivateConfirm"
  />

  <ActionConfirmationDialog
    v-if="employee"
    :visible="showTerminateDialog"
    title="Terminar Contrato"
    action-type="terminate"
    entity-name="Empleado"
    :entity-info="employee.full_name"
    :loading="actionLoading"
    @close="showTerminateDialog = false"
    @confirm="handleTerminateConfirm"
  />
</template>
