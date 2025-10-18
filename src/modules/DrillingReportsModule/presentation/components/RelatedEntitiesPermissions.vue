<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'saved', permissions: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const saving = ref(false)
const selectedRole = ref('')
const roleDescription = ref('')

const permissions = ref({
  projects: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  wells: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  tools: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  employees: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  equipment: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  documents: {
    create: false,
    read: false,
    update: false,
    delete: false,
  },
  special: {
    export: false,
    import: false,
    admin: false,
    audit: false,
    settings: false,
    monitoring: false,
  },
})

const roleOptions = computed(() => [
  { title: t('DrillingReportsModule.common.admin'), value: 'admin' },
  { title: t('DrillingReportsModule.common.manager'), value: 'manager' },
  { title: t('DrillingReportsModule.common.supervisor'), value: 'supervisor' },
  { title: t('DrillingReportsModule.common.operator'), value: 'operator' },
  { title: t('DrillingReportsModule.common.viewer'), value: 'viewer' },
])

const roleDescriptions = computed(() => ({
  admin: t('DrillingReportsModule.common.adminDescription'),
  manager: t('DrillingReportsModule.common.managerDescription'),
  supervisor: t('DrillingReportsModule.common.supervisorDescription'),
  operator: t('DrillingReportsModule.common.operatorDescription'),
  viewer: t('DrillingReportsModule.common.viewerDescription'),
}))

const handleRoleChange = (role: string) => {
  roleDescription.value = roleDescriptions.value[role as keyof typeof roleDescriptions.value] || ''

  // Set default permissions based on role
  switch (role) {
  case 'admin':
    setAllPermissions(true)
      break;
  case 'manager':
    setManagerPermissions()
      break;
  case 'supervisor':
    setSupervisorPermissions()
      break;
  case 'operator':
    setOperatorPermissions()
      break;
  case 'viewer':
    setViewerPermissions()
      break;
  default:
    setAllPermissions(false)
  }
}

const setAllPermissions = (value: boolean) => {
  Object.keys(permissions.value).forEach(entity => {
    if (entity === 'special') {
      Object.keys(permissions.value.special).forEach(permission => {
        permissions.value.special[permission as keyof typeof permissions.value.special] = value
      })
    }
    else {
      Object.keys(permissions.value[entity as keyof typeof permissions.value]).forEach(permission => {
        (permissions.value[entity as keyof typeof permissions.value] as any)[permission] = value
      })
    }
  })
}

const setManagerPermissions = () => {
  setAllPermissions(false)
  permissions.value.projects = { create: true, read: true, update: true, delete: false }
  permissions.value.wells = { create: true, read: true, update: true, delete: false }
  permissions.value.tools = { create: true, read: true, update: true, delete: false }
  permissions.value.employees = { create: true, read: true, update: true, delete: false }
  permissions.value.equipment = { create: true, read: true, update: true, delete: false }
  permissions.value.documents = { create: true, read: true, update: true, delete: false }
  permissions.value.special = { export: true, import: true, admin: false, audit: true, settings: false, monitoring: false }
}

const setSupervisorPermissions = () => {
  setAllPermissions(false)
  permissions.value.projects = { create: false, read: true, update: true, delete: false }
  permissions.value.wells = { create: true, read: true, update: true, delete: false }
  permissions.value.tools = { create: false, read: true, update: true, delete: false }
  permissions.value.employees = { create: false, read: true, update: false, delete: false }
  permissions.value.equipment = { create: false, read: true, update: true, delete: false }
  permissions.value.documents = { create: true, read: true, update: true, delete: false }
  permissions.value.special = { export: true, import: false, admin: false, audit: false, settings: false, monitoring: false }
}

const setOperatorPermissions = () => {
  setAllPermissions(false)
  permissions.value.projects = { create: false, read: true, update: false, delete: false }
  permissions.value.wells = { create: false, read: true, update: true, delete: false }
  permissions.value.tools = { create: false, read: true, update: true, delete: false }
  permissions.value.employees = { create: false, read: true, update: false, delete: false }
  permissions.value.equipment = { create: false, read: true, update: true, delete: false }
  permissions.value.documents = { create: true, read: true, update: true, delete: false }
  permissions.value.special = { export: false, import: false, admin: false, audit: false, settings: false, monitoring: false }
}

const setViewerPermissions = () => {
  setAllPermissions(false)
  permissions.value.projects = { create: false, read: true, update: false, delete: false }
  permissions.value.wells = { create: false, read: true, update: false, delete: false }
  permissions.value.tools = { create: false, read: true, update: false, delete: false }
  permissions.value.employees = { create: false, read: true, update: false, delete: false }
  permissions.value.equipment = { create: false, read: true, update: false, delete: false }
  permissions.value.documents = { create: false, read: true, update: false, delete: false }
  permissions.value.special = { export: false, import: false, admin: false, audit: false, settings: false, monitoring: false }
}

const handleSave = async () => {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    emit('saved', permissions.value)
    emit('update:modelValue', permissions.value)
  }
  catch (error) {
    console.error('Error saving permissions:', error)
  }
  finally {
    saving.value = false
  }
}

const handleReset = () => {
  selectedRole.value = ''
  roleDescription.value = ''
  setAllPermissions(false)
}

onMounted(() => {
  if (props.modelValue)
    permissions.value = { ...props.modelValue }
})
</script>

<template>
  <div class="related-entities-permissions">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-shield-account"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.permissions') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- Role Selection -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.selectRole') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="selectedRole"
                :items="roleOptions"
                :label="$t('DrillingReportsModule.common.role')"
                :rules="[v => !!v || 'Debe seleccionar un rol']"
                required
                @update:model-value="handleRoleChange"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="roleDescription"
                :label="$t('DrillingReportsModule.common.roleDescription')"
                readonly
              />
            </VCol>

            <!-- Permissions by Entity -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.entityPermissions') }}
              </h3>
            </VCol>

            <!-- Projects Permissions -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-folder"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.projects.title') }}
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.projects.create"
                        :label="$t('DrillingReportsModule.common.create')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.projects.read"
                        :label="$t('DrillingReportsModule.common.read')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.projects.update"
                        :label="$t('DrillingReportsModule.common.update')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.projects.delete"
                        :label="$t('DrillingReportsModule.common.delete')"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Wells Permissions -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-well"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.wells.title') }}
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.wells.create"
                        :label="$t('DrillingReportsModule.common.create')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.wells.read"
                        :label="$t('DrillingReportsModule.common.read')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.wells.update"
                        :label="$t('DrillingReportsModule.common.update')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.wells.delete"
                        :label="$t('DrillingReportsModule.common.delete')"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Tools Permissions -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-tools"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.tools.title') }}
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.tools.create"
                        :label="$t('DrillingReportsModule.common.create')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.tools.read"
                        :label="$t('DrillingReportsModule.common.read')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.tools.update"
                        :label="$t('DrillingReportsModule.common.update')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.tools.delete"
                        :label="$t('DrillingReportsModule.common.delete')"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Employees Permissions -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-account-group"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.employees.title') }}
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.employees.create"
                        :label="$t('DrillingReportsModule.common.create')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.employees.read"
                        :label="$t('DrillingReportsModule.common.read')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.employees.update"
                        :label="$t('DrillingReportsModule.common.update')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.employees.delete"
                        :label="$t('DrillingReportsModule.common.delete')"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Equipment Permissions -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-cog"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.equipment.title') }}
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.equipment.create"
                        :label="$t('DrillingReportsModule.common.create')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.equipment.read"
                        :label="$t('DrillingReportsModule.common.read')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.equipment.update"
                        :label="$t('DrillingReportsModule.common.update')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.equipment.delete"
                        :label="$t('DrillingReportsModule.common.delete')"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Documents Permissions -->
            <VCol cols="12">
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-file-document"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.documents.title') }}
                </VCardTitle>
                <VCardText>
                  <VRow>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.documents.create"
                        :label="$t('DrillingReportsModule.common.create')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.documents.read"
                        :label="$t('DrillingReportsModule.common.read')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.documents.update"
                        :label="$t('DrillingReportsModule.common.update')"
                      />
                    </VCol>
                    <VCol
                      cols="12"
                      md="3"
                    >
                      <VCheckbox
                        v-model="permissions.documents.delete"
                        :label="$t('DrillingReportsModule.common.delete')"
                      />
                    </VCol>
                  </VRow>
                </VCardText>
              </VCard>
            </VCol>

            <!-- Special Permissions -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.specialPermissions') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="permissions.special.export"
                :label="$t('DrillingReportsModule.common.exportData')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="permissions.special.import"
                :label="$t('DrillingReportsModule.common.importData')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="permissions.special.admin"
                :label="$t('DrillingReportsModule.common.adminAccess')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="permissions.special.audit"
                :label="$t('DrillingReportsModule.common.auditLogs')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="permissions.special.settings"
                :label="$t('DrillingReportsModule.common.systemSettings')"
              />
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCheckbox
                v-model="permissions.special.monitoring"
                :label="$t('DrillingReportsModule.common.systemMonitoring')"
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
.related-entities-permissions {
  inline-size: 100%;
}
</style>
