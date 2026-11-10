<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfiguracion } from '../composables/useConfiguracion'
import type { Configuracion } from '../types/cartera'
import { useNotificacion } from '@/composables/useNotificacion'

/* Configuración de cartera por empresa: la ve quien lee cartera y la cambia quien la administra. */
const { t } = useI18n()
const notificar = useNotificacion()
const c = useConfiguracion()

const editable = computed(() => c.datos.value?.puede_editar ?? false)
type Clave = keyof Configuracion
const limite = (clave: Clave) => c.datos.value?.limites[clave] ?? { min: 1, max: 1 }
const regla = (clave: Clave) => () => c.invalido.value === clave ? t('cartera.configuracion.fueraLimites', limite(clave)) : true

async function guardar() {
  if (await c.guardar())
    notificar.exito(t('cartera.configuracion.guardado'))
}

onMounted(() => c.cargar())
</script>

<template>
  <div class="configuracion">
    <AsEncabezadoPagina
      :titulo="t('cartera.configuracion.titulo')"
      :descripcion="t('cartera.configuracion.descripcion')"
    />

    <AsEstado
      v-if="c.error.value && !c.datos.value"
      tipo="error"
      :error="c.error.value"
      @reintentar="c.cargar()"
    />
    <AsEstado
      v-else-if="!c.datos.value"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="2"
    />
    <VCard
      v-else
      variant="flat"
      class="as-tarjeta pa-4"
    >
      <VAlert
        v-if="!editable"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ t('cartera.configuracion.soloLectura') }}
      </VAlert>
      <VAlert
        v-if="c.error.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ c.error.value.mensaje }}
      </VAlert>
      <VTextField
        v-model.number="c.edicion.vigencia_dias"
        type="number"
        :min="limite('vigencia_dias').min"
        :max="limite('vigencia_dias').max"
        :label="t('cartera.configuracion.vigencia')"
        :hint="t('cartera.configuracion.vigenciaAyuda')"
        persistent-hint
        :readonly="!editable"
        :rules="[regla('vigencia_dias')]"
        class="mb-5"
      />
      <VTextField
        v-model.number="c.edicion.capacidad_lote"
        type="number"
        :min="limite('capacidad_lote').min"
        :max="limite('capacidad_lote').max"
        :label="t('cartera.configuracion.capacidad')"
        :hint="t('cartera.configuracion.capacidadAyuda')"
        persistent-hint
        :readonly="!editable"
        :rules="[regla('capacidad_lote')]"
        class="mb-5"
      />
      <VTextField
        v-model.number="c.edicion.seguimiento_dias"
        type="number"
        :min="limite('seguimiento_dias').min"
        :max="limite('seguimiento_dias').max"
        :label="t('cartera.configuracion.seguimiento')"
        :hint="t('cartera.configuracion.seguimientoAyuda')"
        persistent-hint
        :readonly="!editable"
        :rules="[regla('seguimiento_dias')]"
        class="mb-5"
      />
      <VTextField
        v-if="c.claves.value.includes('revisita_intentos')"
        v-model.number="c.edicion.revisita_intentos"
        type="number"
        :min="limite('revisita_intentos').min"
        :max="limite('revisita_intentos').max"
        :label="t('cartera.configuracion.revisita')"
        :hint="t('cartera.configuracion.revisitaAyuda')"
        persistent-hint
        :readonly="!editable"
        :rules="[regla('revisita_intentos')]"
        class="mb-5"
      />
      <VSwitch
        v-if="c.claves.value.includes('ticket_qr')"
        v-model="c.edicion.ticket_qr"
        :true-value="1"
        :false-value="0"
        color="primary"
        inset
        :label="t('cartera.configuracion.ticketQr')"
        :hint="t('cartera.configuracion.ticketQrAyuda')"
        persistent-hint
        :readonly="!editable"
        class="mb-5"
      />
      <div
        v-if="editable"
        class="d-flex justify-end"
      >
        <AsBtnPrimario
          :loading="c.guardando.value"
          :disabled="!!c.invalido.value || !Object.keys(c.cambios.value).length"
          @click="guardar"
        >
          {{ t('cartera.configuracion.guardar') }}
        </AsBtnPrimario>
      </div>
    </VCard>
  </div>
</template>

<style scoped>
.configuracion .as-tarjeta {
  max-inline-size: 640px;
}
</style>
