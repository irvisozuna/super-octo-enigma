<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { borrarDestinatario, guardarDestinatario, obtenerDestinatarios } from '../../services/monitoreoApi'
import { useAlcanceStore } from '../../stores/alcanceStore'
import type { CanalDestinatario, Destinatario, EdicionDestinatario, RespuestaDestinatarios } from '../../types/destinatarios'
import { normalizarError } from '@/modules/reportes/services/errores'
import type { ErrorReporte } from '@/modules/reportes/services/errores'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Destinatarios de los canales de alerta (F2.3): usuarios de Atención (campana y correo) o correos externos, por gerencia
 * o para todas. Cambiarlos surte efecto en el siguiente ciclo sin despliegue.
 */
const { t } = useI18n()
const alcance = useAlcanceStore()

const datos = ref<RespuestaDestinatarios | null>(null)
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const guardando = ref(false)
const errorGuardado = ref<ErrorReporte | null>(null)
const dialogo = ref(false)
const editandoId = ref<string | null>(null)
const CANALES: CanalDestinatario[] = ['campana', 'correo_alta', 'resumen', 'escalamiento']

const vacio = (): EdicionDestinatario & { tipo: 'usuario' | 'correo' } => ({ tipo: 'usuario', usuario_id: null, email: '', nombre: '', gerencia_id: null, canales: ['campana'], activo: true })
const forma = reactive(vacio())

const opcionesUsuario = computed(() => (datos.value?.usuarios ?? []).map(u => ({ value: u.id, title: u.email ? `${u.nombre} · ${u.email}` : u.nombre })))
const opcionesGerencia = computed(() => [{ value: null, title: t('monitoreo.destinatarios.todas') }, ...alcance.gerencias.map(g => ({ value: g.id, title: g.label }))])
const nombreGerencia = (id: number | null) => (id === null ? t('monitoreo.destinatarios.todas') : alcance.gerencias.find(g => g.id === id)?.label ?? `#${id}`)

const headers = computed(() => [
  { title: t('monitoreo.destinatarios.quien'), key: 'quien', sortable: false },
  { title: t('monitoreo.destinatarios.gerencia'), key: 'gerencia_id', sortable: false, width: 180 },
  { title: t('monitoreo.destinatarios.canales'), key: 'canales', sortable: false },
  { title: t('monitoreo.destinatarios.activo'), key: 'activo', sortable: false, width: 90 },
  { title: '', key: 'acciones', sortable: false, width: 120, align: 'end' as const },
])

async function cargar() {
  cargando.value = true
  try {
    datos.value = await obtenerDestinatarios()
    error.value = null
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

function nuevo() {
  Object.assign(forma, vacio())
  editandoId.value = null
  errorGuardado.value = null
  dialogo.value = true
}

function editar(d: Destinatario) {
  Object.assign(forma, { tipo: d.usuario_id ? 'usuario' : 'correo', usuario_id: d.usuario_id, email: d.usuario_id ? '' : (d.email ?? ''), nombre: d.nombre ?? '', gerencia_id: d.gerencia_id, canales: [...d.canales], activo: d.activo })
  editandoId.value = d.id
  errorGuardado.value = null
  dialogo.value = true
}

async function guardar() {
  guardando.value = true
  errorGuardado.value = null
  try {
    const cuerpo: EdicionDestinatario = {
      usuario_id: forma.tipo === 'usuario' ? forma.usuario_id : null,
      email: forma.tipo === 'correo' ? forma.email.trim() : '',
      nombre: forma.nombre.trim(),
      gerencia_id: forma.gerencia_id,
      canales: forma.tipo === 'correo' ? forma.canales.filter(c => c !== 'campana') : forma.canales,
      activo: forma.activo,
    }

    await guardarDestinatario(editandoId.value, cuerpo)
    dialogo.value = false
    await cargar()
  }
  catch (e) {
    errorGuardado.value = normalizarError(e)
  }
  finally {
    guardando.value = false
  }
}

async function borrar(d: Destinatario) {
  guardando.value = true
  try {
    await borrarDestinatario(d.id)
    await cargar()
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    guardando.value = false
  }
}

onMounted(async () => {
  if (!alcance.cargado)
    await alcance.cargar()
  await cargar()
})
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-4">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.destinatarios.titulo') }}
        </h4>
        <p class="text-body-2 text-medium-emphasis mb-0">
          {{ t('monitoreo.destinatarios.descripcion') }}
        </p>
      </div>
      <VBtn
        color="primary"
        prepend-icon="tabler-plus"
        class="text-none"
        @click="nuevo"
      >
        {{ t('monitoreo.destinatarios.agregar') }}
      </VBtn>
    </div>

    <EstadoError
      v-if="error && !datos"
      class="mb-4"
      :error="error"
      @reintentar="cargar"
    />
    <VAlert
      v-else-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-3"
      closable
      @click:close="error = null"
    >
      {{ error.mensaje }}
    </VAlert>

    <VCard>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <VDataTable
        :headers="headers"
        :items="datos?.destinatarios ?? []"
        item-value="id"
        density="compact"
        :items-per-page="-1"
        hide-default-footer
        :no-data-text="t('monitoreo.destinatarios.sinFilas')"
      >
        <template #item.quien="{ item }">
          <div class="font-weight-medium">
            {{ item.usuario ?? item.nombre ?? item.email }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ item.usuario_id ? t('monitoreo.destinatarios.usuarioAtencion') : t('monitoreo.destinatarios.correoExterno') }}<span v-if="item.email"> · {{ item.email }}</span>
          </div>
        </template>
        <template #item.gerencia_id="{ item }">
          {{ nombreGerencia(item.gerencia_id) }}
        </template>
        <template #item.canales="{ item }">
          <VChip
            v-for="c in item.canales"
            :key="c"
            size="x-small"
            label
            variant="tonal"
            class="me-1"
          >
            {{ t(`monitoreo.destinatarios.canal.${c}`) }}
          </VChip>
        </template>
        <template #item.activo="{ item }">
          <VIcon
            :icon="item.activo ? 'tabler-check' : 'tabler-minus'"
            :color="item.activo ? 'success' : undefined"
            size="18"
          />
        </template>
        <template #item.acciones="{ item }">
          <VBtn
            icon="tabler-pencil"
            size="small"
            variant="text"
            @click="editar(item)"
          />
          <VBtn
            icon="tabler-trash"
            size="small"
            variant="text"
            color="error"
            :disabled="guardando"
            @click="borrar(item)"
          />
        </template>
      </VDataTable>
    </VCard>

    <VDialog
      v-model="dialogo"
      max-width="560"
    >
      <VCard>
        <VCardItem>
          <VCardTitle>{{ editandoId ? t('monitoreo.destinatarios.editar') : t('monitoreo.destinatarios.agregar') }}</VCardTitle>
        </VCardItem>
        <VCardText class="d-flex flex-column gap-3">
          <VChipGroup
            v-model="forma.tipo"
            mandatory
            selected-class="text-primary"
          >
            <VChip
              value="usuario"
              label
              filter
            >
              {{ t('monitoreo.destinatarios.usuarioAtencion') }}
            </VChip>
            <VChip
              value="correo"
              label
              filter
            >
              {{ t('monitoreo.destinatarios.correoExterno') }}
            </VChip>
          </VChipGroup>
          <VSelect
            v-if="forma.tipo === 'usuario'"
            v-model="forma.usuario_id"
            :items="opcionesUsuario"
            :label="t('monitoreo.destinatarios.usuario')"
            density="compact"
            variant="outlined"
            hide-details
          />
          <template v-else>
            <VTextField
              v-model="forma.email"
              type="email"
              :label="t('monitoreo.destinatarios.email')"
              density="compact"
              variant="outlined"
              hide-details
            />
            <VTextField
              v-model="forma.nombre"
              :label="t('monitoreo.destinatarios.nombre')"
              density="compact"
              variant="outlined"
              hide-details
            />
          </template>
          <VSelect
            v-model="forma.gerencia_id"
            :items="opcionesGerencia"
            :label="t('monitoreo.destinatarios.gerencia')"
            density="compact"
            variant="outlined"
            hide-details
          />
          <div>
            <div class="text-caption text-medium-emphasis mb-1">
              {{ t('monitoreo.destinatarios.canales') }}
            </div>
            <VCheckbox
              v-for="c in CANALES"
              :key="c"
              v-model="forma.canales"
              :value="c"
              density="compact"
              hide-details
              :disabled="c === 'campana' && forma.tipo === 'correo'"
              :label="`${t(`monitoreo.destinatarios.canal.${c}`)} · ${t(`monitoreo.destinatarios.canalDetalle.${c}`)}`"
            />
          </div>
          <VSwitch
            v-model="forma.activo"
            density="compact"
            hide-details
            color="primary"
            :label="t('monitoreo.destinatarios.activo')"
          />
          <VAlert
            v-if="errorGuardado"
            type="error"
            variant="tonal"
            density="compact"
          >
            {{ errorGuardado.mensaje }}
          </VAlert>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            class="text-none"
            @click="dialogo = false"
          >
            {{ t('monitoreo.destinatarios.cancelar') }}
          </VBtn>
          <VBtn
            color="primary"
            class="text-none"
            :loading="guardando"
            @click="guardar"
          >
            {{ t('monitoreo.destinatarios.guardar') }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
