<script setup lang="ts">
interface RoleOption {
  id: number | string
  name: string
}

interface Filters {
  search: string
  role: (string | number)[]
}

const props = defineProps({
  initialFilters: {
    type: Object as () => Filters,
    default: () => ({
      search: '',
      role: [],
    }),
  },
})

const emit = defineEmits<{
  'update:filters': [filters: Filters]
}>()

const roleOptions = ref<RoleOption[]>([])
const filters = ref<Filters>({ ...props.initialFilters })

function emitFilters() {
  emit('update:filters', { ...filters.value })
}
</script>

<template>
  <VCardItem class="pb-4">
    <VCardTitle>{{ $t('filters') }}</VCardTitle>
  </VCardItem>
  <VCardText>
    <VRow>
      <!-- 👉 Select Role -->
      <VCol
        cols="12"
        sm="4"
      >
        <ApiDataSource
          api-path="company/roles"
          :query-params="{ onlykeyvalue: true }"
          @loaded="roleOptions = $event"
        >
          <template #default="{ loading }">
            <VSelect
              v-model="filters.role"
              :items="roleOptions"
              item-title="name"
              item-value="id"
              :label="$t('select role')"
              variant="outlined"
              dense
              clearable
              chips
              multiple
              closable-chips
              :loading="loading"
              :disabled="loading"
              @update:model-value="emitFilters"
            >
              <template
                v-if="loading"
                #prepend-item
              >
                <span class="text-secondary text-caption">{{ $t('loading') }}</span>
              </template>
            </VSelect>
          </template>
        </ApiDataSource>
      </VCol>
    </VRow>
  </VCardText>
</template>
