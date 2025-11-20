<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import { useSqlExpressionPreview } from '@/composables/useSqlExpressionPreview'
import { DataSourceApiService } from '../../../infrastructure/api/services/DataSourceApiService'

// Watcher para actualizar el store cuando cambie el SQL generado

const emit = defineEmits(['finish', 'back'])

const wizardPreviewStore = useWizardPreviewStore()

// Computed para acceder al wizardData del store
const wizardData = computed(() => wizardPreviewStore.wizardData)

const api = new DataSourceApiService()

const { buildFullSqlAndUpdateStore, getHighlightedSql } = useSqlExpressionPreview()

const testLoading = ref(false)

const testResults = ref<{
  success: boolean
  rows: number
  columns: string[]
  sampleData: any[]
} | null>(null)

const testError = ref('')

// Función para generar alias de tabla (usada en el computed)
function generateTableAlias(tableName: string, index: number = 0): string {
  const words = tableName.split('_')
  const alias = words.map(word => word.substring(0, 3)).join('').toLowerCase()

  return index === 0 ? alias : `${alias}${index}`
}

// SQL generado dinámicamente (centralizado)
const generatedSql = computed(() => {
  const data = wizardData.value

  if (data.type === 'custom_sql')
    return data.custom_sql

  if (data.type === 'table') {
    const mainTableAlias = data.tableAlias || (data.table ? data.table.split('_').map(word => word.substring(0, 3)).join('').toLowerCase() : undefined)

    return buildFullSqlAndUpdateStore({
      columns: Array.isArray(data.selectedFields) ? data.selectedFields : [],
      table: data.table,
      tableAlias: mainTableAlias,
      joins: data.joins,
      filters: data.filters,
      sorting: data.sorting,
      groupBy: data.groupBy,
      limit: data.pagination?.pageSize || 50,
    }, sql => wizardPreviewStore.updateWizardData({ sql_generated: sql }))
  }

  if (data.type === 'stored_procedure')
    return `CALL ${data.procedure}(${Object.values(data.procedureParams || {}).join(', ')})`

  return ''
})

const generatedSqlHighlighted = computed(() => getHighlightedSql(generatedSql.value || ''))

// Función para probar la consulta
async function testQuery() {
  testLoading.value = true
  testError.value = ''
  testResults.value = null

  try {
    // Siempre probar el SQL generado, sin enviar 'limit'
    const payload = {
      type: 'custom_sql',
      custom_sql: generatedSql.value,
    }

    if (!wizardData.value.connection_id) {
      testError.value = 'No hay conexión seleccionada'

      return
    }

    const response = await api.testQuery(wizardData.value.connection_id, payload)

    // Soporta ambos formatos de respuesta: data como array o data.data como array
    if (response.success && Array.isArray(response.data)) {
      testResults.value = {
        success: true,
        rows: response.data.length,
        columns: response.data.length > 0 ? Object.keys(response.data[0]) : [],
        sampleData: response.data,
      }
    }
    else if (response.success && response.data && Array.isArray(response.data.data)) {
      testResults.value = {
        success: true,
        rows: response.data.data.length,
        columns: response.data.data.length > 0 ? Object.keys(response.data.data[0]) : [],
        sampleData: response.data.data,
      }
    }
    else {
      testError.value = response.message || 'Error al ejecutar la consulta'
    }
  }
  catch (error) {
    testError.value = `Error al probar la consulta: ${error instanceof Error ? error.message : 'Error desconocido'}`
    testResults.value = null
  }
  finally {
    testLoading.value = false
  }
}

function finishWizard() {
  const data = wizardData.value
  const sqlGenerated = generatedSql.value

  console.log('🔍 Debug finishWizard:')
  console.log('Data type:', data.type)
  console.log('Generated SQL:', sqlGenerated)
  console.log('Selected fields:', data.selectedFields)
  console.log('Joins:', data.joins)
  console.log('Filters:', data.filters)
  console.log('Sorting:', data.sorting)
  console.log('GroupBy:', data.groupBy)

  // Validar que el SQL se haya generado correctamente
  if (!sqlGenerated && data.type === 'table') {
    console.error('❌ Error: No se pudo generar SQL para tabla')
    console.log('Table:', data.table)
    console.log('Selected fields:', data.selectedFields)
  }

  // Enviar la estructura completa del store para preservar toda la información
  const payload = {
    // Información básica
    connection_id: data.connection_id,
    connection_name: data.connection_name,
    name: data.name,
    description: data.description,
    type: data.type,
    isActive: data.isActive,

    // Configuración de tabla
    table: data.table,
    tableColumns: data.tableColumns,
    selectedFields: data.selectedFields,
    fieldAliases: data.fieldAliases,

    // Configuración de joins
    joins: data.joins,
    joinColumns: data.joinColumns,

    // Configuración de filtros y ordenamiento
    filters: data.filters,
    sorting: data.sorting,
    groupBy: data.groupBy,

    // Configuración avanzada
    pagination: data.pagination,
    cacheConfig: data.cacheConfig,

    // Configuración de stored procedure
    procedure: data.procedure,
    procedureParams: data.procedureParams,
    procedureColumns: data.procedureColumns,

    // SQL personalizado
    custom_sql: data.custom_sql,

    // SQL generado para ejecución
    sql_to_execute: sqlGenerated,
    sql_generated: sqlGenerated,
  }

  console.log('📤 Final payload:', payload)

  emit('finish', payload)
}

function backStep() {
  emit('back')
}
</script>

<template>
  <div>
    <VRow>
      <VCol cols="12">
        <VCard
          variant="outlined"
          class="mb-4"
        >
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-database"
              class="me-2"
            />
            Resumen Final
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol cols="6">
                <div class="text-caption">
                  Conexión:
                </div>
                <div class="text-body-1">
                  {{ wizardData.connection_name }}
                </div>
              </VCol>
              <VCol cols="6">
                <div class="text-caption">
                  Tipo:
                </div>
                <div class="text-body-1">
                  {{ wizardData.type === 'custom_sql' ? 'SQL Personalizado'
                    : wizardData.type === 'table' ? 'Tabla/Vista' : 'Stored Procedure' }}
                </div>
              </VCol>
            </VRow>
            <VRow v-if="wizardData.type === 'table'">
              <VCol cols="4">
                <div class="text-caption">
                  Tabla:
                </div>
                <div class="text-body-1">
                  {{ wizardData.table }}
                </div>
              </VCol>
              <VCol cols="4">
                <div class="text-caption">
                  Campos:
                </div>
                <div class="text-body-1">
                  {{ wizardData.selectedFields?.length || 0 }} seleccionados
                </div>
              </VCol>
              <VCol cols="4">
                <div class="text-caption">
                  JOINs:
                </div>
                <div class="text-body-1">
                  {{ wizardData.joins?.length || 0 }} configurados
                </div>
              </VCol>
            </VRow>
            <VRow v-if="wizardData.description">
              <VCol cols="12">
                <div class="text-caption">
                  Descripción:
                </div>
                <div class="text-body-1">
                  {{ wizardData.description }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- SQL Generado -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-code-braces"
              class="me-2"
            />
            SQL Generado
          </VCardTitle>
          <VCardText>
            <div class="mt-4">
              <div class="text-caption text-grey-darken-1 mb-1">
                Vista previa de SQL generado:
              </div>
              <pre
                class="rounded bg-grey-lighten-4 pa-3"
                style="overflow-x: auto;"
                v-html="generatedSqlHighlighted"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Probar Consulta -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-play-circle"
              class="me-2"
            />
            Probar Consulta
          </VCardTitle>
          <VCardText>
            <VBtn
              color="primary"
              :loading="testLoading"
              @click="testQuery"
            >
              <VIcon
                icon="mdi-play"
                class="me-2"
              />
              Probar Consulta
            </VBtn>

            <!-- Resultados de la prueba -->
            <div
              v-if="testResults"
              class="mt-4"
            >
              <VAlert
                type="success"
                variant="tonal"
                class="mb-4"
              >
                <VIcon
                  icon="mdi-check-circle"
                  class="me-2"
                />
                Consulta ejecutada exitosamente. Se encontraron {{ testResults.rows }} registros.
              </VAlert>

              <VCard variant="outlined">
                <VCardTitle class="text-h6">
                  <VIcon
                    icon="mdi-table"
                    class="me-2"
                  />
                  Datos de Ejemplo
                </VCardTitle>
                <VCardText>
                  <VTable density="compact">
                    <thead>
                      <tr>
                        <th
                          v-for="column in testResults.columns"
                          :key="column"
                        >
                          {{ column }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(row, index) in testResults.sampleData"
                        :key="index"
                      >
                        <td
                          v-for="column in testResults.columns"
                          :key="column"
                        >
                          {{ row[column] }}
                        </td>
                      </tr>
                    </tbody>
                  </VTable>
                </VCardText>
              </VCard>
            </div>

            <!-- Error de la prueba -->
            <VAlert
              v-if="testError"
              type="error"
              variant="tonal"
              class="mt-4"
            >
              <VIcon
                icon="mdi-alert-circle"
                class="me-2"
              />
              {{ testError }}
            </VAlert>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <div class="d-flex justify-space-between mt-6">
      <VBtn
        variant="outlined"
        @click="backStep"
      >
        <VIcon
          icon="tabler-arrow-left"
          class="me-2"
        />
        Anterior
      </VBtn>
      <VBtn
        color="primary"
        @click="finishWizard"
      >
        <VIcon
          icon="tabler-check"
          class="me-2"
        />
        Guardar
      </VBtn>
    </div>
  </div>
</template>
