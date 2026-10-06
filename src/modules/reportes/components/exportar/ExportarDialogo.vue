<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AlcanceExportacion, FormatoExportacion } from '../../types/exportacion'
import { formatearEntero } from '../../utils/formato'
import { UMBRAL_AVISO_FILAS, opcionesFormato } from '../../utils/exportaciones'

const props = defineProps<{
  modelValue: boolean
  formatos: FormatoExportacion[]
  limites: Partial<Record<FormatoExportacion, number>>
  totalFilas: number
  porPagina: number
  enviando?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [abierto: boolean]
  'exportar': [seleccion: { formato: FormatoExportacion; alcance: AlcanceExportacion }]
}>()

const { t } = useI18n()

const opciones = computed(() => opcionesFormato(props.formatos, props.limites, props.totalFilas))
const formato = ref<FormatoExportacion | null>(null)
const alcance = ref<AlcanceExportacion>('todo')

const permiteAlcance = computed(() => props.totalFilas > props.porPagina)
const muchasFilas = computed(() => alcance.value === 'todo' && props.totalFilas > UMBRAL_AVISO_FILAS)
const seleccionValida = computed(() => formato.value !== null && !opciones.value.find(o => o.formato === formato.value)?.deshabilitado)

watch(() => props.modelValue, abierto => {
  if (abierto) {
    formato.value = opciones.value.find(o => !o.deshabilitado)?.formato ?? null
    alcance.value = 'todo'
  }
})

function cerrar() {
  emit('update:modelValue', false)
}

function confirmar() {
  if (formato.value && seleccionValida.value)
    emit('exportar', { formato: formato.value, alcance: alcance.value })
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="520"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <VCard>
      <VCardItem>
        <VCardTitle>{{ t('reportes.exportar.titulo') }}</VCardTitle>
        <VCardSubtitle>{{ t('reportes.exportar.filas', { n: formatearEntero(totalFilas) }) }}</VCardSubtitle>
      </VCardItem>

      <VCardText class="d-flex flex-column gap-4">
        <VItemGroup
          :model-value="formato"
          mandatory
          @update:model-value="(v: FormatoExportacion) => (formato = v)"
        >
          <div class="d-flex flex-column gap-2">
            <VItem
              v-for="opcion in opciones"
              :key="opcion.formato"
              :value="opcion.formato"
              :disabled="opcion.deshabilitado"
            >
              <template #default="{ isSelected, toggle }">
                <VCard
                  variant="outlined"
                  :color="isSelected ? opcion.color : undefined"
                  :disabled="opcion.deshabilitado"
                  class="pa-3 d-flex align-center gap-3"
                  @click="toggle"
                >
                  <VIcon
                    :icon="opcion.icono"
                    :color="opcion.color"
                    size="28"
                  />
                  <div class="flex-grow-1">
                    <div class="font-weight-medium">
                      {{ opcion.titulo }}
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      <template v-if="opcion.deshabilitado && opcion.limite !== null">
                        {{ t('reportes.exportar.excedeLimite', { n: formatearEntero(opcion.limite) }) }}
                      </template>
                      <template v-else>
                        {{ opcion.descripcion }}
                      </template>
                    </div>
                  </div>
                  <VIcon
                    v-if="isSelected"
                    icon="tabler-circle-check-filled"
                    :color="opcion.color"
                  />
                </VCard>
              </template>
            </VItem>
          </div>
        </VItemGroup>

        <VRadioGroup
          v-if="permiteAlcance"
          v-model="alcance"
          :label="t('reportes.exportar.alcance')"
          hide-details
        >
          <VRadio
            value="todo"
            :label="t('reportes.exportar.todo', { n: formatearEntero(totalFilas) })"
          />
          <VRadio
            value="pagina"
            :label="t('reportes.exportar.pagina', { n: formatearEntero(porPagina) })"
          />
        </VRadioGroup>

        <VAlert
          v-if="muchasFilas"
          type="warning"
          variant="tonal"
          density="compact"
        >
          {{ t('reportes.exportar.aviso') }}
        </VAlert>
      </VCardText>

      <VCardActions class="justify-end">
        <VBtn
          variant="text"
          @click="cerrar"
        >
          {{ t('reportes.exportar.cancelar') }}
        </VBtn>
        <VBtn
          color="primary"
          :disabled="!seleccionValida"
          :loading="enviando"
          prepend-icon="tabler-download"
          @click="confirmar"
        >
          {{ t('reportes.exportar.confirmar') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
