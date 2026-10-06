<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import Draggable from 'vuedraggable'
import { ConnectionApiService } from '../../../../Connection/infrastructure/api/services/ConnectionApiService'

// Tipos para joins y columnas
interface JoinOnCondition {
  leftTable: string
  leftField: string
  operator: string
  rightTable: string
  rightField: string
}
interface Join {
  id: string
  table: string
  type: string
  alias: string
  on: JoinOnCondition[]
}
interface Column {
  name: string
  [key: string]: any
}

const emit = defineEmits(['next', 'back'])

const wizardPreviewStore = useWizardPreviewStore()

// Computed para acceder al wizardData del store
const wizardData = computed(() => wizardPreviewStore.wizardData)

// Generador de id único (usa crypto si está disponible, si no un contador)
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID)
    return crypto.randomUUID()

  return Math.random().toString(36).substring(2, 12)
}

// Computed para acceder y actualizar joins
const joins = computed<Join[]>({
  get: () => (wizardData.value.joins || []).map((j: any, idx: number) => ({
    ...j,
    id: j.id || generateId(),
    on: j.on && Array.isArray(j.on)
      ? j.on
      : [
        {
          leftTable: 'main',
          leftField: j.mainField || '',
          operator: '=',
          rightTable: j.alias || '',
          rightField: j.joinField || '',
        },
      ],
    alias: j.alias || generateTableAlias(j.table, idx + 1),
  })),
  set: val => wizardPreviewStore.updateWizardData({ joins: val }),
})

// Computed para acceder y actualizar joinColumns
const joinColumns = computed<Record<string, Column[]>>({
  get: () => wizardData.value.joinColumns || {},
  set: val => wizardPreviewStore.updateWizardData({ joinColumns: val }),
})

const joinTypes = [
  { value: 'INNER', label: 'INNER JOIN', description: 'Devuelve solo las filas que tienen coincidencias en ambas tablas.' },
  { value: 'LEFT', label: 'LEFT JOIN', description: 'Devuelve todas las filas de la tabla principal y las coincidencias de la tabla relacionada.' },
  { value: 'RIGHT', label: 'RIGHT JOIN', description: 'Devuelve todas las filas de la tabla relacionada y las coincidencias de la tabla principal.' },
]

// NUEVO: Cargar tablas de la conexión
const tableOptions = ref<Column[]>([])
const api = new ConnectionApiService()

// Utilidad para filtrar duplicados por clave
function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set()

  return arr.filter(item => {
    const val = item[key]
    if (seen.has(val))
      return false
    seen.add(val)

    return true
  })
}

async function loadTables() {
  if (wizardData.value.connection_id) {
    try {
      const resp = await api.getTablesAndViews(wizardData.value.connection_id)
      let tables = Array.isArray(resp) ? resp : (resp.data || [])

      // Filtra duplicados por 'name'
      tables = uniqueBy(tables, 'name')
      tableOptions.value = tables
    }
    catch (e) {
      tableOptions.value = []
    }
  }
}

onMounted(loadTables)
watch(() => wizardData.value.connection_id, loadTables)

// Opciones de tablas para JOINs (excluyendo la tabla principal)
const joinTableOptions = computed(() => {
  return tableOptions.value.filter(t => t.name !== wizardData.value.table)
})

// Campos de la principal y de los JOINs anteriores
const allAvailableTables = computed(() => {
  const main = [{ label: `${wizardData.value.table} (principal)`, value: 'main', columns: wizardData.value.tableColumns || [] }]

  const prevJoins = joins.value.map((j, idx) => ({
    label: `${j.alias || generateTableAlias(j.table, idx + 1)}`,
    value: j.alias || generateTableAlias(j.table, idx + 1),
    columns: joinColumns.value[j.table] || [],
  }))

  return [...main, ...prevJoins]
})

// Cargar columnas de tabla relacionada para cada JOIN y generar alias automáticamente
watch(joins, async newJoins => {
  for (const [idx, join] of newJoins.entries()) {
    // Cargar columnas si no existen
    if (join.table && !joinColumns.value[join.table]) {
      try {
        const resp = await api.getColumns(wizardData.value.connection_id, { table: join.table })

        joinColumns.value = {
          ...joinColumns.value,
          [join.table]: Array.isArray(resp) ? resp : (resp.data || []),
        }
      }
      catch (e) {
        joinColumns.value = {
          ...joinColumns.value,
          [join.table]: [],
        }
      }
    }

    // Generar alias automáticamente si no existe
    if (join.table && (!join.alias || join.alias === '')) {
      const alias = generateTableAlias(join.table, idx + 1)
      if (join.alias !== alias) {
        // Actualizar el alias en el join
        const arr = [...newJoins]

        arr[idx] = { ...arr[idx], alias }
        joins.value = arr
      }
    }
  }
}, { deep: true })

function generateTableAlias(tableName: string, index: number = 0): string {
  if (!tableName)
    return `t${index}`
  const words = tableName.split('_')
  const alias = words.map(word => word.substring(0, 3)).join('').toLowerCase()

  return index === 0 ? alias : `${alias}${index}`
}

function addJoin() {
  const newJoin: Join = {
    id: generateId(),
    table: '',
    type: 'INNER',
    alias: '',
    on: [
      { leftTable: 'main', leftField: '', operator: '=', rightTable: '', rightField: '' },
    ],
  }

  joins.value = [...joins.value, newJoin]
  openPanel.value = newJoin.id
}

function removeJoin(index: number) {
  const arr = [...joins.value]

  arr.splice(index, 1)
  joins.value = arr
}

function addOnCondition(join: Join) {
  const arr = [...joins.value]
  const joinIndex = arr.findIndex(j => j.id === join.id)
  if (joinIndex !== -1) {
    const newJoin = { ...arr[joinIndex] }

    newJoin.on = [...newJoin.on, { leftTable: 'main', leftField: '', operator: '=', rightTable: join.alias || '', rightField: '' }]
    arr[joinIndex] = newJoin
    joins.value = arr
  }
}

function removeOnCondition(join: Join, idx: number) {
  const arr = [...joins.value]
  const joinIndex = arr.findIndex(j => j.id === join.id)
  if (joinIndex !== -1) {
    const newJoin = { ...arr[joinIndex] }

    newJoin.on = [...newJoin.on]
    newJoin.on.splice(idx, 1)
    arr[joinIndex] = newJoin
    joins.value = arr
  }
}

function updateJoinTable(joinId: string, table: string) {
  const arr = [...joins.value]
  const joinIndex = arr.findIndex(j => j.id === joinId)
  if (joinIndex !== -1) {
    arr[joinIndex] = { ...arr[joinIndex], table }
    joins.value = arr
  }
}

function updateJoinAlias(joinId: string, alias: string) {
  const arr = [...joins.value]
  const joinIndex = arr.findIndex(j => j.id === joinId)
  if (joinIndex !== -1) {
    arr[joinIndex] = { ...arr[joinIndex], alias }
    joins.value = arr
  }
}

function updateJoinType(joinId: string, type: string) {
  const arr = [...joins.value]
  const joinIndex = arr.findIndex(j => j.id === joinId)
  if (joinIndex !== -1) {
    arr[joinIndex] = { ...arr[joinIndex], type }
    joins.value = arr
  }
}

function updateOnCondition(joinId: string, onIndex: number, field: string, value: any) {
  const arr = [...joins.value]
  const joinIndex = arr.findIndex(j => j.id === joinId)
  if (joinIndex !== -1) {
    const newJoin = { ...arr[joinIndex] }

    newJoin.on = [...newJoin.on]
    newJoin.on[onIndex] = { ...newJoin.on[onIndex], [field]: value }
    arr[joinIndex] = newJoin
    joins.value = arr
  }
}

function nextStep() {
  emit('next')
}

function backStep() {
  emit('back')
}

const openPanel = ref(joins.value.length ? joins.value[0].id : null) // id del panel abierto
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
            Resumen de Conexión
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
                  Tabla Principal:
                </div>
                <div class="text-body-1">
                  {{ wizardData.table }}
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-link"
              class="me-2"
            />
            Configurar JOINs
          </VCardTitle>
          <VCardText>
            <VAlert
              type="info"
              variant="tonal"
              class="mb-4"
            >
              <VIcon
                icon="mdi-information"
                class="me-2"
              />
              Los JOINs son opcionales. Agrega tablas relacionadas para obtener datos adicionales en tu reporte.
            </VAlert>
            <div class="d-flex align-center mb-4">
              <span class="text-h6">JOINs</span>
              <VBtn
                size="small"
                variant="outlined"
                class="ms-2"
                @click="addJoin"
              >
                <VIcon icon="tabler-plus" /> Agregar JOIN
              </VBtn>
            </div>
            <Draggable
              v-model="joins"
              item-key="id"
              handle=".drag-handle"
              animation="200"
            >
              <template #item="{ element: join, index: idx }">
                <VExpansionPanels
                  v-model="openPanel"
                  variant="accordion"
                  class="mb-2"
                >
                  <VExpansionPanel
                    :key="join.id"
                    :value="join.id"
                  >
                    <VExpansionPanelTitle>
                      <div class="d-flex align-center w-100">
                        <VIcon
                          class="drag-handle me-2"
                          icon="tabler-drag-drop"
                          color="grey"
                          size="20"
                          style="cursor: grab;"
                        />
                        <span class="font-weight-medium me-2">{{ join.alias || join.table || 'Nuevo JOIN' }}</span>
                        <VTooltip>
                          <template #activator="{ props }">
                            <VIcon
                              v-bind="props"
                              icon="tabler-link"
                              color="primary"
                              size="20"
                              class="me-2"
                            />
                          </template>
                          <span>Tipo de JOIN: {{ join.type }}</span>
                        </VTooltip>
                        <VTooltip>
                          <template #activator="{ props }">
                            <VIcon
                              v-bind="props"
                              icon="tabler-info-circle"
                              color="primary"
                              size="18"
                              class="me-2"
                            />
                          </template>
                          <span>{{ joinTypes.find(t => t.value === join.type)?.description }}</span>
                        </VTooltip>
                        <VSpacer />
                        <VBtn
                          icon="tabler-trash"
                          color="error"
                          variant="text"
                          @click.stop="removeJoin(idx)"
                        />
                      </div>
                    </VExpansionPanelTitle>
                    <VExpansionPanelText>
                      <VRow class="mb-2">
                        <VCol cols="4">
                          <VAutocomplete
                            :model-value="join.table"
                            :items="joinTableOptions"
                            item-title="name"
                            item-value="name"
                            label="Tabla a unir"
                            placeholder="Selecciona tabla"
                            :menu-props="{ maxHeight: '300px' }"
                            density="compact"
                            variant="outlined"
                            style="max-inline-size: 220px;"
                            @update:model-value="updateJoinTable(join.id, $event)"
                          />
                        </VCol>
                        <VCol
                          cols="4"
                          class="d-flex align-center"
                        >
                          <VTextField
                            :model-value="join.alias"
                            label="Alias"
                            placeholder="Alias automático"
                            density="compact"
                            variant="outlined"
                            style="max-inline-size: 160px;"
                            @update:model-value="updateJoinAlias(join.id, $event)"
                          />
                          <VTooltip>
                            <template #activator="{ props }">
                              <VIcon
                                v-bind="props"
                                icon="tabler-info-circle"
                                color="primary"
                                size="18"
                                class="ms-1"
                              />
                            </template>
                            <span>
                              Si dejas vacío, el alias se generará automáticamente.
                            </span>
                          </VTooltip>
                        </VCol>
                        <VCol
                          cols="4"
                          class="d-flex align-center"
                        >
                          <VSelect
                            :model-value="join.type"
                            :items="joinTypes"
                            item-title="label"
                            item-value="value"
                            label="Tipo de JOIN"
                            density="compact"
                            variant="outlined"
                            style="max-inline-size: 180px;"
                            @update:model-value="updateJoinType(join.id, $event)"
                          />
                        </VCol>
                      </VRow>
                      <VSheet
                        class="pa-4"
                        color="#f4f6fb"
                        elevation="0"
                      >
                        <div class="d-flex align-center mb-3 justify-space-between">
                          <span class="text-caption font-weight-medium">Condiciones ON (puedes agregar varias)</span>
                          <VBtn
                            icon="tabler-plus"
                            size="x-small"
                            variant="text"
                            @click="addOnCondition(join)"
                          />
                        </div>
                        <div
                          v-for="(on, onIdx) in join.on"
                          :key="onIdx"
                        >
                          <VRow
                            align="center"
                            class="py-2"
                          >
                            <VCol cols="3">
                              <VSelect
                                :model-value="on.leftTable"
                                :items="allAvailableTables"
                                item-title="label"
                                item-value="value"
                                label="Tabla izq."
                                density="compact"
                                variant="outlined"
                                style="max-inline-size: 120px;"
                                @update:model-value="updateOnCondition(join.id, onIdx, 'leftTable', $event)"
                              />
                            </VCol>
                            <VCol cols="3">
                              <VSelect
                                :model-value="on.leftField"
                                :items="allAvailableTables.find(t => t.value === on.leftTable)?.columns || []"
                                item-title="name"
                                item-value="name"
                                label="Campo izq."
                                density="compact"
                                variant="outlined"
                                style="max-inline-size: 140px;"
                                @update:model-value="updateOnCondition(join.id, onIdx, 'leftField', $event)"
                              />
                            </VCol>
                            <VCol cols="2">
                              <VSelect
                                :model-value="on.operator"
                                :items="['=', '!=', '>', '<', '>=', '<=']"
                                label="Op."
                                density="compact"
                                variant="outlined"
                                style="max-inline-size: 60px;"
                                @update:model-value="updateOnCondition(join.id, onIdx, 'operator', $event)"
                              />
                            </VCol>
                            <VCol cols="3">
                              <VSelect
                                :model-value="on.rightField"
                                :items="joinColumns[join.table] || []"
                                item-title="name"
                                item-value="name"
                                label="Campo der."
                                density="compact"
                                variant="outlined"
                                style="max-inline-size: 140px;"
                                @update:model-value="updateOnCondition(join.id, onIdx, 'rightField', $event)"
                              />
                            </VCol>
                            <VCol
                              cols="1"
                              class="d-flex align-center"
                            >
                              <VBtn
                                v-if="join.on.length > 1"
                                icon="tabler-trash"
                                color="error"
                                size="x-small"
                                variant="text"
                                class="ms-1"
                                @click="removeOnCondition(join, onIdx)"
                              />
                            </VCol>
                          </VRow>
                          <VDivider
                            v-if="onIdx < join.on.length - 1"
                            class="my-2"
                          />
                        </div>
                      </VSheet>
                    </VExpansionPanelText>
                  </VExpansionPanel>
                </VExpansionPanels>
              </template>
            </Draggable>
            <VAlert
              v-if="joins.length === 0"
              type="info"
              variant="tonal"
              class="mt-4"
            >
              <VIcon
                icon="mdi-information"
                class="me-2"
              />
              No hay JOINs configurados. Puedes agregar tablas relacionadas o continuar sin JOINs.
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
