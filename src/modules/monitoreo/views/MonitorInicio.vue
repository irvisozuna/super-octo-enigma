<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAlcanceStore } from '../stores/alcanceStore'
import EstadoError from '@/modules/reportes/components/comunes/EstadoError.vue'

/*
 * Inicio del monitoreo (fase 0): confirma permisos y alcance por gerencia del usuario.
 * El monitor del día con el mapa llega en la fase 1 y se montará sobre esta misma pantalla.
 */
const { t } = useI18n()
const alcance = useAlcanceStore()

let controlador: AbortController | null = null

function cargar() {
  controlador?.abort()
  controlador = new AbortController()
  alcance.cargar(controlador.signal)
}

onMounted(cargar)
onBeforeUnmount(() => controlador?.abort())
</script>

<template>
  <div>
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <h4 class="text-h4 mb-1">
          {{ t('monitoreo.inicio.titulo') }}
        </h4>
        <p class="text-body-1 text-medium-emphasis mb-0">
          {{ t('monitoreo.inicio.descripcion') }}
        </p>
      </div>
      <VBtn
        v-if="alcance.puedeAdministrar"
        variant="tonal"
        prepend-icon="tabler-users-group"
        :to="{ name: 'monitoreoAdminAlcances' }"
      >
        {{ t('monitoreo.menu.alcances') }}
      </VBtn>
    </div>

    <VProgressLinear
      v-if="alcance.cargando && !alcance.me"
      indeterminate
      class="mb-4"
    />

    <EstadoError
      v-if="alcance.error"
      class="mb-4"
      :error="alcance.error"
      @reintentar="cargar"
    />

    <template v-if="alcance.me">
      <VAlert
        v-if="alcance.sinAsignar"
        type="warning"
        variant="tonal"
        class="mb-4"
        :title="t('monitoreo.inicio.sinGerenciasTitulo')"
      >
        {{ t('monitoreo.inicio.sinGerenciasDetalle') }}
      </VAlert>

      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardItem>
              <VCardTitle>{{ t('monitoreo.inicio.alcanceTitulo') }}</VCardTitle>
            </VCardItem>
            <VCardText>
              <p
                v-if="alcance.todas"
                class="mb-3"
              >
                {{ t('monitoreo.inicio.todasLasGerencias') }}
              </p>
              <p
                v-else-if="!alcance.sinAsignar"
                class="mb-3"
              >
                {{ t('monitoreo.inicio.gerenciasAsignadas', alcance.gerencias.length) }}
              </p>
              <div
                v-if="alcance.gerencias.length"
                class="d-flex flex-wrap gap-2"
              >
                <VChip
                  v-for="gerencia in alcance.gerencias"
                  :key="gerencia.id"
                  color="primary"
                  variant="tonal"
                  prepend-icon="tabler-map-pin"
                >
                  {{ gerencia.label }}
                </VChip>
              </div>
              <p
                v-else-if="alcance.todas && !alcance.me.catalogo_disponible"
                class="text-medium-emphasis mb-0"
              >
                {{ t('monitoreo.inicio.catalogoNoDisponible') }}
              </p>
            </VCardText>
          </VCard>
        </VCol>

        <VCol
          cols="12"
          md="6"
        >
          <VCard>
            <VCardItem>
              <VCardTitle>{{ t('monitoreo.inicio.permisosTitulo') }}</VCardTitle>
            </VCardItem>
            <VCardText class="d-flex flex-wrap gap-2">
              <VChip
                color="success"
                variant="tonal"
                prepend-icon="tabler-eye"
              >
                {{ t('monitoreo.inicio.permisoVer') }}
              </VChip>
              <VChip
                :color="alcance.puedeOperar ? 'success' : 'secondary'"
                :variant="alcance.puedeOperar ? 'tonal' : 'outlined'"
                :prepend-icon="alcance.puedeOperar ? 'tabler-bell-ringing' : 'tabler-bell-off'"
              >
                {{ t('monitoreo.inicio.permisoOperar') }}
              </VChip>
              <VChip
                :color="alcance.puedeAdministrar ? 'success' : 'secondary'"
                :variant="alcance.puedeAdministrar ? 'tonal' : 'outlined'"
                :prepend-icon="alcance.puedeAdministrar ? 'tabler-settings' : 'tabler-settings-off'"
              >
                {{ t('monitoreo.inicio.permisoAdministrar') }}
              </VChip>
            </VCardText>
          </VCard>
        </VCol>

        <VCol cols="12">
          <VCard>
            <VCardItem>
              <VCardTitle>{{ t('monitoreo.inicio.proximoTitulo') }}</VCardTitle>
            </VCardItem>
            <VCardText>
              <p class="mb-2">
                {{ t('monitoreo.inicio.proximoDetalle') }}
              </p>
              <ul class="ps-5 mb-0">
                <li>{{ t('monitoreo.inicio.proximo1') }}</li>
                <li>{{ t('monitoreo.inicio.proximo2') }}</li>
                <li>{{ t('monitoreo.inicio.proximo3') }}</li>
              </ul>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </template>
  </div>
</template>
