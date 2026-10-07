<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlcancesAdmin } from '../../composables/useAlcancesAdmin'
import type { UsuarioAlcance } from '../../types/api'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/* Gerencias por usuario (manage monitoring): quién ve qué gerencia en el monitoreo. Admin y quien administra ven todas. */
const { t } = useI18n()
const admin = useAlcancesAdmin()
const aviso = ref<string | null>(null)

let controlador: AbortController | null = null

function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  admin.cargar(controlador.signal)
}

async function guardar(usuario: UsuarioAlcance) {
  if (await admin.guardar(usuario))
    aviso.value = t('monitoreo.alcances.guardado', { usuario: usuario.nombre })
}

onMounted(cargar)
onBeforeUnmount(() => controlador?.abort())
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.alcances.titulo') }}
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          {{ t('monitoreo.alcances.descripcion') }}
        </p>
      </div>
      <VBtn
        variant="tonal"
        prepend-icon="tabler-refresh"
        :loading="admin.cargando.value"
        @click="cargar"
      >
        {{ t('monitoreo.alcances.recargar') }}
      </VBtn>
    </div>

    <VProgressLinear
      v-if="admin.cargando.value && !admin.usuarios.value.length"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-if="admin.error.value"
      class="mb-4"
      :error="admin.error.value"
      mostrar-detalle
      @reintentar="cargar"
    />

    <VAlert
      v-if="admin.aviso.value"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      {{ admin.aviso.value }} {{ t('monitoreo.alcances.sinCatalogo') }}
    </VAlert>

    <EstadoError
      v-if="admin.errorGuardado.value"
      class="mb-4"
      :error="admin.errorGuardado.value"
      mostrar-detalle
    />

    <template v-if="admin.usuarios.value.length">
      <VCard class="mb-4">
        <VCardText class="d-flex flex-wrap gap-4 align-center">
          <AppTextField
            v-model="admin.busqueda.value"
            :placeholder="t('monitoreo.alcances.buscar')"
            prepend-inner-icon="tabler-search"
            clearable
            style="max-inline-size: 320px;"
            hide-details
          />
          <VSwitch
            v-model="admin.soloConMonitoreo.value"
            :label="t('monitoreo.alcances.soloConMonitoreo')"
            color="primary"
            hide-details
          />
        </VCardText>
      </VCard>

      <VCard>
        <VTable density="comfortable">
          <thead>
            <tr>
              <th>{{ t('monitoreo.alcances.usuario') }}</th>
              <th>{{ t('monitoreo.alcances.roles') }}</th>
              <th style="min-inline-size: 320px;">
                {{ t('monitoreo.alcances.gerencias') }}
              </th>
              <th class="text-end">
                {{ t('monitoreo.alcances.acciones') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="usuario in admin.filtrados.value"
              :key="usuario.id"
            >
              <td>
                <div class="font-weight-medium">
                  {{ usuario.nombre }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ usuario.email }}
                </div>
                <div
                  v-if="!usuario.tiene_monitoreo && !usuario.es_admin"
                  class="text-caption text-warning"
                >
                  {{ t('monitoreo.alcances.sinPermiso') }}
                </div>
              </td>
              <td>
                <div class="d-flex flex-wrap gap-1">
                  <VChip
                    v-for="rol in usuario.roles"
                    :key="rol"
                    size="small"
                    variant="tonal"
                  >
                    {{ rol }}
                  </VChip>
                </div>
              </td>
              <td>
                <VChip
                  v-if="usuario.ve_todas"
                  color="primary"
                  variant="tonal"
                  prepend-icon="tabler-world"
                >
                  {{ t('monitoreo.alcances.veTodas') }}
                </VChip>
                <VSelect
                  v-else
                  :model-value="admin.seleccion.value[usuario.id] ?? admin.asignadas(usuario)"
                  :items="admin.gerencias.value"
                  item-title="label"
                  item-value="id"
                  multiple
                  chips
                  closable-chips
                  density="compact"
                  hide-details
                  :disabled="!admin.catalogoDisponible.value"
                  :placeholder="t('monitoreo.alcances.ninguna')"
                  @update:model-value="(ids: number[]) => admin.seleccionar(usuario, ids)"
                />
              </td>
              <td class="text-end text-no-wrap">
                <template v-if="!usuario.ve_todas">
                  <VBtn
                    size="small"
                    variant="text"
                    :disabled="!admin.cambio(usuario) || admin.guardando.value.has(usuario.id)"
                    @click="admin.restaurar(usuario)"
                  >
                    {{ t('monitoreo.alcances.descartar') }}
                  </VBtn>
                  <VBtn
                    size="small"
                    color="primary"
                    :loading="admin.guardando.value.has(usuario.id)"
                    :disabled="!admin.cambio(usuario) || !admin.catalogoDisponible.value"
                    @click="guardar(usuario)"
                  >
                    {{ t('monitoreo.alcances.guardar') }}
                  </VBtn>
                </template>
              </td>
            </tr>
            <tr v-if="!admin.filtrados.value.length">
              <td
                colspan="4"
                class="text-center text-medium-emphasis py-6"
              >
                {{ t('monitoreo.alcances.sinResultados') }}
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCard>
    </template>

    <VSnackbar
      :model-value="!!aviso"
      :timeout="3000"
      color="success"
      @update:model-value="aviso = null"
    >
      {{ aviso }}
    </VSnackbar>
  </div>
</template>
