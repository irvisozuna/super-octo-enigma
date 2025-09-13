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
    individual: 'blue',
    company: 'green',
    cooperative: 'purple',
  }

  return colors[type?.toLowerCase()] || 'grey'
}
</script>

<template>
  <VCardText class="pa-6">
    <h4 class="text-h6 mb-6 d-flex align-center">
      <VIcon class="me-2">
        tabler-users
      </VIcon>
      {{ t('concession.tabs.holders') }}
    </h4>

    <VRow>
      <!-- Current Holder -->
      <VCol
        cols="12"
        lg="6"
      >
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-user-check
            </VIcon>
            {{ t('concession.holders.current_holder') }}
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
                  {{ currentHolder.full_name }}
                </h6>
                <VChip
                  :color="getHolderTypeColor(currentHolder.holder_type)"
                  size="small"
                  variant="tonal"
                >
                  {{ currentHolder.holder_type }}
                </VChip>
              </div>
            </div>

            <VList density="compact">
              <VListItem class="px-0">
                <template #prepend>
                  <VIcon>tabler-id-badge</VIcon>
                </template>
                <VListItemTitle>{{ t('concession_holder.fields.identification_number') }}</VListItemTitle>
                <VListItemSubtitle>{{ currentHolder.identification_number }}</VListItemSubtitle>
              </VListItem>

              <VListItem class="px-0">
                <template #prepend>
                  <VIcon>tabler-phone</VIcon>
                </template>
                <VListItemTitle>{{ t('concession_holder.fields.phone') }}</VListItemTitle>
                <VListItemSubtitle>{{ currentHolder.phone || '-' }}</VListItemSubtitle>
              </VListItem>

              <VListItem class="px-0">
                <template #prepend>
                  <VIcon>tabler-mail</VIcon>
                </template>
                <VListItemTitle>{{ t('concession_holder.fields.email') }}</VListItemTitle>
                <VListItemSubtitle>{{ currentHolder.email || '-' }}</VListItemSubtitle>
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
        <VCard variant="outlined">
          <VCardTitle class="d-flex align-center">
            <VIcon class="me-2">
              tabler-history
            </VIcon>
            {{ t('concession.holders.ownership_history') }}
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
                      {{ transfer.reason || t('concession.holders.transfer_reason') }}
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
                {{ t('concession.holders.no_history') }}
              </p>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VCardText>
</template>

<style scoped>
.timeline-custom .v-timeline-item {
  padding-bottom: 16px;
}
</style>
