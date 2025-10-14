<script setup lang="ts">
import type { EmployeeCertificationEntity } from '../../../domain/entities/EmployeeEntity'

interface Props {
  certification: EmployeeCertificationEntity
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false,
})

const emit = defineEmits<{
  edit: [cert: EmployeeCertificationEntity]
  delete: [cert: EmployeeCertificationEntity]
}>()

function formatDate(date?: string) {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })
}

function isExpiringSoon(expiryDate?: string) {
  if (!expiryDate)
    return false
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  return diffDays > 0 && diffDays <= 30
}

function isExpired(expiryDate?: string) {
  if (!expiryDate)
    return false

  return new Date(expiryDate) < new Date()
}
</script>

<template>
  <VCard
    :color="isExpired(certification.expiry_date) ? 'error' : isExpiringSoon(certification.expiry_date) ? 'warning' : undefined"
    :variant="isExpired(certification.expiry_date) || isExpiringSoon(certification.expiry_date) ? 'tonal' : 'elevated'"
  >
    <VCardText>
      <div class="d-flex align-center justify-space-between mb-3">
        <div>
          <h6 class="text-h6 mb-1">
            {{ certification.certification_name }}
          </h6>
          <p class="text-body-2 text-medium-emphasis mb-0">
            {{ certification.issuing_organization }}
          </p>
        </div>

        <VMenu v-if="editable">
          <template #activator="{ props: menuProps }">
            <VBtn
              v-bind="menuProps"
              icon
              variant="text"
              size="small"
            >
              <VIcon>tabler-dots-vertical</VIcon>
            </VBtn>
          </template>

          <VList>
            <VListItem @click="emit('edit', certification)">
              <template #prepend>
                <VIcon>tabler-pencil</VIcon>
              </template>
              <VListItemTitle>Editar</VListItemTitle>
            </VListItem>
            <VListItem @click="emit('delete', certification)">
              <template #prepend>
                <VIcon color="error">
                  tabler-trash
                </VIcon>
              </template>
              <VListItemTitle class="text-error">
                Eliminar
              </VListItemTitle>
            </VListItem>
          </VList>
        </VMenu>
      </div>

      <VDivider class="my-3" />

      <div class="d-flex flex-column gap-2">
        <div class="d-flex align-center gap-2">
          <VIcon
            size="18"
            color="primary"
          >
            tabler-calendar
          </VIcon>
          <span class="text-body-2">
            Emitido: {{ formatDate(certification.issue_date) }}
          </span>
        </div>

        <div
          v-if="certification.expiry_date"
          class="d-flex align-center gap-2"
        >
          <VIcon
            size="18"
            :color="isExpired(certification.expiry_date) ? 'error' : isExpiringSoon(certification.expiry_date) ? 'warning' : 'default'"
          >
            tabler-clock-hour-4
          </VIcon>
          <span class="text-body-2">
            Vence: {{ formatDate(certification.expiry_date) }}
            <VChip
              v-if="isExpired(certification.expiry_date)"
              size="x-small"
              color="error"
              class="ml-2"
            >
              Vencida
            </VChip>
            <VChip
              v-else-if="isExpiringSoon(certification.expiry_date)"
              size="x-small"
              color="warning"
              class="ml-2"
            >
              Por vencer
            </VChip>
          </span>
        </div>

        <div
          v-if="certification.credential_id"
          class="d-flex align-center gap-2"
        >
          <VIcon
            size="18"
            color="default"
          >
            tabler-id-badge
          </VIcon>
          <span class="text-body-2 font-mono">
            {{ certification.credential_id }}
          </span>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style scoped>
.font-mono {
  font-family: 'Courier New', monospace;
}
</style>
