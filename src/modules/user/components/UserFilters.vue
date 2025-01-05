<template>
  <VCardItem class="pb-4">
    <VCardTitle>{{ $t('filters') }}</VCardTitle>
  </VCardItem>
  <VCardText>
    <VRow>
      <!-- 👉 Select Role -->
      <VCol cols="12" sm="4">
        <api-data-source api-path="company/roles?onlykeyvalue=true" @loaded="(response) => roleOptions = response">
          <template v-slot="{ loading }">
            <VSelect v-model="filters.role" :items="roleOptions" item-title="name" item-value="id" label="Select Role"
              variant="outlined" dense clearable chips multiple closable-chips :loading="loading" :disabled="loading"
              @update:model-value="emitFilters">
              <template #prepend-item v-if="loading">
                <span class="text-secondary text-caption">Loading roles...</span>
              </template>
            </VSelect>
          </template>
        </api-data-source>
      </VCol>
    </VRow>
  </VCardText>
</template>

<script setup lang="ts">
import { defineEmits, defineProps, ref } from 'vue';

const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({ search: '', role: '' }),
  },
});

const emits = defineEmits(['update:filters']);

const roleOptions = ref([]);
const filters = ref({ ...props.initialFilters });

function emitFilters() {
  emits('update:filters', { ...filters.value }); // Emitir filtros actualizados al padre
}
</script>
