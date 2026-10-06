<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FiltroDef, Opcion, ValoresFiltros } from '../../types/reporte'
import FiltroCampo from './FiltroCampo.vue'

const props = defineProps<{
  definiciones: FiltroDef[]
  valores: ValoresFiltros
  opciones: Record<string, Opcion[]>
  cargandoOpciones: Record<string, boolean>
  errores: Record<string, string>
  cargando: boolean
  completo: boolean
}>()

const emit = defineEmits<{
  cambiar: [key: string, valor: unknown]
  buscar: [def: FiltroDef, texto: string]
  consultar: []
  limpiar: []
}>()

const { t } = useI18n()

const visibles = computed(() => props.definiciones.filter(def => !def.oculto))

function mensajeError(key: string): string | undefined {
  const codigo = props.errores[key]
  if (!codigo)
    return undefined

  return codigo === 'requerido' ? t('reportes.filtros.requerido') : codigo
}
</script>

<template>
  <VCard>
    <VCardItem>
      <VCardTitle>{{ t('reportes.visor.filtros') }}</VCardTitle>
    </VCardItem>
    <VCardText>
      <form
        class="d-flex flex-column gap-4"
        @submit.prevent="emit('consultar')"
      >
        <FiltroCampo
          v-for="def in visibles"
          :key="def.key"
          :def="def"
          :model-value="valores[def.key]"
          :opciones="opciones[def.key]"
          :cargando="cargandoOpciones[def.key]"
          :error="mensajeError(def.key)"
          :deshabilitado="cargando"
          @update:model-value="(v: unknown) => emit('cambiar', def.key, v)"
          @buscar="(texto: string) => emit('buscar', def, texto)"
        />

        <div class="d-flex gap-2 mt-2">
          <VBtn
            type="submit"
            color="primary"
            :loading="cargando"
            :disabled="!completo"
            prepend-icon="tabler-search"
            block
          >
            {{ t('reportes.visor.consultar') }}
          </VBtn>
        </div>
        <VBtn
          variant="text"
          size="small"
          :disabled="cargando"
          prepend-icon="tabler-eraser"
          @click="emit('limpiar')"
        >
          {{ t('reportes.visor.limpiar') }}
        </VBtn>
      </form>
    </VCardText>
  </VCard>
</template>
