<script setup lang="ts">
import { computed, ref } from 'vue'

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

const exportScope = ref<'all' | 'visible'>('all')

function handleExport(format: string) {
  emit('export', { format, scope: exportScope.value })
}
</script>

<template>
  <VDialog
    v-model="dialogValue"
    max-width="400"
  >
    <VCard>
      <VCardTitle>Exportar reporte</VCardTitle>
      <VCardText>
        <VRadioGroup
          v-model="exportScope"
          row
        >
          <VRadio
            label="Todo el reporte"
            value="all"
          />
          <VRadio
            label="Solo lo visible"
            value="visible"
          />
        </VRadioGroup>
        <VList>
          <VListItem
            v-for="format in availableExportFormats"
            :key="format.id"
            @click="handleExport(format.id)"
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
