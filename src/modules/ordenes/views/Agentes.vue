<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAgentes } from '../composables/useOrdenes'
import { obtenerCatalogo } from '../services/ordenesApi'
import type { Agente, EdicionAgente, TipoOrden } from '../types/ordenes'
import type { ColumnaTabla } from '@/components/as/tipos'
import { useNotificacion } from '@/composables/useNotificacion'

/* Agentes de campo del núcleo: los ven quienes leen órdenes y los dan de alta o editan quienes las administran. */
const { t } = useI18n()
const notificar = useNotificacion()
const a = useAgentes()
const tipos = ref<TipoOrden[]>([])
const editando = ref<Agente | null>(null)
const abierto = ref(false)
const edicion = reactive<EdicionAgente>({ nombre: '', tipos: [], activo: true })

const opcionesTipo = computed(() => tipos.value.map(x => ({ value: x.codigo, title: x.nombre })))
const nombreTipo = (codigo: string) => tipos.value.find(x => x.codigo === codigo)?.nombre ?? codigo

const columnas: ColumnaTabla<Agente>[] = [
  { clave: 'nombre', titulo: t('ordenes.agentes.nombre'), formato: 'texto', anchoMin: 240 },
  { clave: 'tipos', titulo: t('ordenes.agentes.tipos'), formato: 'personalizado', ordenable: false, anchoMin: 200 },
  { clave: 'usuario_comercial', titulo: t('ordenes.agentes.comercial'), formato: 'entero', ancho: 200 },
  { clave: 'activo', titulo: t('ordenes.agentes.activo'), formato: 'personalizado', ancho: 120 },
]

function abrir(agente: Agente | null) {
  editando.value = agente
  Object.assign(edicion, agente ? { nombre: agente.nombre, tipos: [...agente.tipos], activo: agente.activo } : { nombre: '', tipos: [], activo: true })
  a.errorGuardar.value = null
  abierto.value = true
}

async function guardar() {
  if (await a.guardar(editando.value?.id ?? null, edicion)) {
    abierto.value = false
    notificar.exito(t('ordenes.agentes.guardado'))
  }
}

onMounted(async () => {
  tipos.value = (await obtenerCatalogo().catch(() => null))?.tipos ?? []
  await a.cargar()
})
</script>

<template>
  <div>
    <AsEncabezadoPagina
      :titulo="t('ordenes.agentes.titulo')"
      :descripcion="t('ordenes.agentes.descripcion')"
    >
      <template #acciones>
        <AsBtnPrimario
          v-if="a.puedeAdministrar.value"
          prepend-icon="tabler-user-plus"
          @click="abrir(null)"
        >
          {{ t('ordenes.agentes.nuevo') }}
        </AsBtnPrimario>
      </template>
    </AsEncabezadoPagina>
    <VAlert
      v-if="!a.cargando.value && a.agentes.value.length && !a.puedeAdministrar.value"
      type="info"
      variant="tonal"
      density="compact"
      class="mb-3"
    >
      {{ t('ordenes.agentes.soloLectura') }}
    </VAlert>
    <AsTablaDatos
      :columnas="columnas"
      :filas="a.agentes.value"
      clave-fila="id"
      :cargando="a.cargando.value"
      :error="a.error.value"
      :clic-fila="a.puedeAdministrar.value"
      :vacio-titulo="t('ordenes.agentes.sinFilas')"
      vacio-detalle=""
      vacio-icono="tabler-users"
      @fila="(f: Record<string, unknown>) => abrir(f as unknown as Agente)"
      @reintentar="a.cargar()"
    >
      <template #celda-tipos="{ fila }">
        {{ fila.tipos.map(nombreTipo).join(', ') || '—' }}
      </template>
      <template #celda-activo="{ fila }">
        <VChip
          size="small"
          label
          variant="tonal"
          :color="fila.activo ? 'success' : 'secondary'"
        >
          {{ fila.activo ? t('ordenes.agentes.activo') : t('ordenes.agentes.inactivo') }}
        </VChip>
      </template>
    </AsTablaDatos>

    <AsDialogo
      v-model:abierto="abierto"
      :titulo="editando ? t('ordenes.agentes.editar') : t('ordenes.agentes.nuevo')"
      tamano="sm"
      :cargando="a.guardando.value"
      :texto-confirmar="t('ordenes.agentes.guardar')"
      :desactivar-confirmar="!edicion.nombre.trim()"
      @confirmar="guardar"
    >
      <VAlert
        v-if="a.errorGuardar.value"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ a.errorGuardar.value.mensaje }}
      </VAlert>
      <VTextField
        v-model="edicion.nombre"
        :label="t('ordenes.agentes.nombre')"
        maxlength="200"
        class="mb-3"
      />
      <VSelect
        v-model="edicion.tipos"
        :items="opcionesTipo"
        :label="t('ordenes.agentes.tipos')"
        multiple
        chips
        class="mb-3"
      />
      <VSwitch
        v-model="edicion.activo"
        :label="t('ordenes.agentes.activo')"
        hide-details
        density="compact"
      />
    </AsDialogo>
  </div>
</template>
