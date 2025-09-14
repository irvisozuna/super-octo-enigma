<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  concession: any
  loading?: boolean
}

interface Emits {
  (e: 'refresh'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const { t } = useI18n()

// Computed
const currentHolder = computed(() => props.concession?.holder)
const holderHistory = computed(() => props.concession?.transfers || [])

// Methods
const formatDate = (date: string) => {
  if (!date)
    return '-'

  return new Date(date).toLocaleDateString()
}

const getHolderTypeColor = (type: string) => {
  const colors = {
    NATURAL: 'success',
    JURIDICA: 'info',
    individual: 'success',
    company: 'info',
    cooperative: 'warning',
  }

  return colors[type] || 'primary'
}
</script>

<template>
  <VCard>
    <VCardText class="pa-6">
      <h4 class="text-h6 mb-6 d-flex align-center">
        <VIcon class="me-2">
          tabler-users
        </VIcon>
        {{ t('TransportModule.concession.tabs.holders') }}
      </h4>

      <VRow>
        <!-- Current Holder -->
        <VCol
          cols="12"
          lg="6"
        >
          <VCard variant="elevated">
            <VCardTitle class="d-flex align-center">
              <VIcon class="me-2">
                tabler-user-check
              </VIcon>
              {{ t('TransportModule.concession.holders.current_holder') }}
            </VCardTitle>

            <VCardText v-if="currentHolder">
              <div class="d-flex align-center mb-4">
                <VAvatar
                  size="48"
                  :color="getHolderTypeColor(currentHolder.holder_type)"
                  variant="tonal"
                  class="me-3"
                >
                  <VIcon>tabler-user</VIcon>
                </VAvatar>

                <div>
                  <h6 class="text-h6 font-weight-bold">
                    {{ currentHolder.fullName || currentHolder.full_name }}
                  </h6>
                  <VChip
                    :color="getHolderTypeColor(currentHolder.holderType || currentHolder.holder_type)"
                    size="small"
                    variant="tonal"
                  >
                    {{ currentHolder.holderTypeLabel || currentHolder.holder_type }}
                  </VChip>
                </div>
              </div>

              <VList density="compact">
                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon>tabler-id</VIcon>
                  </template>
                  <VListItemTitle>Documento de Identidad</VListItemTitle>
                  <VListItemSubtitle>{{ currentHolder.documentNumber || currentHolder.identification_number || '-' }}</VListItemSubtitle>
                </VListItem>

                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon>tabler-building</VIcon>
                  </template>
                  <VListItemTitle>Tipo de Persona</VListItemTitle>
                  <VListItemSubtitle>{{ currentHolder.holderTypeLabel || currentHolder.holder_type || '-' }}</VListItemSubtitle>
                </VListItem>

                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon>tabler-phone</VIcon>
                  </template>
                  <VListItemTitle>Teléfono</VListItemTitle>
                  <VListItemSubtitle>{{ currentHolder.phone || '-' }}</VListItemSubtitle>
                </VListItem>

                <VListItem class="px-0">
                  <template #prepend>
                    <VIcon>tabler-mail</VIcon>
                  </template>
                  <VListItemTitle>Email</VListItemTitle>
                  <VListItemSubtitle>{{ currentHolder.email || '-' }}</VListItemSubtitle>
                </VListItem>

                <VListItem
                  v-if="currentHolder.address"
                  class="px-0"
                >
                  <template #prepend>
                    <VIcon>tabler-map-pin</VIcon>
                  </template>
                  <VListItemTitle>Dirección</VListItemTitle>
                  <VListItemSubtitle>{{ currentHolder.address }}</VListItemSubtitle>
                </VListItem>

                <VListItem
                  v-if="currentHolder.createdAt"
                  class="px-0"
                >
                  <template #prepend>
                    <VIcon>tabler-calendar</VIcon>
                  </template>
                  <VListItemTitle>Fecha de Registro</VListItemTitle>
                  <VListItemSubtitle>{{ formatDate(currentHolder.createdAt) }}</VListItemSubtitle>
                </VListItem>
              </VList>
            </VCardText>

            <VCardText
              v-else
              class="text-center py-8"
            >
              <VIcon
                size="48"
                color="grey-400"
                class="mb-2"
              >
                tabler-user-off
              </VIcon>
              <p class="text-body-2">
                {{ t('concession.holders.no_holder') }}
              </p>
            </VCardText>
          </VCard>
        </VCol>

        <!-- Ownership History -->
        <VCol
          cols="12"
          lg="6"
        >
          <VCard variant="elevated">
            <VCardTitle class="d-flex align-center">
              <VIcon class="me-2">
                tabler-history
              </VIcon>
              {{ t('TransportModule.concession.holders.ownership_history') }}
            </VCardTitle>

            <VCardText>
              <VTimeline
                v-if="holderHistory.length > 0"
                side="end"
                density="compact"
                class="timeline-custom"
              >
                <VTimelineItem
                  v-for="transfer in holderHistory"
                  :key="transfer.id"
                  size="small"
                  :dot-color="transfer.type === 'transfer' ? 'primary' : 'success'"
                >
                  <template #icon>
                    <VIcon
                      :icon="transfer.type === 'transfer' ? 'tabler-arrows-exchange' : 'tabler-user-plus'"
                      size="16"
                    />
                  </template>

                  <VCard
                    variant="tonal"
                    density="compact"
                  >
                    <VCardText class="pa-3">
                      <div class="d-flex justify-space-between align-center mb-2">
                        <span class="font-weight-medium">{{ transfer.from_holder || transfer.to_holder }}</span>
                        <VChip size="x-small">
                          {{ formatDate(transfer.transfer_date) }}
                        </VChip>
                      </div>
                      <p class="text-caption mb-0">
                        {{ transfer.reason || t('TransportModule.concession.holders.transfer_reason') }}
                      </p>
                    </VCardText>
                  </VCard>
                </VTimelineItem>
              </VTimeline>

              <div
                v-else
                class="text-center py-8"
              >
                <VIcon
                  size="48"
                  color="grey-400"
                  class="mb-2"
                >
                  tabler-history-off
                </VIcon>
                <p class="text-body-2">
                  {{ t('TransportModule.concession.holders.no_history') }}
                </p>
              </div>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style scoped>
.timeline-custom .v-timeline-item {
  padding-block-end: 16px;
}
</style>
