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

const permissions = ref({
  projects: {
    view: true,
    create: false,
    update: false,
    delete: false,
    export: false,
  },
  wells: {
    view: true,
    create: false,
    update: false,
    delete: false,
    export: false,
  },
  tools: {
    view: true,
    create: false,
    update: false,
    delete: false,
    export: false,
  },
  employees: {
    view: true,
    create: false,
    update: false,
    delete: false,
    export: false,
  },
  equipment: {
    view: true,
    create: false,
    update: false,
    delete: false,
    export: false,
  },
  documents: {
    view: true,
    create: false,
    update: false,
    delete: false,
    export: false,
  },
  roles: {
    supervisor: {
      approveReports: true,
      rejectReports: true,
      viewAllReports: true,
      manageProjects: true,
      manageWells: true,
    },
    operator: {
      createReports: true,
      editOwnReports: true,
      viewOwnReports: true,
      manageActivities: true,
      manageConsumptions: true,
    },
    assistant: {
      viewReports: true,
      addActivities: true,
      addConsumptions: true,
      manageTools: true,
      uploadDocuments: true,
    },
    client: {
      viewApprovedReports: true,
      downloadReports: true,
      signReports: true,
      viewProjectStatus: true,
      receiveNotifications: true,
    },
  },
  security: {
    requireTwoFactor: false,
    requireStrongPassword: true,
    requireEmailVerification: true,
    requirePhoneVerification: false,
    requireBiometricAuth: false,
  },
  dataAccess: {
    exportAllData: false,
    importData: false,
    bulkOperations: false,
    advancedSearch: true,
    auditLogs: false,
  },
})

const handleSave = async () => {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('saved', permissions.value)
    emit('update:modelValue', permissions.value)
  }
  catch (error) {
    console.error('Error saving permissions settings:', error)
  }
  finally {
    saving.value = false
  }
}

const handleReset = () => {
  permissions.value = {
    projects: {
      view: true,
      create: false,
      update: false,
      delete: false,
      export: false,
    },
    wells: {
      view: true,
      create: false,
      update: false,
      delete: false,
      export: false,
    },
    tools: {
      view: true,
      create: false,
      update: false,
      delete: false,
      export: false,
    },
    employees: {
      view: true,
      create: false,
      update: false,
      delete: false,
      export: false,
    },
    equipment: {
      view: true,
      create: false,
      update: false,
      delete: false,
      export: false,
    },
    documents: {
      view: true,
      create: false,
      update: false,
      delete: false,
      export: false,
    },
    roles: {
      supervisor: {
        approveReports: true,
        rejectReports: true,
        viewAllReports: true,
        manageProjects: true,
        manageWells: true,
      },
      operator: {
        createReports: true,
        editOwnReports: true,
        viewOwnReports: true,
        manageActivities: true,
        manageConsumptions: true,
      },
      assistant: {
        viewReports: true,
        addActivities: true,
        addConsumptions: true,
        manageTools: true,
        uploadDocuments: true,
      },
      client: {
        viewApprovedReports: true,
        downloadReports: true,
        signReports: true,
        viewProjectStatus: true,
        receiveNotifications: true,
      },
    },
    security: {
      requireTwoFactor: false,
      requireStrongPassword: true,
      requireEmailVerification: true,
      requirePhoneVerification: false,
      requireBiometricAuth: false,
    },
    dataAccess: {
      exportAllData: false,
      importData: false,
      bulkOperations: false,
      advancedSearch: true,
      auditLogs: false,
    },
  }
}

onMounted(() => {
  if (props.modelValue)
    permissions.value = { ...props.modelValue }
})
</script>

<template>
  <div class="related-entities-permissions-settings">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-shield-account"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.permissionsSettings') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- Projects Permissions -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.projectsPermissions') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-folder"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.projects') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.projects.view"
                    :label="$t('DrillingReportsModule.common.viewProjects')"
                  />
                  <VCheckbox
                    v-model="permissions.projects.create"
                    :label="$t('DrillingReportsModule.common.createProjects')"
                  />
                  <VCheckbox
                    v-model="permissions.projects.update"
                    :label="$t('DrillingReportsModule.common.updateProjects')"
                  />
                  <VCheckbox
                    v-model="permissions.projects.delete"
                    :label="$t('DrillingReportsModule.common.deleteProjects')"
                  />
                  <VCheckbox
                    v-model="permissions.projects.export"
                    :label="$t('DrillingReportsModule.common.exportProjects')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-well"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.wells') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.wells.view"
                    :label="$t('DrillingReportsModule.common.viewWells')"
                  />
                  <VCheckbox
                    v-model="permissions.wells.create"
                    :label="$t('DrillingReportsModule.common.createWells')"
                  />
                  <VCheckbox
                    v-model="permissions.wells.update"
                    :label="$t('DrillingReportsModule.common.updateWells')"
                  />
                  <VCheckbox
                    v-model="permissions.wells.delete"
                    :label="$t('DrillingReportsModule.common.deleteWells')"
                  />
                  <VCheckbox
                    v-model="permissions.wells.export"
                    :label="$t('DrillingReportsModule.common.exportWells')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Tools Permissions -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.toolsPermissions') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-hammer-wrench"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.tools') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.tools.view"
                    :label="$t('DrillingReportsModule.common.viewTools')"
                  />
                  <VCheckbox
                    v-model="permissions.tools.create"
                    :label="$t('DrillingReportsModule.common.createTools')"
                  />
                  <VCheckbox
                    v-model="permissions.tools.update"
                    :label="$t('DrillingReportsModule.common.updateTools')"
                  />
                  <VCheckbox
                    v-model="permissions.tools.delete"
                    :label="$t('DrillingReportsModule.common.deleteTools')"
                  />
                  <VCheckbox
                    v-model="permissions.tools.export"
                    :label="$t('DrillingReportsModule.common.exportTools')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-account-group"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.employees') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.employees.view"
                    :label="$t('DrillingReportsModule.common.viewEmployees')"
                  />
                  <VCheckbox
                    v-model="permissions.employees.create"
                    :label="$t('DrillingReportsModule.common.createEmployees')"
                  />
                  <VCheckbox
                    v-model="permissions.employees.update"
                    :label="$t('DrillingReportsModule.common.updateEmployees')"
                  />
                  <VCheckbox
                    v-model="permissions.employees.delete"
                    :label="$t('DrillingReportsModule.common.deleteEmployees')"
                  />
                  <VCheckbox
                    v-model="permissions.employees.export"
                    :label="$t('DrillingReportsModule.common.exportEmployees')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Equipment Permissions -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.equipmentPermissions') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-cog"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.equipment') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.equipment.view"
                    :label="$t('DrillingReportsModule.common.viewEquipment')"
                  />
                  <VCheckbox
                    v-model="permissions.equipment.create"
                    :label="$t('DrillingReportsModule.common.createEquipment')"
                  />
                  <VCheckbox
                    v-model="permissions.equipment.update"
                    :label="$t('DrillingReportsModule.common.updateEquipment')"
                  />
                  <VCheckbox
                    v-model="permissions.equipment.delete"
                    :label="$t('DrillingReportsModule.common.deleteEquipment')"
                  />
                  <VCheckbox
                    v-model="permissions.equipment.export"
                    :label="$t('DrillingReportsModule.common.exportEquipment')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-file-document"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.documents') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.documents.view"
                    :label="$t('DrillingReportsModule.common.viewDocuments')"
                  />
                  <VCheckbox
                    v-model="permissions.documents.create"
                    :label="$t('DrillingReportsModule.common.createDocuments')"
                  />
                  <VCheckbox
                    v-model="permissions.documents.update"
                    :label="$t('DrillingReportsModule.common.updateDocuments')"
                  />
                  <VCheckbox
                    v-model="permissions.documents.delete"
                    :label="$t('DrillingReportsModule.common.deleteDocuments')"
                  />
                  <VCheckbox
                    v-model="permissions.documents.export"
                    :label="$t('DrillingReportsModule.common.exportDocuments')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Role-based Permissions -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.roleBasedPermissions') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-account-tie"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.supervisor') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.roles.supervisor.approveReports"
                    :label="$t('DrillingReportsModule.common.approveReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.supervisor.rejectReports"
                    :label="$t('DrillingReportsModule.common.rejectReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.supervisor.viewAllReports"
                    :label="$t('DrillingReportsModule.common.viewAllReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.supervisor.manageProjects"
                    :label="$t('DrillingReportsModule.common.manageProjects')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.supervisor.manageWells"
                    :label="$t('DrillingReportsModule.common.manageWells')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-account-hard-hat"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.operator') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.roles.operator.createReports"
                    :label="$t('DrillingReportsModule.common.createReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.operator.editOwnReports"
                    :label="$t('DrillingReportsModule.common.editOwnReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.operator.viewOwnReports"
                    :label="$t('DrillingReportsModule.common.viewOwnReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.operator.manageActivities"
                    :label="$t('DrillingReportsModule.common.manageActivities')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.operator.manageConsumptions"
                    :label="$t('DrillingReportsModule.common.manageConsumptions')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-account"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.assistant') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.roles.assistant.viewReports"
                    :label="$t('DrillingReportsModule.common.viewReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.assistant.addActivities"
                    :label="$t('DrillingReportsModule.common.addActivities')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.assistant.addConsumptions"
                    :label="$t('DrillingReportsModule.common.addConsumptions')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.assistant.manageTools"
                    :label="$t('DrillingReportsModule.common.manageTools')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.assistant.uploadDocuments"
                    :label="$t('DrillingReportsModule.common.uploadDocuments')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-account-tie-hat"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.client') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.roles.client.viewApprovedReports"
                    :label="$t('DrillingReportsModule.common.viewApprovedReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.client.downloadReports"
                    :label="$t('DrillingReportsModule.common.downloadReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.client.signReports"
                    :label="$t('DrillingReportsModule.common.signReports')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.client.viewProjectStatus"
                    :label="$t('DrillingReportsModule.common.viewProjectStatus')"
                  />
                  <VCheckbox
                    v-model="permissions.roles.client.receiveNotifications"
                    :label="$t('DrillingReportsModule.common.receiveNotifications')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Advanced Permissions -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.advancedPermissions') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-shield-check"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.security') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.security.requireTwoFactor"
                    :label="$t('DrillingReportsModule.common.requireTwoFactor')"
                  />
                  <VCheckbox
                    v-model="permissions.security.requireStrongPassword"
                    :label="$t('DrillingReportsModule.common.requireStrongPassword')"
                  />
                  <VCheckbox
                    v-model="permissions.security.requireEmailVerification"
                    :label="$t('DrillingReportsModule.common.requireEmailVerification')"
                  />
                  <VCheckbox
                    v-model="permissions.security.requirePhoneVerification"
                    :label="$t('DrillingReportsModule.common.requirePhoneVerification')"
                  />
                  <VCheckbox
                    v-model="permissions.security.requireBiometricAuth"
                    :label="$t('DrillingReportsModule.common.requireBiometricAuth')"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-database"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.dataAccess') }}
                </VCardTitle>
                <VCardText>
                  <VCheckbox
                    v-model="permissions.dataAccess.exportAllData"
                    :label="$t('DrillingReportsModule.common.exportAllData')"
                  />
                  <VCheckbox
                    v-model="permissions.dataAccess.importData"
                    :label="$t('DrillingReportsModule.common.importData')"
                  />
                  <VCheckbox
                    v-model="permissions.dataAccess.bulkOperations"
                    :label="$t('DrillingReportsModule.common.bulkOperations')"
                  />
                  <VCheckbox
                    v-model="permissions.dataAccess.advancedSearch"
                    :label="$t('DrillingReportsModule.common.advancedSearch')"
                  />
                  <VCheckbox
                    v-model="permissions.dataAccess.auditLogs"
                    :label="$t('DrillingReportsModule.common.auditLogs')"
                  />
                </VCardText>
              </VCard>
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
.related-entities-permissions-settings {
  inline-size: 100%;
}
</style>
