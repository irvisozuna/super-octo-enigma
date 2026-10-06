<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { VBtn, VCard, VCardActions, VCardText, VCardTitle, VDialog, VIcon, VSelect, VSpacer, VTextField, VTextarea } from 'vuetify/components'
import { useSqlExpressionPreview } from '@/composables/useSqlExpressionPreview'

const props = defineProps({
  modelValue: Boolean,
  fields: {
    type: Array,
    default: () => [],
  },
  column: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const type = ref('CONCAT')
const alias = ref('')

// AGREGACIÓN
const aggregationType = ref('SUM')
const aggregationField = ref('')

// CONCAT
const concatFields = ref([])
const concatSeparator = ref(' ')

// CASE
const caseConditions = ref([
  { field: '', operator: '=', value: '', result: '' },
])

const caseElse = ref('')

// SUBQUERY
const subquery = ref('')

// LIBRE
const libreExpr = ref('')

const typeOptions = [
  { value: 'AGGREGATION', title: 'Agregación (SUM, COUNT, ...)' },
  { value: 'CONCAT', title: 'Concatenar (CONCAT)' },
  { value: 'CASE', title: 'Condicional (CASE)' },
  { value: 'SUBQUERY', title: 'Subconsulta (SUBQUERY)' },
  { value: 'LIBRE', title: 'Expresión libre' },
]

const { getSqlPreview, getHighlightedSql } = useSqlExpressionPreview()

const sqlPreview = computed(() =>
  getSqlPreview({
    type: type.value,
    aggregationType: aggregationType.value,
    aggregationField: aggregationField.value,
    concatFields: concatFields.value,
    concatSeparator: concatSeparator.value,
    caseConditions: caseConditions.value,
    caseElse: caseElse.value,
    subquery: subquery.value,
    libreExpr: libreExpr.value,
  }),
)

const sqlPreviewHighlighted = computed(() => getHighlightedSql(sqlPreview.value))

onMounted(() => {
  if (props.column) {
    alias.value = props.column.alias || ''
    if (props.column.expression) {
      // Detección simple del tipo de expresión
      if (/^CONCAT\(/i.test(props.column.expression)) {
        type.value = 'CONCAT'

        // Extraer campos y separador si es posible
      }
      else if (/^CASE /i.test(props.column.expression)) {
        type.value = 'CASE'
      }
      else if (/^\(.+\)$/s.test(props.column.expression)) {
        type.value = 'SUBQUERY'
        subquery.value = props.column.expression.slice(1, -1)
      }
      else if (/^(SUM|COUNT|AVG|MIN|MAX)\(/i.test(props.column.expression)) {
        type.value = 'AGGREGATION'

        // Extraer tipo y campo si es posible
      }
      else {
        type.value = 'LIBRE'
        libreExpr.value = props.column.expression
      }
    }
  }
  else {
    resetAllFields()
  }
})

function addCaseCondition() {
  caseConditions.value.push({ field: '', operator: '=', value: '', result: '' })
}

function removeCaseCondition(idx) {
  caseConditions.value.splice(idx, 1)
}

function close() {
  emit('update:modelValue', false)
  emit('cancel')
}

function save() {
  let expression = ''
  if (type.value === 'AGGREGATION') {
    if (!aggregationField.value)
      return
    expression = `${aggregationType.value}(${aggregationField.value})`
  }
  else if (type.value === 'CONCAT') {
    if (!concatFields.value.length)
      return
    expression = `CONCAT(${concatFields.value.join(`, '${concatSeparator.value}' ,`)})`
  }
  else if (type.value === 'CASE') {
    if (!caseConditions.value.length)
      return
    expression = `CASE ${caseConditions.value.map(c => `WHEN ${c.field} ${c.operator} '${c.value}' THEN '${c.result}'`).join(' ')}${caseElse.value ? ` ELSE '${caseElse.value}'` : ''} END`
  }
  else if (type.value === 'SUBQUERY') {
    if (!subquery.value)
      return
    expression = `(${subquery.value})`
  }
  else if (type.value === 'LIBRE') {
    if (!libreExpr.value)
      return
    expression = libreExpr.value
  }
  emit('save', {
    expression,
    alias: alias.value,
    aggregation: null,
  })
  emit('update:modelValue', false)
}

function resetAllFields() {
  type.value = 'CONCAT'
  alias.value = ''
  aggregationType.value = 'SUM'
  aggregationField.value = ''
  concatFields.value = []
  concatSeparator.value = ' '
  caseConditions.value = [{ field: '', operator: '=', value: '', result: '' }]
  caseElse.value = ''
  subquery.value = ''
  libreExpr.value = ''
}

watch(() => props.modelValue, val => {
  if (val && !props.column)
    resetAllFields()
})
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardTitle>
        <VIcon
          icon="tabler-settings"
          class="me-2"
        />
        Columna personalizada
      </VCardTitle>
      <VCardText>
        <VSelect
          v-model="type"
          :items="typeOptions"
          item-title="title"
          item-value="value"
          label="Tipo de expresión"
          class="mb-3"
        />
        <VTextField
          v-model="alias"
          label="Alias de columna"
          class="mb-3"
        />
        <template v-if="type === 'AGGREGATION'">
          <VSelect
            v-model="aggregationType"
            :items="['SUM', 'COUNT', 'AVG', 'MIN', 'MAX']"
            label="Tipo de agregación"
            class="mb-2"
          />
          <VSelect
            v-model="aggregationField"
            :items="props.fields"
            item-title="displayName"
            item-value="name"
            label="Campo a agregar"
            class="mb-2"
          />
          <div class="text-caption text-grey-darken-1 ms-1">
            Ejemplo: SUM(monto)
          </div>
        </template>
        <template v-else-if="type === 'CONCAT'">
          <VSelect
            v-model="concatFields"
            :items="props.fields"
            item-title="displayName"
            item-value="name"
            label="Columnas a concatenar"
            multiple
            chips
            class="mb-2"
          />
          <VTextField
            v-model="concatSeparator"
            label="Separador"
            class="mb-2"
          />
          <div class="text-caption text-grey-darken-1 ms-1">
            Ejemplo: CONCAT(nombre, ' ', apellido)
          </div>
        </template>
        <template v-else-if="type === 'CASE'">
          <div
            v-for="(cond, idx) in caseConditions"
            :key="idx"
            class="d-flex align-center mb-2"
          >
            <VSelect
              v-model="cond.field"
              :items="props.fields"
              item-title="displayName"
              item-value="name"
              label="Campo"
              class="me-2"
              style="min-inline-size: 120px;"
            />
            <VSelect
              v-model="cond.operator"
              :items="['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN']"
              label="Operador"
              class="me-2"
              style="max-inline-size: 80px;"
            />
            <VTextField
              v-model="cond.value"
              label="Valor"
              class="me-2"
              style="min-inline-size: 80px;"
            />
            <VTextField
              v-model="cond.result"
              label="Resultado"
              class="me-2"
              style="min-inline-size: 80px;"
            />
            <VBtn
              v-if="caseConditions.length > 1"
              icon="tabler-trash"
              color="error"
              variant="text"
              @click="removeCaseCondition(idx)"
            />
          </div>
          <VBtn
            variant="text"
            prepend-icon="mdi-plus"
            @click="addCaseCondition"
          >
            Agregar condición
          </VBtn>
          <VTextField
            v-model="caseElse"
            label="ELSE (opcional)"
            class="mt-2"
          />
          <div class="text-caption text-grey-darken-1 ms-1">
            Ejemplo: CASE WHEN estado = 'A' THEN 'Activo' ELSE 'Inactivo' END
          </div>
        </template>
        <template v-else-if="type === 'SUBQUERY'">
          <VTextarea
            v-model="subquery"
            label="Subconsulta SQL"
            rows="4"
            auto-grow
            class="mb-2"
          />
          <div class="text-caption text-grey-darken-1 ms-1">
            Escribe una subconsulta SQL válida. Ejemplo: SELECT MAX(fecha) FROM tabla WHERE ...
          </div>
        </template>
        <template v-else-if="type === 'LIBRE'">
          <VTextarea
            v-model="libreExpr"
            label="Expresión SQL libre"
            rows="3"
            auto-grow
            class="mb-2"
          />
          <div class="text-caption text-grey-darken-1 ms-1">
            Escribe cualquier expresión SQL válida.
          </div>
        </template>

        <div class="mt-4">
          <div class="text-caption text-grey-darken-1 mb-1">
            Vista previa de SQL generado:
          </div>
          <pre
            class="rounded bg-grey-lighten-4 pa-3"
            style="overflow-x: auto;"
            v-html="sqlPreviewHighlighted"
          />
        </div>
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn
          variant="text"
          @click="close"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          variant="flat"
          @click="save"
        >
          {{ props.column ? 'Guardar cambios' : 'Agregar' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
