<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: boolean
  availableExportFormats: any[]
  exportLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'export', format: string): void
}>()

const dialogValue = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})
</script>

<template>
  <VDialog
    v-model="dialogValue"
    max-width="400"
  >
    <VCard>
      <VCardTitle>Exportar reporte</VCardTitle>
      <VCardText>
        <VList>
          <VListItem
            v-for="format in availableExportFormats"
            :key="format.id"
            @click="$emit('export', format.id)"
          >
            <template #prepend>
              <VIcon
                :icon="format.icon"
                :color="format.color"
              />
            </template>
            <VListItemTitle>{{ format.name }}</VListItemTitle>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </VDialog>
</template>
