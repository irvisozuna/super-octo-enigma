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

const notifications = ref({
  reportCreated: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['supervisor', 'operator'],
    template: 'Nuevo reporte de perforación creado: {report_title}',
  },
  reportCompleted: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['supervisor'],
    template: 'Reporte de perforación completado: {report_title}',
  },
  reportApproved: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['operator', 'client'],
    template: 'Reporte de perforación aprobado: {report_title}',
  },
  reportRejected: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['operator'],
    template: 'Reporte de perforación rechazado: {report_title}',
  },
  projectCreated: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor', 'client'],
    template: 'Nuevo proyecto creado: {project_name}',
  },
  projectUpdated: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor', 'client'],
    template: 'Proyecto actualizado: {project_name}',
  },
  wellCreated: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor', 'operator'],
    template: 'Nuevo pozo creado: {well_name}',
  },
  wellUpdated: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor', 'operator'],
    template: 'Pozo actualizado: {well_name}',
  },
  toolAssigned: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['operator'],
    template: 'Herramienta asignada: {tool_name}',
  },
  toolUnassigned: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['operator'],
    template: 'Herramienta desasignada: {tool_name}',
  },
  employeeAdded: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor'],
    template: 'Nuevo empleado agregado: {employee_name}',
  },
  employeeUpdated: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor'],
    template: 'Empleado actualizado: {employee_name}',
  },
  equipmentAdded: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor', 'operator'],
    template: 'Nuevo equipo agregado: {equipment_name}',
  },
  equipmentUpdated: {
    enabled: true,
    channels: ['email'],
    recipients: ['supervisor', 'operator'],
    template: 'Equipo actualizado: {equipment_name}',
  },
  documentUploaded: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['supervisor', 'operator'],
    template: 'Documento subido: {document_name}',
  },
  documentDeleted: {
    enabled: true,
    channels: ['email', 'push'],
    recipients: ['supervisor', 'operator'],
    template: 'Documento eliminado: {document_name}',
  },
})

const channels = ref({
  email: {
    enabled: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    username: '',
    password: '',
  },
  sms: {
    enabled: false,
    apiKey: '',
    apiSecret: '',
    fromNumber: '',
  },
  push: {
    enabled: true,
    serverKey: '',
    senderId: '',
  },
  webhook: {
    enabled: false,
    url: '',
    secret: '',
    verifySsl: true,
  },
})

const notificationChannels = computed(() => [
  { title: 'Email', value: 'email' },
  { title: 'SMS', value: 'sms' },
  { title: 'Push Notification', value: 'push' },
  { title: 'Webhook', value: 'webhook' },
])

const recipientOptions = computed(() => [
  { title: 'Supervisor', value: 'supervisor' },
  { title: 'Operator', value: 'operator' },
  { title: 'Assistant', value: 'assistant' },
  { title: 'Client', value: 'client' },
  { title: 'All Users', value: 'all' },
])

const handleSave = async () => {
  saving.value = true

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    const settings = {
      notifications: notifications.value,
      channels: channels.value,
    }

    emit('saved', settings)
    emit('update:modelValue', settings)
  }
  catch (error) {
    console.error('Error saving notification settings:', error)
  }
  finally {
    saving.value = false
  }
}

const handleReset = () => {
  notifications.value = {
    reportCreated: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['supervisor', 'operator'],
      template: 'Nuevo reporte de perforación creado: {report_title}',
    },
    reportCompleted: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['supervisor'],
      template: 'Reporte de perforación completado: {report_title}',
    },
    reportApproved: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['operator', 'client'],
      template: 'Reporte de perforación aprobado: {report_title}',
    },
    reportRejected: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['operator'],
      template: 'Reporte de perforación rechazado: {report_title}',
    },
    projectCreated: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor', 'client'],
      template: 'Nuevo proyecto creado: {project_name}',
    },
    projectUpdated: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor', 'client'],
      template: 'Proyecto actualizado: {project_name}',
    },
    wellCreated: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor', 'operator'],
      template: 'Nuevo pozo creado: {well_name}',
    },
    wellUpdated: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor', 'operator'],
      template: 'Pozo actualizado: {well_name}',
    },
    toolAssigned: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['operator'],
      template: 'Herramienta asignada: {tool_name}',
    },
    toolUnassigned: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['operator'],
      template: 'Herramienta desasignada: {tool_name}',
    },
    employeeAdded: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor'],
      template: 'Nuevo empleado agregado: {employee_name}',
    },
    employeeUpdated: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor'],
      template: 'Empleado actualizado: {employee_name}',
    },
    equipmentAdded: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor', 'operator'],
      template: 'Nuevo equipo agregado: {equipment_name}',
    },
    equipmentUpdated: {
      enabled: true,
      channels: ['email'],
      recipients: ['supervisor', 'operator'],
      template: 'Equipo actualizado: {equipment_name}',
    },
    documentUploaded: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['supervisor', 'operator'],
      template: 'Documento subido: {document_name}',
    },
    documentDeleted: {
      enabled: true,
      channels: ['email', 'push'],
      recipients: ['supervisor', 'operator'],
      template: 'Documento eliminado: {document_name}',
    },
  }

  channels.value = {
    email: {
      enabled: true,
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      username: '',
      password: '',
    },
    sms: {
      enabled: false,
      apiKey: '',
      apiSecret: '',
      fromNumber: '',
    },
    push: {
      enabled: true,
      serverKey: '',
      senderId: '',
    },
    webhook: {
      enabled: false,
      url: '',
      secret: '',
      verifySsl: true,
    },
  }
}

onMounted(() => {
  if (props.modelValue) {
    if (props.modelValue.notifications)
      notifications.value = { ...props.modelValue.notifications }

    if (props.modelValue.channels)
      channels.value = { ...props.modelValue.channels }
  }
})
</script>

<template>
  <div class="related-entities-notifications-settings">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-bell"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.notificationsSettings') }}
      </VCardTitle>

      <VCardText>
        <VForm @submit.prevent="handleSave">
          <VRow>
            <!-- Report Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4">
                {{ $t('DrillingReportsModule.common.reportNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-file-document-plus"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.reportCreated') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.reportCreated.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.reportCreated.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.reportCreated.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.reportCreated.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.reportCreated.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.reportCreated.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.reportCreated.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-file-document-check"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.reportCompleted') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.reportCompleted.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.reportCompleted.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.reportCompleted.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.reportCompleted.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.reportCompleted.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.reportCompleted.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.reportCompleted.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-file-document-check-outline"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.reportApproved') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.reportApproved.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.reportApproved.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.reportApproved.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.reportApproved.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.reportApproved.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.reportApproved.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.reportApproved.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-file-document-remove"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.reportRejected') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.reportRejected.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.reportRejected.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.reportRejected.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.reportRejected.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.reportRejected.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.reportRejected.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.reportRejected.enabled"
                    type="textarea"
                    rows="3"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Project Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.projectNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-folder-plus"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.projectCreated') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.projectCreated.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.projectCreated.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.projectCreated.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.projectCreated.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.projectCreated.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.projectCreated.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.projectCreated.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-folder-edit"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.projectUpdated') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.projectUpdated.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.projectUpdated.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.projectUpdated.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.projectUpdated.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.projectUpdated.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.projectUpdated.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.projectUpdated.enabled"
                    type="textarea"
                    rows="3"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Well Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.wellNotifications') }}
              </h3>
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
                  {{ $t('DrillingReportsModule.common.wellCreated') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.wellCreated.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.wellCreated.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.wellCreated.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.wellCreated.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.wellCreated.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.wellCreated.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.wellCreated.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-well-edit"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.wellUpdated') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.wellUpdated.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.wellUpdated.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.wellUpdated.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.wellUpdated.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.wellUpdated.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.wellUpdated.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.wellUpdated.enabled"
                    type="textarea"
                    rows="3"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Tool Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.toolNotifications') }}
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
                  {{ $t('DrillingReportsModule.common.toolAssigned') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.toolAssigned.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.toolAssigned.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.toolAssigned.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.toolAssigned.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.toolAssigned.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.toolAssigned.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.toolAssigned.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-hammer-wrench-remove"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.toolUnassigned') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.toolUnassigned.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.toolUnassigned.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.toolUnassigned.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.toolUnassigned.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.toolUnassigned.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.toolUnassigned.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.toolUnassigned.enabled"
                    type="textarea"
                    rows="3"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Employee Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.employeeNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-account-plus"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.employeeAdded') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.employeeAdded.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.employeeAdded.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.employeeAdded.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.employeeAdded.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.employeeAdded.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.employeeAdded.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.employeeAdded.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-account-edit"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.employeeUpdated') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.employeeUpdated.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.employeeUpdated.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.employeeUpdated.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.employeeUpdated.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.employeeUpdated.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.employeeUpdated.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.employeeUpdated.enabled"
                    type="textarea"
                    rows="3"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Equipment Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.equipmentNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-cog-plus"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.equipmentAdded') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.equipmentAdded.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.equipmentAdded.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.equipmentAdded.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.equipmentAdded.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.equipmentAdded.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.equipmentAdded.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.equipmentAdded.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-cog-edit"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.equipmentUpdated') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.equipmentUpdated.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.equipmentUpdated.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.equipmentUpdated.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.equipmentUpdated.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.equipmentUpdated.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.equipmentUpdated.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.equipmentUpdated.enabled"
                    type="textarea"
                    rows="3"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Document Notifications -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.documentNotifications') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-file-document-plus"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.documentUploaded') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.documentUploaded.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.documentUploaded.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.documentUploaded.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.documentUploaded.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.documentUploaded.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.documentUploaded.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.documentUploaded.enabled"
                    type="textarea"
                    rows="3"
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
                    icon="mdi-file-document-remove"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.documentDeleted') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="notifications.documentDeleted.enabled"
                    :label="$t('DrillingReportsModule.common.enableNotification')"
                  />
                  <VSelect
                    v-model="notifications.documentDeleted.channels"
                    :items="notificationChannels"
                    :label="$t('DrillingReportsModule.common.notificationChannels')"
                    :disabled="!notifications.documentDeleted.enabled"
                    multiple
                    chips
                  />
                  <VSelect
                    v-model="notifications.documentDeleted.recipients"
                    :items="recipientOptions"
                    :label="$t('DrillingReportsModule.common.recipients')"
                    :disabled="!notifications.documentDeleted.enabled"
                    multiple
                    chips
                  />
                  <VTextField
                    v-model="notifications.documentDeleted.template"
                    :label="$t('DrillingReportsModule.common.template')"
                    :disabled="!notifications.documentDeleted.enabled"
                    type="textarea"
                    rows="3"
                  />
                </VCardText>
              </VCard>
            </VCol>

            <!-- Notification Channels -->
            <VCol cols="12">
              <h3 class="text-h6 mb-4 mt-6">
                {{ $t('DrillingReportsModule.common.notificationChannels') }}
              </h3>
            </VCol>

            <VCol
              cols="12"
              md="6"
            >
              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-email"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.email') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="channels.email.enabled"
                    :label="$t('DrillingReportsModule.common.enableEmail')"
                  />
                  <VTextField
                    v-model="channels.email.smtpHost"
                    :label="$t('DrillingReportsModule.common.smtpHost')"
                    :disabled="!channels.email.enabled"
                  />
                  <VTextField
                    v-model="channels.email.smtpPort"
                    :label="$t('DrillingReportsModule.common.smtpPort')"
                    :disabled="!channels.email.enabled"
                    type="number"
                  />
                  <VTextField
                    v-model="channels.email.username"
                    :label="$t('DrillingReportsModule.common.username')"
                    :disabled="!channels.email.enabled"
                  />
                  <VTextField
                    v-model="channels.email.password"
                    :label="$t('DrillingReportsModule.common.password')"
                    :disabled="!channels.email.enabled"
                    type="password"
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
                    icon="mdi-phone"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.sms') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="channels.sms.enabled"
                    :label="$t('DrillingReportsModule.common.enableSms')"
                  />
                  <VTextField
                    v-model="channels.sms.apiKey"
                    :label="$t('DrillingReportsModule.common.apiKey')"
                    :disabled="!channels.sms.enabled"
                    type="password"
                  />
                  <VTextField
                    v-model="channels.sms.apiSecret"
                    :label="$t('DrillingReportsModule.common.apiSecret')"
                    :disabled="!channels.sms.enabled"
                    type="password"
                  />
                  <VTextField
                    v-model="channels.sms.fromNumber"
                    :label="$t('DrillingReportsModule.common.fromNumber')"
                    :disabled="!channels.sms.enabled"
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
                    icon="mdi-bell"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.pushNotifications') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="channels.push.enabled"
                    :label="$t('DrillingReportsModule.common.enablePushNotifications')"
                  />
                  <VTextField
                    v-model="channels.push.serverKey"
                    :label="$t('DrillingReportsModule.common.serverKey')"
                    :disabled="!channels.push.enabled"
                    type="password"
                  />
                  <VTextField
                    v-model="channels.push.senderId"
                    :label="$t('DrillingReportsModule.common.senderId')"
                    :disabled="!channels.push.enabled"
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
                    icon="mdi-webhook"
                    class="me-2"
                  />
                  {{ $t('DrillingReportsModule.common.webhooks') }}
                </VCardTitle>
                <VCardText>
                  <VSwitch
                    v-model="channels.webhook.enabled"
                    :label="$t('DrillingReportsModule.common.enableWebhooks')"
                  />
                  <VTextField
                    v-model="channels.webhook.url"
                    :label="$t('DrillingReportsModule.common.webhookUrl')"
                    :disabled="!channels.webhook.enabled"
                  />
                  <VTextField
                    v-model="channels.webhook.secret"
                    :label="$t('DrillingReportsModule.common.webhookSecret')"
                    :disabled="!channels.webhook.enabled"
                    type="password"
                  />
                  <VCheckbox
                    v-model="channels.webhook.verifySsl"
                    :label="$t('DrillingReportsModule.common.verifySsl')"
                    :disabled="!channels.webhook.enabled"
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
.related-entities-notifications-settings {
  inline-size: 100%;
}
</style>
