<script setup lang="ts">
import { computed } from 'vue'

export interface Personnel {
  id: string
  name: string
  position: string
  role?: string
}

export interface PersonnelCardProps {
  personnel?: Personnel[]
  manager?: Personnel | null
  loading?: boolean
  maxVisible?: number
}

const props = withDefaults(defineProps<PersonnelCardProps>(), {
  personnel: () => [],
  maxVisible: 6,
})

defineEmits<{
  'view-all': []
  'assign': []
}>()

const personnelCount = computed(() => props.personnel?.length || 0)

const visiblePersonnel = computed(() =>
  props.personnel?.slice(0, props.maxVisible) || [],
)

const remainingCount = computed(() =>
  Math.max(0, (props.personnel?.length || 0) - props.maxVisible),
)

const getInitials = (name: string) => {
  const parts = name.split(' ')
  if (parts.length >= 2)
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()

  return name.substring(0, 2).toUpperCase()
}

const avatarColors = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'error',
]

const getAvatarColor = (index: number) => {
  return avatarColors[index % avatarColors.length]
}
</script>

<template>
  <VCard
    variant="outlined"
    class="personnel-card"
    :loading="loading"
  >
    <VCardText>
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-users"
            size="24"
            class="text-primary"
          />
          <h6 class="text-h6 mb-0">
            Personal Asignado
          </h6>
        </div>
        <VChip
          :color="personnelCount > 0 ? 'primary' : 'grey'"
          variant="tonal"
          size="small"
        >
          {{ personnelCount }} {{ personnelCount === 1 ? 'persona' : 'personas' }}
        </VChip>
      </div>

      <template v-if="personnel && personnel.length > 0">
        <div class="personnel-avatars mb-3">
          <VTooltip
            v-for="(person, index) in visiblePersonnel"
            :key="person.id"
            location="top"
          >
            <template #activator="{ props: tooltipProps }">
              <VAvatar
                v-bind="tooltipProps"
                :color="getAvatarColor(index)"
                size="40"
                class="personnel-avatar"
                :style="{ zIndex: personnel.length - index }"
              >
                <span class="text-sm font-weight-medium">
                  {{ getInitials(person.name) }}
                </span>
              </VAvatar>
            </template>
            <span>{{ person.name }} - {{ person.position }}</span>
          </VTooltip>

          <VAvatar
            v-if="remainingCount > 0"
            color="grey-lighten-2"
            size="40"
            class="personnel-avatar"
          >
            <span class="text-sm font-weight-medium text-grey-darken-2">
              +{{ remainingCount }}
            </span>
          </VAvatar>
        </div>

        <VDivider class="mb-3" />

        <div
          v-if="manager"
          class="manager-info"
        >
          <div class="d-flex align-center gap-3">
            <VAvatar
              color="primary"
              size="36"
              variant="tonal"
            >
              <VIcon
                icon="tabler-user-star"
                size="20"
              />
            </VAvatar>
            <div>
              <p class="text-caption text-medium-emphasis mb-0">
                Gerente de Proyecto
              </p>
              <p class="text-body-2 font-weight-medium mb-0">
                {{ manager.name }}
              </p>
            </div>
          </div>
        </div>
      </template>

      <VAlert
        v-else
        type="info"
        variant="tonal"
        density="compact"
      >
        No hay personal asignado
      </VAlert>
    </VCardText>

    <VCardActions>
      <VBtn
        variant="text"
        size="small"
        @click="$emit('view-all')"
      >
        Ver Todos
        <VIcon
          end
          icon="tabler-arrow-right"
          size="18"
        />
      </VBtn>
      <VSpacer />
      <VBtn
        color="primary"
        variant="tonal"
        size="small"
        prepend-icon="tabler-user-plus"
        @click="$emit('assign')"
      >
        Asignar
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<style scoped lang="scss">
.personnel-card {
  block-size: 100%;
}

.personnel-avatars {
  display: flex;
  align-items: center;
  gap: -0.5rem;

  .personnel-avatar {
    margin-inline-end: -0.5rem;
    border: 2px solid rgb(var(--v-theme-surface));
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      z-index: 999 !important;
    }
  }
}

.manager-info {
  padding: 0.75rem;
  background-color: rgba(var(--v-theme-primary), 0.05);
  border-radius: 8px;
}
</style>
