<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FiltroDef, Opcion } from '../../types/reporte'
import type { Rango } from '../../utils/filtros'

const props = defineProps<{
  def: FiltroDef
  modelValue: unknown
  opciones?: Opcion[]
  cargando?: boolean
  error?: string
  deshabilitado?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [valor: unknown]
  'buscar': [texto: string]
}>()

const { t } = useI18n()

const etiqueta = computed(() => (props.def.requerido ? `${props.def.etiqueta} *` : props.def.etiqueta))
const items = computed(() => props.opciones ?? props.def.opciones ?? [])
const placeholder = computed(() => (typeof props.def.config.placeholder === 'string' ? props.def.config.placeholder : undefined))
const deshabilitado = computed(() => props.deshabilitado || props.def.fijo)

const rango = computed<Rango>(() => {
  const valor = props.modelValue as Partial<Rango> | null

  return { desde: valor?.desde ?? null, hasta: valor?.hasta ?? null }
})

function actualizar(valor: unknown) {
  emit('update:modelValue', valor)
}

function actualizarRango(parte: keyof Rango, valor: unknown) {
  emit('update:modelValue', { ...rango.value, [parte]: valor === '' ? null : valor })
}

// Búsqueda remota con pausa: no se consulta el servidor por cada tecla
const busqueda = ref('')
let temporizador: ReturnType<typeof setTimeout> | null = null

watch(busqueda, texto => {
  if (props.def.tipo !== 'search')
    return
  if (temporizador)
    clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    if (texto.trim().length >= (typeof props.def.config.min_chars === 'number' ? props.def.config.min_chars : 3))
      emit('buscar', texto.trim())
  }, 300)
})
</script>

<template>
  <div class="filtro-campo">
    <AppAutocomplete
      v-if="def.tipo === 'period' || def.tipo === 'select'"
      :model-value="modelValue"
      :items="items"
      item-title="label"
      item-value="value"
      :label="etiqueta"
      :placeholder="placeholder"
      :loading="cargando"
      :disabled="deshabilitado"
      :error-messages="error"
      :no-data-text="t('reportes.filtros.sinOpciones')"
      clearable
      @update:model-value="actualizar"
    />

    <AppAutocomplete
      v-else-if="def.tipo === 'multiselect'"
      :model-value="Array.isArray(modelValue) ? modelValue : []"
      :items="items"
      item-title="label"
      item-value="value"
      :label="etiqueta"
      :placeholder="placeholder ?? t('reportes.filtros.todos')"
      :loading="cargando"
      :disabled="deshabilitado"
      :error-messages="error"
      :no-data-text="t('reportes.filtros.sinOpciones')"
      multiple
      chips
      closable-chips
      clearable
      @update:model-value="actualizar"
    />

    <AppAutocomplete
      v-else-if="def.tipo === 'search'"
      v-model:search="busqueda"
      :model-value="modelValue"
      :items="items"
      item-title="label"
      item-value="value"
      :label="etiqueta"
      :placeholder="placeholder ?? t('reportes.filtros.buscar')"
      :loading="cargando"
      :disabled="deshabilitado"
      :error-messages="error"
      :no-data-text="t('reportes.filtros.sinOpciones')"
      no-filter
      clearable
      @update:model-value="actualizar"
    />

    <div
      v-else-if="def.tipo === 'period_range'"
      class="d-flex flex-column gap-2"
    >
      <AppAutocomplete
        :model-value="rango.desde"
        :items="items"
        item-title="label"
        item-value="value"
        :label="`${etiqueta} · ${t('reportes.filtros.desde')}`"
        :loading="cargando"
        :disabled="deshabilitado"
        :error-messages="error"
        clearable
        @update:model-value="(v: unknown) => actualizarRango('desde', v)"
      />
      <AppAutocomplete
        :model-value="rango.hasta"
        :items="items"
        item-title="label"
        item-value="value"
        :label="t('reportes.filtros.hasta')"
        :loading="cargando"
        :disabled="deshabilitado"
        clearable
        @update:model-value="(v: unknown) => actualizarRango('hasta', v)"
      />
    </div>

    <div
      v-else-if="def.tipo === 'date_range'"
      class="d-flex flex-column gap-2"
    >
      <AppTextField
        :model-value="rango.desde"
        type="date"
        :label="`${etiqueta} · ${t('reportes.filtros.desde')}`"
        :disabled="deshabilitado"
        :error-messages="error"
        @update:model-value="(v: unknown) => actualizarRango('desde', v)"
      />
      <AppTextField
        :model-value="rango.hasta"
        type="date"
        :label="t('reportes.filtros.hasta')"
        :disabled="deshabilitado"
        @update:model-value="(v: unknown) => actualizarRango('hasta', v)"
      />
    </div>

    <VSwitch
      v-else-if="def.tipo === 'boolean'"
      :model-value="modelValue === true || modelValue === 'true' || modelValue === 1"
      :label="etiqueta"
      :disabled="deshabilitado"
      :error-messages="error"
      color="primary"
      inset
      @update:model-value="actualizar"
    />

    <AppTextField
      v-else-if="def.tipo === 'number'"
      :model-value="modelValue"
      type="number"
      :label="etiqueta"
      :placeholder="placeholder"
      :disabled="deshabilitado"
      :error-messages="error"
      clearable
      @update:model-value="actualizar"
    />

    <AppTextField
      v-else
      :model-value="modelValue"
      :label="etiqueta"
      :placeholder="placeholder"
      :disabled="deshabilitado"
      :error-messages="error"
      clearable
      @update:model-value="actualizar"
    />
  </div>
</template>
