<script setup lang="ts">
import { markRaw, onMounted, ref } from 'vue'
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AdjustmentsTab from '../components/AdjustmentsTab.vue'
import AgreementsTab from '../components/AgreementsTab.vue'
import BillingHistoryTab from '../components/BillingHistoryTab.vue'
import ContractDetails from '../components/ContractDetails.vue'
import ContractSearchDialog from '../components/dialog/ContractSearchDialog.vue'
import NotesTab from '../components/NotesTab.vue'
import PaymentHistoryTab from '../components/PaymentHistoryTab.vue'
import ReadingsTab from '../components/ReadingsTab.vue'
import WorkOrdersTab from '../components/WorkOrdersTab.vue'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { normalizarError } from '@/services/errores'
import type { ErrorReporte } from '@/services/errores'

/*
 * Atención a usuarios: búsqueda del contrato por cuenta (o avanzada) y su ficha en pestañas. Cada pestaña carga sus
 * datos al activarse. Enlace profundo desde el monitoreo: /supports?cuenta=10702033.
 */
interface Pestana {
  titulo: string
  icono: string
  componente: Component
}

const { t } = useI18n()
const route = useRoute()
const store = useContractStore()

const activa = ref(0)
const cuenta = ref('')
const cargando = ref(false)
const error = ref<ErrorReporte | null>(null)
const busquedaAbierta = ref(false)

const pestanas: Pestana[] = [
  { icono: 'tabler-user', titulo: t('tabs.generalInfo'), componente: markRaw(ContractDetails) },
  { icono: 'tabler-receipt', titulo: t('tabs.billingHistory'), componente: markRaw(BillingHistoryTab) },
  { icono: 'tabler-cash', titulo: t('tabs.paymentHistory'), componente: markRaw(PaymentHistoryTab) },
  { icono: 'tabler-gauge', titulo: t('tabs.readings'), componente: markRaw(ReadingsTab) },
  { icono: 'tabler-clipboard', titulo: t('tabs.workOrders'), componente: markRaw(WorkOrdersTab) },
  { icono: 'tabler-file-like', titulo: t('tabs.agreements'), componente: markRaw(AgreementsTab) },
  { icono: 'tabler-adjustments', titulo: t('tabs.settings'), componente: markRaw(AdjustmentsTab) },
  { icono: 'tabler-note', titulo: t('tabs.notes'), componente: markRaw(NotesTab) },
]

async function buscar() {
  const q = cuenta.value.trim()
  if (!q)
    return
  cargando.value = true
  error.value = null
  try {
    await store.getContract(q)
    activa.value = 0
    cuenta.value = ''
  }
  catch (e) {
    error.value = normalizarError(e)
  }
  finally {
    cargando.value = false
  }
}

onMounted(() => {
  const q = typeof route.query.cuenta === 'string' ? route.query.cuenta.trim() : ''
  if (q) {
    cuenta.value = q
    buscar()
  }
})
</script>

<template>
  <div class="soporte">
    <AsEncabezadoPagina
      :titulo="t('support.titulo')"
      :descripcion="t('support.descripcion')"
    />

    <VCard
      variant="flat"
      class="as-tarjeta soporte__buscador mb-4"
    >
      <form
        class="d-flex flex-wrap align-center gap-2"
        role="search"
        @submit.prevent="buscar"
      >
        <VTextField
          v-model="cuenta"
          :label="t('support.buscar.cuenta')"
          :aria-label="t('support.buscar.cuenta')"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          autofocus
          inputmode="numeric"
          prepend-inner-icon="tabler-search"
          class="soporte__cuenta"
        />
        <AsBtnPrimario
          type="submit"
          :loading="cargando"
          :disabled="!cuenta.trim()"
        >
          {{ t('support.buscar.boton') }}
        </AsBtnPrimario>
        <AsBtnSecundario
          prepend-icon="tabler-filter-search"
          @click="busquedaAbierta = true"
        >
          {{ t('support.buscar.avanzada') }}
        </AsBtnSecundario>
      </form>
    </VCard>

    <AsEstado
      v-if="error"
      tipo="error"
      class="mb-4"
      :error="error"
      :detalle="error.mensaje || t('support.buscar.noEncontrado', { cuenta })"
      @reintentar="buscar"
    />
    <AsEstado
      v-else-if="!store.item && !cargando"
      tipo="vacio"
      :titulo="t('support.buscar.vacioTitulo')"
      :detalle="t('support.buscar.ayuda')"
      icono="tabler-user-search"
    />
    <AsEstado
      v-else-if="!store.item"
      tipo="cargando"
      esqueleto="tarjeta"
      :filas="3"
    />

    <VCard
      v-if="store.item"
      variant="flat"
      class="as-tarjeta soporte__ficha"
      :loading="cargando"
    >
      <VTabs
        v-model="activa"
        class="soporte__pestanas"
      >
        <VTab
          v-for="(p, i) in pestanas"
          :key="i"
          :value="i"
          :prepend-icon="p.icono"
        >
          {{ p.titulo }}
        </VTab>
      </VTabs>
      <VDivider />
      <VWindow
        v-model="activa"
        :touch="false"
        class="disable-tab-transition"
      >
        <VWindowItem
          v-for="(p, i) in pestanas"
          :key="i"
          :value="i"
        >
          <component
            :is="p.componente"
            :activa="activa === i"
          />
        </VWindowItem>
      </VWindow>
    </VCard>

    <ContractSearchDialog
      v-model:abierto="busquedaAbierta"
      @seleccionado="activa = 0"
    />
  </div>
</template>

<style scoped>
.soporte__buscador {
  padding-block: var(--as-sp-3);
  padding-inline: var(--as-sp-4);
}

.soporte__cuenta {
  flex: 1 1 var(--as-ancho-filtro-lg);
  max-inline-size: calc(var(--as-ancho-filtro-lg) * 1.5);
}

.soporte__ficha {
  overflow: hidden;
}

.soporte__pestanas :deep(.v-tab) {
  text-transform: none;
}
</style>
