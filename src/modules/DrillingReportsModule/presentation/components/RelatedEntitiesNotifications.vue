<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  modelValue?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'notificationClicked', notification: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const notifications = ref([
  {
    id: 1,
    type: 'project',
    title: 'Nuevo Proyecto Creado',
    message: 'El proyecto "Exploración Norte" ha sido creado exitosamente',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    read: false,
  },
  {
    id: 2,
    type: 'well',
    title: 'Pozo Completado',
    message: 'El pozo "Norte-001" ha sido completado y está listo para producción',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: 3,
    type: 'tool',
    title: 'Herramienta Requiere Mantenimiento',
    message: 'La broca de perforación #12345 requiere mantenimiento programado',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 4,
    type: 'employee',
    title: 'Certificación Próxima a Vencer',
    message: 'La certificación de seguridad de Juan Pérez vence en 30 días',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 5,
    type: 'equipment',
    title: 'Equipo Asignado',
    message: 'La perforadora #789 ha sido asignada al proyecto "Exploración Norte"',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: 6,
    type: 'document',
    title: 'Documento Aprobado',
    message: 'El manual de seguridad ha sido aprobado por el supervisor',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    read: true,
  },
  {
    id: 7,
    type: 'project',
    title: 'Proyecto Retrasado',
    message: 'El proyecto "Exploración Sur" está retrasado en 5 días',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: false,
  },
  {
    id: 8,
    type: 'well',
    title: 'Pozo en Problemas',
    message: 'El pozo "Sur-002" ha encontrado problemas geológicos',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
  },
])

const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    project: 'primary',
    well: 'success',
    tool: 'warning',
    employee: 'info',
    equipment: 'error',
    document: 'purple',
  }

  return colors[type] || 'grey'
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    project: 'mdi-folder',
    well: 'mdi-well',
    tool: 'mdi-tools',
    employee: 'mdi-account',
    equipment: 'mdi-cog',
    document: 'mdi-file-document',
  }

  return icons[type] || 'mdi-help-circle'
}

const getNotificationTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    project: t('DrillingReportsModule.projects.title'),
    well: t('DrillingReportsModule.wells.title'),
    tool: t('DrillingReportsModule.tools.title'),
    employee: t('DrillingReportsModule.employees.title'),
    equipment: t('DrillingReportsModule.equipment.title'),
    document: t('DrillingReportsModule.documents.title'),
  }

  return labels[type] || type
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1)
    return 'Hace menos de 1 minuto'
  if (minutes < 60)
    return `Hace ${minutes} minutos`
  if (hours < 24)
    return `Hace ${hours} horas`
  if (days === 1)
    return 'Hace 1 día'

  return `Hace ${days} días`
}

const handleMarkAllRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
}

const handleClearAll = () => {
  notifications.value = []
}

onMounted(() => {
  // Load notifications from API or store
})
</script>

<template>
  <div class="related-entities-notifications">
    <VCard>
      <VCardTitle>
        <VIcon
          icon="mdi-bell"
          class="me-2"
        />
        {{ $t('DrillingReportsModule.common.notifications') }}
      </VCardTitle>

      <VCardText>
        <VList>
          <VListItem
            v-for="notification in notifications"
            :key="notification.id"
            :class="{ 'notification-read': notification.read }"
          >
            <template #prepend>
              <VAvatar
                :color="getNotificationColor(notification.type)"
                size="small"
              >
                <VIcon :icon="getNotificationIcon(notification.type)" />
              </VAvatar>
            </template>

            <VListItemTitle>{{ notification.title }}</VListItemTitle>
            <VListItemSubtitle>{{ notification.message }}</VListItemSubtitle>

            <template #append>
              <div class="d-flex flex-column align-end">
                <VChip
                  :color="getNotificationColor(notification.type)"
                  size="small"
                  class="mb-2"
                >
                  {{ getNotificationTypeLabel(notification.type) }}
                </VChip>
                <div class="text-caption text-medium-emphasis">
                  {{ formatTime(notification.timestamp) }}
                </div>
              </div>
            </template>
          </VListItem>
        </VList>
      </VCardText>

      <VCardActions>
        <VSpacer />
        <VBtn
          color="primary"
          variant="text"
          @click="handleMarkAllRead"
        >
          {{ $t('DrillingReportsModule.common.markAllRead') }}
        </VBtn>
        <VBtn
          color="grey"
          variant="text"
          @click="handleClearAll"
        >
          {{ $t('DrillingReportsModule.common.clearAll') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </div>
</template>

<style scoped>
.related-entities-notifications {
  inline-size: 100%;
}

.notification-read {
  opacity: 0.6;
}
</style>
