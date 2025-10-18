<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'saved', settings: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const saving = ref(false)

const settings = ref({
  general: {
    enabled: true,
    sound: true,
    desktop: true,
    mobile: false,
  },
  email: {
    enabled: true,
    address: '',
    frequency: 'immediate',
    digest: false,
  },
  projects: {
    created: true,
    updated: true,
    completed: true,
    overdue: true,
  },
  wells: {
    created: true,
    completed: true,
    depthMilestone: true,
    problems: true,
  },
  tools: {
    assigned: true,
    returned: true,
    maintenance: true,
    warranty: true,
  },
  employees: {
    hired: true,
    terminated: true,
    certification: true,
    birthday: false,
  },
  equipment: {
    assigned: true,
    maintenance: true,
    warranty: true,
    critical: true,
  },
  documents: {
    uploaded: true,
    approved: true,
    rejected: true,
    expiring: true,
  },
  system: {
    updates: true,
    maintenance: true,
    errors: true,
    security: true,
  },
})

const frequencyOptions = computed(() => [
  { title: t('DrillingReportsModule.common.immediate'), value: 'immediate' },
  { title: t('DrillingReportsModule.common.hourly'), value: 'hourly' },
  { title: t('DrillingReportsModule.common.daily'), value: 'daily' },
  { title: t('DrillingReportsModule.common.weekly'), value: 'weekly' },
])

const handleSave = async () => {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('saved', settings.value)
    emit('update:modelValue', settings.value)
  }
  catch (error) {
    console.error('Error saving notification settings:', error)
  }
  finally {
    saving.value = false
  }
}

const handleReset = () => {
  settings.value = {
    general: {
      enabled: true,
      sound: true,
      desktop: true,
      mobile: false,
    },
    email: {
      enabled: true,
      address: '',
      frequency: 'immediate',
      digest: false,
    },
    projects: {
      created: true,
      updated: true,
      completed: true,
      overdue: true,
    },
    wells: {
      created: true,
      completed: true,
      depthMilestone: true,
      problems: true,
    },
    tools: {
      assigned: true,
      returned: true,
      maintenance: true,
      warranty: true,
    },
    employees: {
      hired: true,
      terminated: true,
      certification: true,
      birthday: false,
    },
    equipment: {
      assigned: true,
      maintenance: true,
      warranty: true,
      critical: true,
    },
    documents: {
      uploaded: true,
      approved: true,
      rejected: true,
      expiring: true,
    },
    system: {
      updates: true,
      maintenance: true,
      errors: true,
      security: true,
    },
  }
}

onMounted(() => {
  if (props.modelValue)
    settings.value = { ...props.modelValue }
})
</script>

<template>
  <div class="related-entities-notification-settings">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-bell-cog"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.notificationSettings') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- General Notification Settings -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.generalNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.general.enabled"
                :label="$t('DrillingReportsModule.common.enableNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.general.sound"
                :label="$t('DrillingReportsModule.common.soundNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.general.desktop"
                :label="$t('DrillingReportsModule.common.desktopNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.general.mobile"
                :label="$t('DrillingReportsModule.common.mobileNotifications')"
              />
            </VCol>

            <!-- Email Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.emailNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.email.enabled"
                :label="$t('DrillingReportsModule.common.enableEmailNotifications')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="settings.email.address"
                :label="$t('DrillingReportsModule.common.emailAddress')"
                type="email"
                :disabled="!settings.email.enabled"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="settings.email.frequency"
                :items="frequencyOptions"
                :label="$t('DrillingReportsModule.common.emailFrequency')"
                :disabled="!settings.email.enabled"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.email.digest"
                :label="$t('DrillingReportsModule.common.dailyDigest')"
                :disabled="!settings.email.enabled"
              />
            </VCol>

            <!-- Project Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.projects.title') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.projects.created"
                :label="$t('DrillingReportsModule.common.projectCreated')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.projects.updated"
                :label="$t('DrillingReportsModule.common.projectUpdated')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.projects.completed"
                :label="$t('DrillingReportsModule.common.projectCompleted')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.projects.overdue"
                :label="$t('DrillingReportsModule.common.projectOverdue')"
              />
            </VCol>

            <!-- Well Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.wells.title') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.wells.created"
                :label="$t('DrillingReportsModule.common.wellCreated')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.wells.completed"
                :label="$t('DrillingReportsModule.common.wellCompleted')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.wells.depthMilestone"
                :label="$t('DrillingReportsModule.common.depthMilestone')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.wells.problems"
                :label="$t('DrillingReportsModule.common.wellProblems')"
              />
            </VCol>

            <!-- Tool Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.tools.title') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.tools.assigned"
                :label="$t('DrillingReportsModule.common.toolAssigned')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.tools.returned"
                :label="$t('DrillingReportsModule.common.toolReturned')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.tools.maintenance"
                :label="$t('DrillingReportsModule.common.toolMaintenance')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.tools.warranty"
                :label="$t('DrillingReportsModule.common.warrantyExpiring')"
              />
            </VCol>

            <!-- Employee Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.employees.title') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.employees.hired"
                :label="$t('DrillingReportsModule.common.employeeHired')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.employees.terminated"
                :label="$t('DrillingReportsModule.common.employeeTerminated')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.employees.certification"
                :label="$t('DrillingReportsModule.common.certificationExpiring')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.employees.birthday"
                :label="$t('DrillingReportsModule.common.employeeBirthday')"
              />
            </VCol>

            <!-- Equipment Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.equipment.title') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.equipment.assigned"
                :label="$t('DrillingReportsModule.common.equipmentAssigned')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.equipment.maintenance"
                :label="$t('DrillingReportsModule.common.equipmentMaintenance')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.equipment.warranty"
                :label="$t('DrillingReportsModule.common.equipmentWarranty')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.equipment.critical"
                :label="$t('DrillingReportsModule.common.equipmentCritical')"
              />
            </VCol>

            <!-- Document Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.documents.title') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.documents.uploaded"
                :label="$t('DrillingReportsModule.common.documentUploaded')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.documents.approved"
                :label="$t('DrillingReportsModule.common.documentApproved')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.documents.rejected"
                :label="$t('DrillingReportsModule.common.documentRejected')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.documents.expiring"
                :label="$t('DrillingReportsModule.common.documentExpiring')"
              />
            </VCol>

            <!-- System Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.systemNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.system.updates"
                :label="$t('DrillingReportsModule.common.systemUpdates')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.system.maintenance"
                :label="$t('DrillingReportsModule.common.systemMaintenance')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.system.errors"
                :label="$t('DrillingReportsModule.common.systemErrors')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="settings.system.security"
                :label="$t('DrillingReportsModule.common.securityAlerts')"
              />
            </VCol>
          </VRow>

          <VRow>
            <VCol
              cols="12"
              class="d-flex justify-end"
            >
              <VBtn
                color="grey"
                variant="text"
                @click="handleReset"
              >
                {{ $t('DrillingReportsModule.common.reset') }}
              </VBtn>
              <VBtn
                color="primary"
                type="submit"
                :loading="saving"
              >
                {{ $t('DrillingReportsModule.common.save') }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped>
.related-entities-notification-settings {
  inline-size: 100%;
}
</style>
