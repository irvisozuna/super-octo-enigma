<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { VBtn, VCard, VCardActions, VCardText, VCardTitle, VDialog, VIcon, VTooltip } from 'vuetify/components'
import hljs from 'highlight.js'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import { useSqlExpressionPreview } from '@/composables/useSqlExpressionPreview'
import 'highlight.js/styles/github.css'

const showModal = ref(false)
const store = useWizardPreviewStore()
const tooltip = ref(false)
const codeBlock = ref(null)

const { buildFullSqlAndUpdateStore, getHighlightedSql, generateTableAlias } = useSqlExpressionPreview()

const generatedSql = computed(() => {
  const data = store.wizardData
  if (!data || !data.type)
    return ''

  if (data.type === 'custom_sql')
    return data.custom_sql || ''
  if (data.type === 'table') {
    const mainTableAlias = generateTableAlias(data.table)

    return buildFullSqlAndUpdateStore({
      columns: Array.isArray(data.selectedFields) ? data.selectedFields : [],
      table: data.table,
      tableAlias: mainTableAlias,
      joins: data.joins || [],
      filters: data.filters || [],
      sorting: data.sorting || [],
      groupBy: data.groupBy || [],
      limit: data.pagination?.pageSize || 50,
    }, sql => store.updateWizardData({ sql_generated: sql }))
  }
  if (data.type === 'stored_procedure')
    return `CALL ${data.procedure}(${Object.values(data.procedureParams || {}).join(', ')})`

  return ''
})

const generatedSqlHighlighted = computed(() => getHighlightedSql(generatedSql.value))

function copySql() {
  navigator.clipboard.writeText(generatedSql.value)
}

// Resaltar sintaxis cuando se abre el modal o cambia el SQL
watch([showModal, generatedSql], async ([open]) => {
  if (open) {
    await nextTick()
    if (codeBlock.value)
      hljs.highlightElement(codeBlock.value)
  }
})
</script>

<template>
  <!-- FAB flotante -->
  <VTooltip
    v-model="tooltip"
    location="top"
  >
    <template #activator="{ props }">
      <VBtn
        v-bind="props"
        icon
        color="primary"
        size="large"
        style="position: fixed; z-index: 1300; box-shadow: 0 4px 24px rgba(0, 0, 0, 18%); inset-block-end: 32px; inset-inline-end: 32px;"
        aria-label="Ver SQL generado"
        @click="showModal = true"
      >
        <VIcon
          icon="tabler-eye-code"
          size="32"
        />
      </VBtn>
    </template>
    <span>Ver SQL generado</span>
  </VTooltip>

  <!-- Modal centrado -->
  <VDialog
    v-model="showModal"
    max-width="600px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between">
        <span class="font-weight-medium">Vista previa SQL</span>
        <VBtn
          icon
          variant="text"
          @click="showModal = false"
        >
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>
      <VCardText style="background: #f8f9fa; font-family: monospace; font-size: 1rem; max-block-size: 60vh; overflow-y: auto;">
        <pre style="margin: 0; white-space: pre-wrap;"><code
ref="codeBlock"
                                                             class="sql"
        v-html="generatedSqlHighlighted"
        /></pre>
      </VCardText>
      <VCardActions class="justify-end">
        <VBtn
          color="primary"
          variant="tonal"
          @click="copySql"
        >
          <VIcon
            icon="tabler-copy"
            class="me-2"
          />Copiar
        </VBtn>
        <VBtn
          variant="text"
          @click="showModal = false"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
