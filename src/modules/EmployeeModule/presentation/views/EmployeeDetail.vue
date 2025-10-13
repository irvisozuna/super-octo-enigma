<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '../stores/employeeStore'
import { EmployeeDomain } from '../../domain/entities/EmployeeEntity'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()

const loading = ref(false)
const employee = computed(() => employeeStore.currentItem)

const tabs = ref('info')

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

async function suspendEmployee() {
  if (!employee.value)
    return

  if (confirm(t('employee.confirm_suspend', { name: employee.value.full_name }))) {
    try {
      await employeeStore.suspendEmployee(employee.value.id)
    }
    catch (error) {
      console.error('Error suspending employee:', error)
    }
  }
}

async function reactivateEmployee() {
  if (!employee.value)
    return

  if (confirm(t('employee.confirm_reactivate', { name: employee.value.full_name }))) {
    try {
      await employeeStore.reactivateEmployee(employee.value.id)
    }
    catch (error) {
      console.error('Error reactivating employee:', error)
    }
  }
}

async function terminateEmployee() {
  if (!employee.value)
    return

  if (confirm(t('employee.confirm_terminate', { name: employee.value.full_name }))) {
    try {
      await employeeStore.terminateEmployee(employee.value.id)
    }
    catch (error) {
      console.error('Error terminating employee:', error)
    }
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
                  {{ t(`employee.positions.${employee.position}`) }}
                </VChip>
                <VChip
                  size="small"
                  :color="getStatusColor(employee.status)"
                  variant="tonal"
                >
                  {{ t(`employee.status.${employee.status}`) }}
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
              {{ t('common.back') }}
            </VBtn>

            <VBtn
              v-if="employee.status === 'active'"
              color="warning"
              @click="suspendEmployee"
            >
              {{ t('employee.actions.suspend') }}
            </VBtn>

            <VBtn
              v-if="employee.status === 'suspended'"
              color="success"
              @click="reactivateEmployee"
            >
              {{ t('employee.actions.reactivate') }}
            </VBtn>

            <VBtn
              v-if="employee.status === 'active' || employee.status === 'suspended'"
              color="error"
              @click="terminateEmployee"
            >
              {{ t('employee.actions.terminate') }}
            </VBtn>

            <VBtn
              color="primary"
              @click="navigateToEdit"
            >
              <VIcon start>
                tabler-pencil
              </VIcon>
              {{ t('common.edit') }}
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
          {{ t('employee.tabs.info') }}
        </VTab>
        <VTab value="contact">
          <VIcon start>
            tabler-phone
          </VIcon>
          {{ t('employee.tabs.contact') }}
        </VTab>
        <VTab value="employment">
          <VIcon start>
            tabler-briefcase
          </VIcon>
          {{ t('employee.tabs.employment') }}
        </VTab>
        <VTab
          v-if="employee.skills && employee.skills.length > 0"
          value="skills"
        >
          <VIcon start>
            tabler-certificate
          </VIcon>
          {{ t('employee.tabs.skills') }}
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
                    {{ t('employee.fields.first_name') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.first_name }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.last_name') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.last_name }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.date_of_birth') }}
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
                    {{ t('employee.fields.gender') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.gender ? t(`employee.gender.${employee.gender}`) : '-' }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.tax_id') }}
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
                    {{ t('employee.fields.email') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.email || '-' }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.primary_phone') }}
                  </div>
                  <div class="text-body-1">
                    {{ employee.primary_phone || '-' }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.secondary_phone') }}
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
                    {{ t('employee.fields.address') }}
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
                    {{ t('employee.fields.emergency_contact') }}
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
                    {{ t('employee.fields.hire_date') }}
                  </div>
                  <div class="text-body-1">
                    {{ formatDate(employee.hire_date) }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.position') }}
                  </div>
                  <div class="text-body-1">
                    {{ t(`employee.positions.${employee.position}`) }}
                  </div>
                </div>

                <div class="mb-4">
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.department') }}
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
                    {{ t('employee.fields.employment_type') }}
                  </div>
                  <div class="text-body-1">
                    {{ t(`employee.employment_types.${employee.employment_type}`) }}
                  </div>
                </div>

                <div
                  v-if="employee.termination_date"
                  class="mb-4"
                >
                  <div class="text-caption text-disabled mb-1">
                    {{ t('employee.fields.termination_date') }}
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
            <VRow v-if="employee.skills && employee.skills.length > 0">
              <VCol
                v-for="skill in employee.skills"
                :key="skill.id"
                cols="12"
                md="6"
              >
                <VCard variant="tonal">
                  <VCardText>
                    <div class="d-flex align-center justify-space-between mb-2">
                      <h6 class="text-h6">
                        {{ skill.skill_name }}
                      </h6>
                      <VChip
                        size="small"
                        variant="tonal"
                      >
                        {{ t(`employee.proficiency.${skill.proficiency_level}`) }}
                      </VChip>
                    </div>
                    <div
                      v-if="skill.years_of_experience"
                      class="text-body-2"
                    >
                      {{ skill.years_of_experience }} {{ t('employee.years_experience') }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
            <div
              v-else
              class="text-center pa-8"
            >
              <VIcon
                size="64"
                color="grey-lighten-1"
                class="mb-4"
              >
                tabler-certificate-off
              </VIcon>
              <p class="text-body-1">
                {{ t('employee.no_skills') }}
              </p>
            </div>
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
      {{ t('employee.not_found') }}
    </VAlert>
  </div>
</template>
