<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWizardPreviewStore } from '@/stores/wizardPreview.store'
import Draggable from 'vuedraggable'
import CustomColumnDialog from '../molecules/CustomColumnDialog.vue'
import EditColumnDialog from '../molecules/EditColumnDialog.vue'
import type { Field, Join, TableColumn, WizardData } from '@/modules/DynamicReports/domain/wizardData'

const emit = defineEmits(['next', 'back'])

const wizardPreviewStore = useWizardPreviewStore()

// Computed para acceder al wizardData del store
interface WizardDataState { wizardData: WizardData }
const wizardData = computed<WizardData>(() => wizardPreviewStore.wizardData)

// Computed para acceder y actualizar selectedFields
const selectedFields = computed<Field[]>({
  get: () => {
    const fields = wizardData.value.selectedFields || []

    // Migrar selectedFields si vienen como strings (estructura antigua)
    if (fields.length > 0 && typeof fields[0] === 'string') {
      return (fields as string[]).map(f => ({
        field: f,
        aggregation: null,
        groupBy: false,
        alias: '',
      }))
    }

    return fields as Field[]
  },
  set: val => wizardPreviewStore.updateWizardData({ selectedFields: val }),
})

// Computed para acceder y actualizar fieldAliases
const fieldAliases = computed<Record<string, string>>({
  get: () => wizardData.value.fieldAliases || {},
  set: val => wizardPreviewStore.updateWizardData({ fieldAliases: val }),
})

// Función para generar alias de tabla
function generateTableAlias(tableName: string, index: number = 0): string {
  const words = tableName.split('_')
  const alias = words.map(word => word.substring(0, 3)).join('').toLowerCase()

  return index === 0 ? alias : `${alias}${index}`
}

// Función para sugerir alias automáticamente
function sugerirAlias(field: string): string {
  // Quitar prefijo de tabla si existe
  const parts = field.split('.')
  const base = parts[parts.length - 1]

  // Snake_case a Title Case
  return base.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// Campos disponibles según el tipo de origen
const availableFields = computed<TableColumn[]>(() => {
  if (wizardData.value.type === 'table') {
    let fields: TableColumn[] = [...(wizardData.value.tableColumns || [])]

    // Agregar displayName a las columnas de la tabla principal
    const mainTableAlias = generateTableAlias(wizardData.value.table)

    fields = fields.map(col => ({
      ...col,
      displayName: col.displayName || `${mainTableAlias}.${col.name}`,
      name: `${mainTableAlias}.${col.name}`,
    }))

    // Agregar columnas de los JOINs si existen
    if (wizardData.value.joins && wizardData.value.joins.length > 0) {
      (wizardData.value.joins as Join[]).forEach(join => {
        if (join.table && wizardData.value.joinColumns && wizardData.value.joinColumns[join.table]) {
          const joinAlias = join.alias || generateTableAlias(join.table)

          // Agregar alias de tabla para evitar conflictos de nombres
          const joinFields = (wizardData.value.joinColumns[join.table] as TableColumn[]).map(col => ({
            ...col,
            name: `${joinAlias}.${col.name}`,
            displayName: `${joinAlias}.${col.name}`,
          }))

          fields = [...fields, ...joinFields]
        }
      })
    }

    return fields
  }

  if (wizardData.value.type === 'stored_procedure')
    return wizardData.value.procedureColumns || []

  return []
})

function nextStep() {
  emit('next')
}

function backStep() {
  emit('back')
}

// Estado para el diálogo de formato de columna
const formatDialog = ref({
  open: false,
  index: null,
  tempFormat: {},
})

function openFormatDialog(idx) {
  formatDialog.value.index = idx

  // Clonar el formato actual o dejar vacío
  formatDialog.value.tempFormat = { ...(selectedFields.value[idx].format || {}) }
  formatDialog.value.open = true
}

function saveFormat() {
  const arr = [...selectedFields.value]

  arr[formatDialog.value.index].format = { ...formatDialog.value.tempFormat }
  selectedFields.value = arr
  formatDialog.value.open = false
}

function closeFormatDialog() {
  formatDialog.value.open = false
}

const customColumnDialog = ref(false)
const customColumnDraft = ref(null)
const customColumnEditIndex = ref(null)
const editColumnDialog = ref(false)
const editColumnDraft = ref(null)
const editColumnIndex = ref(null)

function openCustomColumnDialog(column = null, idx = null) {
  customColumnDraft.value = column ? { ...column } : null
  customColumnEditIndex.value = idx
  customColumnDialog.value = true
}

function openEditColumnDialog(column, idx) {
  editColumnDraft.value = { ...column }
  editColumnIndex.value = idx
  editColumnDialog.value = true
}

function onCustomColumnSave(column) {
  if (customColumnEditIndex.value !== null) {
    const arr = [...selectedFields.value]

    arr.splice(customColumnEditIndex.value, 1, column)
    selectedFields.value = arr
  }
  else {
    selectedFields.value = [...selectedFields.value, column]
  }
  customColumnDialog.value = false
  customColumnEditIndex.value = null
}

function onEditColumnSave(column) {
  if (editColumnIndex.value !== null) {
    const arr = [...selectedFields.value]

    arr.splice(editColumnIndex.value, 1, column)
    selectedFields.value = arr
  }
  editColumnDialog.value = false
  editColumnIndex.value = null
}

function onCustomColumnCancel() {
  customColumnDialog.value = false
  customColumnEditIndex.value = null
}

function onEditColumnCancel() {
  editColumnDialog.value = false
  editColumnIndex.value = null
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
            <VRow v-if="wizardData.joins && wizardData.joins.length">
              <VCol cols="12">
                <div class="text-caption">
                  JOINs configurados:
                </div>
                <div class="text-body-1">
                  {{ wizardData.joins.length }} tabla(s) relacionada(s)
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Selección avanzada de columnas -->
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            <VIcon
              icon="mdi-view-column"
              class="me-2"
            />
            Selección de Columnas
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
              Selecciona los campos, alias, agregaciones y agrupaciones para tu reporte. Puedes agregar columnas personalizadas.
            </VAlert>

            <Draggable
              v-model="selectedFields"
              item-key="field"
              handle=".drag-handle"
              animation="200"
            >
              <template #item="{ element: col, index: idx }">
                <div class="mb-2">
                  <VSheet
                    rounded="lg"
                    class="pa-3"
                    :color="col.expression ? 'blue-lighten-5' : 'grey-lighten-4'"
                  >
                    <VRow
                      align="center"
                      no-gutters
                    >
                      <VCol cols="auto">
                        <VIcon
                          class="drag-handle me-2"
                          icon="tabler-drag-drop"
                          color="grey"
                          size="20"
                          style="cursor: grab;"
                        />
                        <VTooltip>
                          <template #activator="{ props }">
                            <VIcon
                              v-bind="props"
                              :icon="col.expression ? 'tabler-wand' : col.aggregation ? 'tabler-sigma' : 'tabler-table-column'"
                              :color="col.expression ? 'primary' : col.aggregation ? 'deep-purple' : 'grey-darken-1'"
                              size="22"
                              class="me-2"
                            />
                          </template>
                          <span>
                            {{
                              col.expression
                                ? 'Columna personalizada: usa una expresión SQL'
                                : col.aggregation
                                  ? 'Columna agregada'
                                  : 'Columna normal'
                            }}
                          </span>
                        </VTooltip>
                      </VCol>
                      <VCol>
                        <div class="d-flex align-center">
                          <span
                            v-if="col.expression"
                            class="font-italic text-primary"
                          >Expresión SQL</span>
                          <template v-else>
                            <VSelect
                              v-model="col.field"
                              :items="availableFields.filter(f => !selectedFields.some((c, i) => c.field === f.name && i !== idx))"
                              item-title="displayName"
                              item-value="name"
                              label="Campo"
                              density="compact"
                              hide-details
                              style="max-inline-size: 220px;min-inline-size: 140px;"
                            />
                          </template>
                          <VTooltip v-if="col.onlyGear">
                            <template #activator="{ props }">
                              <VIcon
                                v-bind="props"
                                icon="tabler-lock"
                                color="grey"
                                size="18"
                                class="ms-1"
                              />
                            </template>
                            <span>Solo editable desde el engrane</span>
                          </VTooltip>
                        </div>
                        <div
                          v-if="col.expression"
                          class="text-caption text-grey-darken-1"
                        >
                          {{ col.expression }}
                        </div>
                      </VCol>
                      <VCol cols="3">
                        <VTextField
                          v-model="col.alias"
                          label="Alias"
                          density="compact"
                          hide-details
                          :disabled="col.expression"
                        />
                      </VCol>
                      <VCol cols="auto">
                        <VBtn
                          icon="tabler-settings"
                          variant="text"
                          size="small"
                          title="Editar columna"
                          @click="col.expression ? openCustomColumnDialog(col, idx) : openEditColumnDialog(col, idx)"
                        />
                        <VBtn
                          icon="tabler-arrow-up"
                          size="small"
                          variant="text"
                          :disabled="idx === 0"
                          @click="() => { const arr = [...selectedFields]; [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]; selectedFields.splice(0, selectedFields.length, ...arr); }"
                        />
                        <VBtn
                          icon="tabler-arrow-down"
                          size="small"
                          variant="text"
                          :disabled="idx === selectedFields.length - 1"
                          @click="() => { const arr = [...selectedFields]; [arr[idx + 1], arr[idx]] = [arr[idx], arr[idx + 1]]; selectedFields.splice(0, selectedFields.length, ...arr); }"
                        />
                        <VBtn
                          icon="tabler-trash"
                          color="error"
                          size="small"
                          variant="text"
                          @click="selectedFields.splice(idx, 1)"
                        />
                      </VCol>
                    </VRow>
                  </VSheet>
                </div>
              </template>
            </Draggable>

            <div class="mt-2">
              <VBtn
                prepend-icon="mdi-plus"
                variant="outlined"
                @click="selectedFields.push({ field: '', alias: '' })"
              >
                Agregar columna
              </VBtn>
              <VBtn
                prepend-icon="mdi-plus"
                variant="outlined"
                class="ms-2"
                @click="() => openCustomColumnDialog()"
              >
                Columna personalizada
              </VBtn>
            </div>
            <VAlert
              v-if="selectedFields.length === 0"
              type="warning"
              variant="tonal"
              class="mt-4"
            >
              <VIcon
                icon="mdi-alert"
                class="me-2"
              />
              Debes seleccionar al menos una columna para continuar.
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
        :disabled="selectedFields.length === 0"
        @click="nextStep"
      >
        Siguiente
        <VIcon
          icon="tabler-arrow-right"
          class="ms-2"
        />
      </VBtn>
    </div>

    <VDialog
      v-model="formatDialog.open"
      max-width="400"
    >
      <VCard>
        <VCardTitle>
          <VIcon
            icon="tabler-settings"
            class="me-2"
          />
          Configurar Formato de Columna
        </VCardTitle>
        <VCardText>
          <VSelect
            v-model="formatDialog.tempFormat.type"
            :items="[
              { value: undefined, title: 'Ninguno' },
              { value: 'date', title: 'Fecha' },
              { value: 'currency', title: 'Moneda' },
              { value: 'number', title: 'Número' },
              { value: 'percent', title: 'Porcentaje' },
              { value: 'text', title: 'Texto' },
            ]"
            item-title="title"
            item-value="value"
            label="Tipo de Formato"
            density="compact"
            class="mb-3"
          />
          <template v-if="formatDialog.tempFormat.type === 'date'">
            <VTextField
              v-model="formatDialog.tempFormat.pattern"
              label="Patrón de Fecha (ej: DD/MM/YYYY)"
              density="compact"
            />
          </template>
          <template v-if="formatDialog.tempFormat.type === 'currency'">
            <VTextField
              v-model="formatDialog.tempFormat.symbol"
              label="Símbolo de Moneda (ej: $)"
              density="compact"
            />
            <VTextField
              v-model.number="formatDialog.tempFormat.decimals"
              label="Decimales"
              type="number"
              min="0"
              density="compact"
            />
          </template>
          <template v-if="formatDialog.tempFormat.type === 'number'">
            <VTextField
              v-model.number="formatDialog.tempFormat.decimals"
              label="Decimales"
              type="number"
              min="0"
              density="compact"
            />
            <VSwitch
              v-model="formatDialog.tempFormat.thousandSeparator"
              label="Separador de miles"
              density="compact"
            />
          </template>
          <template v-if="formatDialog.tempFormat.type === 'percent'">
            <VTextField
              v-model.number="formatDialog.tempFormat.decimals"
              label="Decimales"
              type="number"
              min="0"
              density="compact"
            />
          </template>
          <!-- Para texto no hay opciones extra -->
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="closeFormatDialog"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            variant="flat"
            @click="saveFormat"
          >
            Guardar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <CustomColumnDialog
      v-model="customColumnDialog"
      :fields="availableFields"
      :column="customColumnDraft"
      @save="onCustomColumnSave"
      @cancel="onCustomColumnCancel"
    />

    <EditColumnDialog
      v-model="editColumnDialog"
      :column="editColumnDraft"
      @save="onEditColumnSave"
      @cancel="onEditColumnCancel"
    />
  </div>
</template>
