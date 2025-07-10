<!-- ColumnConfigMolecule.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

interface FieldConfigDTO {
  field: string
  label: string
  type: string
  width?: number
  visible?: boolean
  frozen?: boolean
}

interface Props {
  visibleColumns: string[]
  availableColumns: FieldConfigDTO[]
  frozenColumns: string[]
}

interface Emits {
  columnVisibilityUpdate: [columns: string[]]
  frozenColumnsUpdate: [columns: string[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()

const showColumnMenu = ref(false)

const columnOptions = computed(() =>
  props.availableColumns.map(column => ({
    ...column,
    checked: props.visibleColumns.includes(column.field),
    frozen: props.frozenColumns.includes(column.field),
  })),
)

const handleColumnToggle = (field: string, checked: boolean): void => {
  let newVisibleColumns: string[]

  if (checked)
    newVisibleColumns = [...props.visibleColumns, field]
  else
    newVisibleColumns = props.visibleColumns.filter(col => col !== field)

  emit('columnVisibilityUpdate', newVisibleColumns)
}

const handleFrozenToggle = (field: string, frozen: boolean): void => {
  let newFrozenColumns: string[]

  if (frozen)
    newFrozenColumns = [...props.frozenColumns, field]
  else
    newFrozenColumns = props.frozenColumns.filter(col => col !== field)

  emit('frozenColumnsUpdate', newFrozenColumns)
}

const handleSelectAll = (): void => {
  const allFields = props.availableColumns.map(col => col.field)

  emit('columnVisibilityUpdate', allFields)
}

const handleSelectNone = (): void => {
  emit('columnVisibilityUpdate', [])
}
</script>

<template>
  <VMenu
    v-model="showColumnMenu"
    location="bottom end"
    :close-on-content-click="false"
  >
    <template #activator="{ props: menuProps }">
      <VBtn
        icon
        variant="text"
        density="compact"
        v-bind="menuProps"
        :tooltip="t('reports.columns.configure')"
      >
        <VIcon icon="tabler-columns" />
      </VBtn>
    </template>

    <VCard
      min-width="300"
      max-width="400"
    >
      <VCardTitle class="d-flex align-center justify-space-between">
        <span>{{ t('reports.columns.title') }}</span>
        <VBtn
          icon
          size="small"
          variant="text"
          @click="showColumnMenu = false"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VCardText class="pa-0">
        <VList
          density="compact"
          class="pa-0"
        >
          <!-- Select All/None Actions -->
          <VListItem>
            <VBtnGroup
              variant="outlined"
              density="compact"
              class="w-100"
            >
              <VBtn
                size="small"
                @click="handleSelectAll"
              >
                {{ t('common.selectAll') }}
              </VBtn>
              <VBtn
                size="small"
                @click="handleSelectNone"
              >
                {{ t('common.selectNone') }}
              </VBtn>
            </VBtnGroup>
          </VListItem>

          <VDivider />

          <!-- Column List -->
          <VListItem
            v-for="column in columnOptions"
            :key="column.field"
            class="px-3"
          >
            <template #prepend>
              <VCheckbox
                :model-value="column.checked"
                density="compact"
                hide-details
                @update:model-value="(checked) => handleColumnToggle(column.field, checked)"
              />
            </template>

            <VListItemTitle class="text-body-2">
              {{ column.label }}
            </VListItemTitle>

            <template #append>
              <VBtn
                v-if="column.checked"
                icon
                size="x-small"
                variant="text"
                :color="column.frozen ? 'primary' : undefined"
                :tooltip="column.frozen ? t('reports.columns.unfreeze') : t('reports.columns.freeze')"
                @click="handleFrozenToggle(column.field, !column.frozen)"
              >
                <VIcon
                  :icon="column.frozen ? 'tabler-pin' : 'tabler-pin-off'"
                  size="small"
                />
              </VBtn>
            </template>
          </VListItem>
        </VList>
      </VCardText>
    </VCard>
  </VMenu>
</template>

<style scoped>
.v-list-item {
  min-block-size: 40px;
}
</style>
