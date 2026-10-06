<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import { ConnectionApiService } from '../../../../Connection/infrastructure/api/services/ConnectionApiService'
import { useConnectionStore } from '../../../../Connection/presentation/stores/connectionStore'

const emit = defineEmits(['next'])

const connectionStore = useConnectionStore()
const wizardPreviewStore = useWizardPreviewStore()

// Computed para acceder al wizardData del store
const wizardData = computed(() => wizardPreviewStore.wizardData)

// Computed para actualizar el store
const selectedConnection = computed({
  get: () => wizardData.value.connection_id || '',
  set: val => wizardPreviewStore.updateWizardData({ connection_id: val }),
})

const reportName = computed({
  get: () => wizardData.value.name || '',
  set: val => wizardPreviewStore.updateWizardData({ name: val }),
})

const description = computed({
  get: () => wizardData.value.description || '',
  set: val => wizardPreviewStore.updateWizardData({ description: val }),
})

const sourceType = computed({
  get: () => wizardData.value.type || 'custom_sql',
  set: val => wizardPreviewStore.updateWizardData({ type: val }),
})

const customSql = computed({
  get: () => wizardData.value.custom_sql || '',
  set: val => wizardPreviewStore.updateWizardData({ custom_sql: val }),
})

const selectedTable = computed({
  get: () => wizardData.value.table || '',
  set: val => wizardPreviewStore.updateWizardData({ table: val }),
})

const tableColumns = computed({
  get: () => wizardData.value.tableColumns || [],
  set: val => wizardPreviewStore.updateWizardData({ tableColumns: val }),
})

const selectedProcedure = computed({
  get: () => wizardData.value.procedure || '',
  set: val => wizardPreviewStore.updateWizardData({ procedure: val }),
})

const procedureParams = computed({
  get: () => wizardData.value.procedureParams || {},
  set: val => wizardPreviewStore.updateWizardData({ procedureParams: val }),
})

const procedureColumns = computed({
  get: () => wizardData.value.procedureColumns || [],
  set: val => wizardPreviewStore.updateWizardData({ procedureColumns: val }),
})

const joins = computed({
  get: () => wizardData.value.joins || [],
  set: val => wizardPreviewStore.updateWizardData({ joins: val }),
})

const joinColumns = computed({
  get: () => wizardData.value.joinColumns || {},
  set: val => wizardPreviewStore.updateWizardData({ joinColumns: val }),
})

const loadingConnections = ref(false)
const tableOptions = ref([])
const loadingTables = ref(false)
const tableError = ref('')
const procedureOptions = ref([])
const loadingProcedures = ref(false)
const procedureError = ref('')
const initialized = ref(false)
const lastRequestedTable = ref<string | null>(null)
const loadingTableColumns = ref(false)

const canContinue = computed(() => {
  if (!selectedConnection.value || !reportName.value || !sourceType.value)
    return false
  if (sourceType.value === 'custom_sql')
    return !!customSql.value
  if (sourceType.value === 'table')
    return !!selectedTable.value
  if (sourceType.value === 'stored_procedure')
    return !!selectedProcedure.value

  return false
})

const api = new ConnectionApiService()

// Función para generar alias de tabla
function generateTableAlias(tableName: string, index: number = 0): string {
  // Tomar las primeras 3 letras de cada palabra del nombre de la tabla
  const words = tableName.split('_')
  const alias = words.map(word => word.substring(0, 3)).join('').toLowerCase()

  return index === 0 ? alias : `${alias}${index}`
}

const joinTypes = [
  { value: 'INNER', label: 'INNER JOIN', description: 'Devuelve solo las filas que tienen coincidencias en ambas tablas.' },
  { value: 'LEFT', label: 'LEFT JOIN', description: 'Devuelve todas las filas de la tabla principal y las coincidencias de la tabla relacionada.' },
  { value: 'RIGHT', label: 'RIGHT JOIN', description: 'Devuelve todas las filas de la tabla relacionada y las coincidencias de la tabla principal.' },
]

const joinTableOptions = computed(() => tableOptions.value.filter(t => t.name !== selectedTable.value))

// Opciones de conexión desde el store
const connectionOptions = ref([])

// Cargar conexiones al montar el componente
onMounted(async () => {
  loadingConnections.value = true
  try {
    const connections = await connectionStore.fetchAll()
    const connectionList = Array.isArray(connections) ? connections : (connections.data || [])

    connectionOptions.value = connectionList
      .filter(conn => conn.is_active)
      .map(conn => ({
        id: conn.id,
        name: conn.name,
        driver: conn.driver,
        host: conn.host,
        database_name: conn.database_name,
        description: conn.description,
        is_active: conn.is_active,
      }))
    if (connectionOptions.value.length > 0 && !selectedConnection.value)
      selectedConnection.value = connectionOptions.value[0].id
  }
  catch (error) {
    console.error('Error loading connections:', error)
  }
  finally {
    loadingConnections.value = false
  }
})

// Cargar tablas/vistas cuando cambia la conexión o el tipo
watch([selectedConnection, sourceType], async ([conn, type]) => {
  if (type === 'table' && conn) {
    loadingTables.value = true
    tableError.value = ''
    try {
      const resp = await api.getTablesAndViews(conn)

      tableOptions.value = Array.isArray(resp) ? resp : (resp.data || [])
    }
    catch (e) {
      tableOptions.value = []
      tableError.value = e instanceof Error ? e.message : 'Error al cargar tablas'
    }
    finally {
      loadingTables.value = false
    }
  }
  if (type === 'stored_procedure' && conn) {
    loadingProcedures.value = true
    procedureError.value = ''
    try {
      const resp = await api.getProcedures(conn)

      procedureOptions.value = Array.isArray(resp) ? resp : (resp.data || [])
    }
    catch (e) {
      procedureOptions.value = []
      procedureError.value = e instanceof Error ? e.message : 'Error al cargar procedimientos'
    }
    finally {
      loadingProcedures.value = false
    }
  }
})

// Cargar columnas de tabla seleccionada
watch(selectedTable, async table => {
  if (
    sourceType.value === 'table'
    && selectedConnection.value
    && table
    && table !== lastRequestedTable.value
    && !loadingTableColumns.value
  ) {
    lastRequestedTable.value = table
    loadingTableColumns.value = true
    try {
      const resp = await api.getColumns(selectedConnection.value, { table })

      tableColumns.value = Array.isArray(resp) ? resp : (resp.data || [])
    }
    catch (e) {
      tableColumns.value = []
      console.error('Error loading table columns:', e)
    }
    finally {
      loadingTableColumns.value = false
    }
  }
})

// Cargar preview de columnas de SP
watch([selectedProcedure, procedureParams], async ([proc, params]) => {
  if (sourceType.value === 'stored_procedure' && selectedConnection.value && proc) {
    try {
      // Convertir params de objeto a array según el orden de los parámetros del SP
      const selectedProc = procedureOptions.value.find(p => p.name === proc)
      if (selectedProc?.params) {
        const paramArray = selectedProc.params.map(param => params[param.name] || '')
        const resp = await api.getProcedurePreview(selectedConnection.value, proc, paramArray)

        procedureColumns.value = resp.data || []
      }
    }
    catch (e) {
      procedureColumns.value = []
      console.error('Error loading procedure preview:', e)
    }
  }
})

// Cargar columnas de tabla relacionada para cada JOIN
// watch(joins, async newJoins => {
//   for (const join of newJoins) {
//     if (join.table && !joinColumns.value[join.table] && selectedConnection.value) {
//       try {
//         const resp = await api.getColumns(selectedConnection.value, { table: join.table })

//         joinColumns.value[join.table] = Array.isArray(resp) ? resp : (resp.data || [])
//       }
//       catch (e) {
//         console.error('Error cargando columnas para join table:', join.table, e)
//         joinColumns.value[join.table] = []
//       }
//     }
//   }
// })

function addJoin() {
  joins.value.push({
    table: '',
    type: 'INNER',
    mainField: '',
    joinField: '',
    alias: '', // Se generará automáticamente cuando se seleccione la tabla
  })
}
function removeJoin(index) {
  joins.value.splice(index, 1)
}

function handleTypeChange(newType: string) {
  // Limpiar campos cuando cambia el tipo
  if (newType === 'custom_sql') {
    selectedTable.value = ''
    selectedProcedure.value = ''
    tableColumns.value = []
    procedureColumns.value = []
    joins.value = []
  }
  else if (newType === 'table') {
    customSql.value = ''
    selectedProcedure.value = ''
    procedureColumns.value = []
  }
  else if (newType === 'stored_procedure') {
    customSql.value = ''
    selectedTable.value = ''
    tableColumns.value = []
    joins.value = []
  }
}

function nextStep() {
  // Actualizar connection_name en el store
  const connection = connectionOptions.value.find(c => c.id === selectedConnection.value)
  const connectionName = connection ? connection.name : ''

  wizardPreviewStore.updateWizardData({ connection_name: connectionName })

  emit('next')
}

function openNewConnectionDialog() {
  // TODO: Implementar modal para nueva conexión
  alert('Abrir modal para nueva conexión')
}

// Sincronizar el tipo local con el prop del wizard
watch(
  () => wizardData.value.type,
  newType => {
    if (newType && newType !== sourceType.value)
      sourceType.value = newType
  },
)
</script>

<template>
  <div>
    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <VSelect
          v-model="selectedConnection"
          :items="connectionOptions"
          item-title="name"
          item-value="id"
          label="Conexión"
          placeholder="Selecciona una conexión"
          prepend-inner-icon="tabler-database"
          :loading="loadingConnections"
          required
        >
          <template #append>
            <VBtn
              icon="tabler-plus"
              size="small"
              variant="text"
              @click="openNewConnectionDialog"
            />
          </template>
          <template #no-data>
            <div class="pa-4 text-center">
              <VIcon
                icon="tabler-database-off"
                size="large"
                class="mb-2"
                color="grey"
              />
              <div class="text-body-2">
                No hay conexiones disponibles
              </div>
              <div class="text-caption text-medium-emphasis">
                Crea una conexión para continuar
              </div>
            </div>
          </template>
        </VSelect>
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <VTextField
          v-model="reportName"
          label="Nombre del Reporte"
          placeholder="Ej: Ingresos JAPAMA"
          :counter="50"
          required
        />
      </VCol>
      <VCol cols="12">
        <VTextarea
          v-model="description"
          label="Descripción del Data Source"
          placeholder="Describe el propósito y contenido de este Data Source..."
          auto-grow
          rows="3"
          :counter="500"
        />
      </VCol>
      <VCol cols="12">
        <div class="mb-2">
          Tipo de Origen
        </div>
        <VBtnToggle
          v-model="sourceType"
          mandatory
          class="w-100"
          @update:model-value="handleTypeChange"
        >
          <VRow
            no-gutters
            class="w-100"
          >
            <VCol
              cols="12"
              md="4"
            >
              <VBtn
                value="custom_sql"
                variant="outlined"
                block
              >
                <VIcon
                  icon="tabler-code-braces"
                  class="me-2"
                />Custom SQL
              </VBtn>
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VBtn
                value="table"
                variant="outlined"
                block
              >
                <VIcon
                  icon="tabler-table"
                  class="me-2"
                />Tabla/Vista
              </VBtn>
            </VCol>
            <VCol
              cols="12"
              md="4"
            >
              <VBtn
                value="stored_procedure"
                variant="outlined"
                block
              >
                <VIcon
                  icon="tabler-function"
                  class="me-2"
                />Stored Procedure
              </VBtn>
            </VCol>
          </VRow>
        </VBtnToggle>
      </VCol>
      <VCol cols="12">
        <VAlert
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <VIcon
            icon="tabler-info-circle"
            class="me-2"
          />
          <span v-if="sourceType === 'custom_sql'">
            Escribe tu consulta SQL personalizada. Ejemplo: <code>SELECT * FROM pagos</code>
          </span>
          <span v-else-if="sourceType === 'table'">
            Selecciona una tabla o vista de la base de datos para tu reporte.
          </span>
          <span v-else-if="sourceType === 'stored_procedure'">
            Selecciona un procedimiento almacenado y define sus parámetros.
          </span>
        </VAlert>
      </VCol>
      <VCol cols="12">
        <VAlert
          v-if="!loadingConnections && connectionOptions.length === 0"
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          <VIcon
            icon="tabler-alert-circle"
            class="me-2"
          />
          No hay conexiones activas disponibles.
          <VBtn
            variant="text"
            size="small"
            class="ms-2"
            @click="openNewConnectionDialog"
          >
            Crear nueva conexión
          </VBtn>
        </VAlert>
      </VCol>
      <VCol cols="12">
        <div v-if="sourceType === 'custom_sql'">
          <VTextarea
            v-model="customSql"
            label="Consulta SQL"
            placeholder="SELECT * FROM ..."
            auto-grow
            rows="6"
          />
        </div>
        <div v-else-if="sourceType === 'table'">
          <VAutocomplete
            v-model="selectedTable"
            :items="tableOptions"
            item-title="name"
            item-value="name"
            label="Tabla/Vista principal"
            placeholder="Selecciona una tabla o vista"
            :loading="loadingTables"
            required
            :menu-props="{ maxHeight: '400px' }"
          />
          <!--
            <VAutocomplete
            v-if="tableColumns.length"
            v-model="selectedColumns"
            :items="tableColumns"
            item-title="name"
            item-value="name"
            label="Columnas"
            placeholder="Selecciona una o más columnas"
            multiple
            chips
            closable-chips
            :menu-props="{ maxHeight: '400px' }"
            class="mt-4"
            />
          -->
          <!-- UI de JOINs eliminada, ahora solo en DataSourceJoinsStep.vue -->
        </div>
        <div v-else-if="sourceType === 'stored_procedure'">
          <VSelect
            v-model="selectedProcedure"
            :items="procedureOptions"
            item-title="name"
            item-value="name"
            label="Stored Procedure"
            placeholder="Selecciona un procedimiento"
            :loading="loadingProcedures"
            required
          />
          <VAlert
            v-if="procedureError"
            type="error"
            variant="tonal"
            class="mt-2"
          >
            {{ procedureError }}
          </VAlert>
          <!-- Inputs para parámetros -->
          <div v-if="selectedProcedure && procedureOptions.length">
            <VCard
              class="mt-2 pa-3"
              variant="outlined"
            >
              <div class="text-caption mb-2">
                Parámetros del procedimiento:
              </div>
              <VRow>
                <VCol
                  v-for="param in (procedureOptions.find(p => p.name === selectedProcedure)?.params || [])"
                  :key="param.name"
                  cols="12"
                  md="6"
                >
                  <VTextField
                    v-model="procedureParams[param.name]"
                    :label="`${param.name} (${param.type})`"
                    variant="outlined"
                    density="compact"
                  />
                </VCol>
              </VRow>
            </VCard>
          </div>
          <div v-if="selectedProcedure && procedureColumns.length">
            <VCard
              class="mt-2 pa-2"
              variant="outlined"
            >
              <div class="text-caption mb-1">
                Columnas detectadas:
              </div>
              <VChip
                v-for="col in procedureColumns"
                :key="col.name"
                class="ma-1"
                size="small"
              >
                {{ col.name }} ({{ col.type }})
              </VChip>
            </VCard>
          </div>
        </div>
      </VCol>
    </VRow>
    <div class="d-flex justify-space-between mt-6">
      <VBtn
        color="primary"
        :disabled="!canContinue"
        @click="nextStep"
      >
        Siguiente
        <VIcon
          icon="tabler-arrow-right"
          class="ms-2"
        />
      </VBtn>
    </div>
  </div>
</template>
