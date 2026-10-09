<script setup lang="ts">
import { useAbility } from '@casl/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Account } from '../types/Contract'
import AccountBalanceDialog from './dialog/AccountBalanceDialog.vue'
import AccountMapDialog from './dialog/AccountMapDialog.vue'
import AddChargeDialog from './dialog/AddChargeDialog.vue'
import AddNoteDialog from './dialog/AddNoteDialog.vue'
import AddWorkOrderDialog from './dialog/AddWorkOrderDialog.vue'
import WorkOrderDetailDialog from './dialog/WorkOrderDetailDialog.vue'
import AgreementDetails from './AgreementDetails.vue'
import { useAppManager } from '@/composables/useAppManager'
import DocumentosDialogo from '@/modules/reportes/components/documentos/DocumentosDialogo.vue'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { colorEstadoContrato } from '@/utils/estados'
import { aNumero, entero, fechaCorta, moneda, texto } from '@/utils/formato'

/*
 * Cabecera fija de la ficha de contrato, visible en todas las pestañas: identidad (cuenta, estado, titular, ubicación
 * con icono y etiqueta en negrita), acciones con una sola primaria y las cifras clave en una franja compacta. Así quien
 * atiende nunca pierde de vista de qué contrato habla mientras revisa pagos, lecturas u órdenes.
 * El diálogo de documentos es del módulo de reportes y se abre con el gestor global hasta que ese módulo migre.
 */
interface Dato {
  etiqueta: string
  valor: string
  icono: string
  num?: boolean
}

const emit = defineEmits<{

  /** Pide ir a una pestaña de la ficha (4 órdenes de trabajo, 5 convenios). */
  pestana: [indice: number]
}>()

const { t } = useI18n()
const ability = useAbility()
const store = useContractStore()
const { openDialog } = useAppManager()

const contrato = computed<Account | null>(() => store.item)
const dialogos = reactive({ mapa: false, orden: false, saldo: false, cargo: false, nota: false, ultimaOrden: false, convenio: false })
const puedeDocumentos = computed(() => ability.can('generate', 'documentos'))

const ubicacion = computed<Dato[]>(() => {
  const c = contrato.value

  return [
    { icono: 'tabler-map-pin', etiqueta: t('support.ficha.direccion'), valor: texto(c?.address) },
    { icono: 'tabler-map-2', etiqueta: t('support.ficha.comunidad'), valor: texto(c?.community ?? c?.source_entity) },
    { icono: 'tabler-topology-star', etiqueta: t('support.ficha.sistema'), valor: [texto(c?.c_system), c?.sector ? `${t('support.ficha.sector')}: ${c.sector}` : null].filter(Boolean).join(' · ') },
    ...(c?.route ? [{ icono: 'tabler-route-2', etiqueta: t('support.ficha.ruta'), valor: c.route }] : []),
    ...(c?.clave_loc ? [{ icono: 'tabler-brackets-contain', etiqueta: t('support.ficha.claveLoc'), valor: c.clave_loc, num: true }] : []),
  ]
})

const mesesAdeudo = computed(() => Number(contrato.value?.months_debt) || 0)
const adeuda = computed(() => (aNumero(contrato.value?.debt) ?? 0) > 0 || mesesAdeudo.value > 0)

/*
 * Última orden de trabajo y convenio activo, con su detalle a un clic. La referencia de orden que trae el contrato no
 * dice cuál es (la consulta toma una sin ordenar, en la práctica la más antigua), así que aquí se pide la lista, que
 * viene de la más reciente a la más antigua, y se muestra la primera.
 */
const ultimaOrden = ref<Record<string, any> | null>(null)
const totalOrdenes = ref(0)
const convenioActivo = ref<Record<string, any> | null>(null)
let consulta = 0

async function cargarResumen() {
  const id = contrato.value?.id_account
  const n = ++consulta

  ultimaOrden.value = null
  totalOrdenes.value = 0
  convenioActivo.value = null
  if (!id)
    return

  const refConvenio = contrato.value?.ref_agreement

  const [ordenes, convenios] = await Promise.all([
    store.getWorkOrdersByContract(String(id), { limit: 1, page: 1 }).catch(() => null),
    refConvenio ? store.getAgreementsByContract(String(id), { limit: 50, page: 1 }).catch(() => null) : Promise.resolve(null),
  ])

  if (n !== consulta)
    return
  ultimaOrden.value = ordenes?.data?.[0] ?? null
  totalOrdenes.value = ordenes?.pagination?.total ?? 0
  convenioActivo.value = (convenios?.data ?? []).find((c: Record<string, any>) => c.ref === refConvenio) ?? null
}

watch(() => [contrato.value?.id_account, contrato.value?.ref_agreement], cargarResumen, { immediate: true })

const refOrden = computed(() => ultimaOrden.value?.ref ?? null)
const apoyoOrden = computed(() => (ultimaOrden.value ? t('support.ficha.ordenesTotal', { fecha: fechaCorta(ultimaOrden.value.datec), n: entero(totalOrdenes.value) }) : ''))

const apoyoConvenio = computed(() => {
  const c = contrato.value
  if (!c?.ref_agreement || !c.letters_agreement)
    return ''

  return t('support.ficha.convenioAvance', { p: entero(c.paid_letters_agreement), n: entero(c.letters_agreement), saldo: moneda(c.debt_agreement) })
})

function irAPestana(indice: number) {
  dialogos.ultimaOrden = false
  dialogos.convenio = false
  emit('pestana', indice)
}

async function alCrearOrden() {
  await cargarResumen()
}

function abrirDocumentos() {
  openDialog(DocumentosDialogo, { contrato: String(contrato.value?.account ?? ''), nombre: contrato.value?.nameuser ?? undefined }, { width: '1100px' })
}

async function recargar() {
  if (store.item?.account)
    await store.getContract(store.item.account)
}
</script>

<template>
  <VCard
    v-if="contrato"
    variant="flat"
    class="as-tarjeta cabecera"
  >
    <div class="cabecera__cuerpo">
      <div class="cabecera__identidad">
        <div class="as-sobrelinea">
          {{ t('support.ficha.cuenta') }}
        </div>
        <div class="d-flex align-center flex-wrap gap-2">
          <span class="cabecera__cuenta as-num">{{ contrato.account }}</span>
          <VChip
            size="small"
            label
            variant="tonal"
            :color="colorEstadoContrato(contrato.status)"
          >
            {{ contrato.status }}
          </VChip>
        </div>
        <div class="cabecera__titular">
          {{ contrato.nameuser }}
        </div>

        <ul class="cabecera__meta">
          <li
            v-for="d in ubicacion"
            :key="d.etiqueta"
            class="cabecera__meta-fila"
          >
            <VIcon
              :icon="d.icono"
              size="16"
              class="cabecera__icono"
            />
            <span class="cabecera__meta-etiqueta">{{ d.etiqueta }}:</span>
            <span
              class="cabecera__meta-valor"
              :class="{ 'as-num': d.num }"
            >{{ d.valor }}</span>
          </li>
        </ul>
      </div>

      <div
        class="cabecera__acciones"
        role="group"
        :aria-label="t('actionslabel')"
      >
        <AsBtnPrimario
          prepend-icon="tabler-plus"
          @click="dialogos.cargo = true"
        >
          {{ t('support.ficha.agregarCargo') }}
        </AsBtnPrimario>
        <AsBtnSecundario
          prepend-icon="tabler-note"
          @click="dialogos.nota = true"
        >
          {{ t('support.ficha.agregarNota') }}
        </AsBtnSecundario>
        <AsBtnSecundario
          prepend-icon="tabler-tool"
          @click="dialogos.orden = true"
        >
          {{ t('support.ficha.ordenNueva') }}
        </AsBtnSecundario>
        <AsBtnSecundario
          prepend-icon="tabler-file-invoice"
          @click="dialogos.saldo = true"
        >
          {{ t('support.ficha.estadoCuenta') }}
        </AsBtnSecundario>
        <AsBtnSecundario
          v-if="puedeDocumentos"
          prepend-icon="tabler-file-text"
          @click="abrirDocumentos"
        >
          {{ t('reportes.documentos.boton') }}
        </AsBtnSecundario>
        <AsBtnSecundario
          prepend-icon="tabler-map-pin"
          @click="dialogos.mapa = true"
        >
          {{ t('support.ficha.ubicacion') }}
        </AsBtnSecundario>
      </div>
    </div>

    <dl class="cabecera__cifras">
      <div
        class="cabecera__cifra"
        :class="{ 'cabecera__cifra--alerta': adeuda }"
      >
        <dt class="cabecera__cifra-etiqueta">
          {{ t('support.ficha.saldoVencido') }}
        </dt>
        <dd class="cabecera__cifra-valor as-num">
          {{ moneda(contrato.debt) }}
        </dd>
      </div>
      <div class="cabecera__cifra">
        <dt class="cabecera__cifra-etiqueta">
          {{ t('support.ficha.saldoFavor') }}
        </dt>
        <dd class="cabecera__cifra-valor as-num">
          {{ moneda(contrato.positive_balance) }}
        </dd>
      </div>
      <div
        class="cabecera__cifra"
        :class="{ 'cabecera__cifra--alerta': mesesAdeudo > 0 }"
      >
        <dt class="cabecera__cifra-etiqueta">
          {{ t('support.ficha.mesesAdeudo') }}
        </dt>
        <dd class="cabecera__cifra-valor as-num">
          {{ entero(mesesAdeudo) }}
        </dd>
      </div>
      <div class="cabecera__cifra">
        <dt class="cabecera__cifra-etiqueta">
          {{ t('support.ficha.convenioActivo') }}
        </dt>
        <dd class="cabecera__cifra-valor as-num">
          <button
            v-if="contrato.ref_agreement"
            type="button"
            class="cabecera__enlace"
            :title="t('support.ficha.verDetalle', { que: contrato.ref_agreement })"
            @click="dialogos.convenio = true"
          >
            {{ contrato.ref_agreement }}
            <VIcon
              icon="tabler-chevron-right"
              size="16"
            />
          </button>
          <span
            v-else
            class="cabecera__cifra-valor--vacio"
          >{{ t('support.ficha.sinConvenio') }}</span>
        </dd>
        <dd
          v-if="apoyoConvenio"
          class="cabecera__cifra-apoyo as-num"
        >
          {{ apoyoConvenio }}
        </dd>
      </div>
      <div class="cabecera__cifra">
        <dt class="cabecera__cifra-etiqueta">
          {{ t('support.ficha.ultimaOrden') }}
        </dt>
        <dd class="cabecera__cifra-valor as-num">
          <button
            v-if="refOrden"
            type="button"
            class="cabecera__enlace"
            :title="t('support.ficha.verDetalle', { que: refOrden })"
            @click="dialogos.ultimaOrden = true"
          >
            {{ refOrden }}
            <VIcon
              icon="tabler-chevron-right"
              size="16"
            />
          </button>
          <span
            v-else
            class="cabecera__cifra-valor--vacio"
          >{{ t('support.ficha.sinOrden') }}</span>
        </dd>
        <dd
          v-if="apoyoOrden"
          class="cabecera__cifra-apoyo as-num"
        >
          {{ apoyoOrden }}
        </dd>
      </div>
    </dl>

    <AccountMapDialog v-model:abierto="dialogos.mapa" />
    <AddWorkOrderDialog
      v-model:abierto="dialogos.orden"
      @guardado="alCrearOrden"
    />
    <WorkOrderDetailDialog
      v-model:abierto="dialogos.ultimaOrden"
      :orden="ultimaOrden"
      :total="totalOrdenes"
      @ver-todas="irAPestana(4)"
    />
    <AgreementDetails
      v-model:abierto="dialogos.convenio"
      :pagos="convenioActivo?.details ?? []"
      :convenio="convenioActivo ?? { ref: contrato.ref_agreement }"
      enlace-lista
      @ver-todos="irAPestana(5)"
    />
    <AccountBalanceDialog v-model:abierto="dialogos.saldo" />
    <AddChargeDialog
      v-model:abierto="dialogos.cargo"
      @guardado="recargar"
    />
    <AddNoteDialog v-model:abierto="dialogos.nota" />
  </VCard>
</template>

<style scoped>
.cabecera {
  padding-block: var(--as-sp-4);
  padding-inline: var(--as-sp-5);
}

.cabecera__cuerpo {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--as-sp-5);
}

.cabecera__identidad {
  flex: 1 1 var(--as-panel-md);
  min-inline-size: 0;
}

.cabecera__cuenta {
  font-size: var(--as-fs-2xl);
  font-weight: var(--as-peso-semi);
  line-height: 1.2;
}

.cabecera__titular {
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-medio);
  line-height: 1.4;
}

.cabecera__icono {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block-start: 2px;
}

/* Ubicación: etiqueta en negrita, valor en gris, con icono */
.cabecera__meta {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-1);
  list-style: none;
  margin-block: var(--as-sp-3) 0;
  padding-inline-start: 0;
}

.cabecera__meta-fila {
  display: flex;
  align-items: flex-start;
  gap: var(--as-sp-2);
  line-height: 1.45;
}

.cabecera__meta-etiqueta {
  flex-shrink: 0;
  font-weight: var(--as-peso-semi);
}

.cabecera__meta-valor {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  overflow-wrap: break-word;
}

.cabecera__acciones {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--as-sp-2);
  max-inline-size: 600px;
}

/* Cifras clave: franja compacta bajo la identidad */
.cabecera__cifras {
  display: flex;
  flex-wrap: wrap;
  border-block-start: var(--as-borde);
  gap: var(--as-sp-3) var(--as-sp-8);
  margin-block: var(--as-sp-4) 0;
  padding-block-start: var(--as-sp-3);
}

.cabecera__cifra {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-inline-size: 140px;
}

.cabecera__cifra-etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  line-height: 1.3;
}

.cabecera__cifra-valor {
  font-size: var(--as-fs-xl);
  font-weight: var(--as-peso-semi);
  line-height: 1.3;
  margin-block-end: 0;
}

.cabecera__cifra-apoyo {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-xs);
  line-height: 1.4;
  margin-block-end: 0;
}

/* Cifra con detalle: se lee como dato y se comporta como enlace */
.cabecera__enlace {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font: inherit;
  gap: 2px;
}

.cabecera__enlace:hover,
.cabecera__enlace:focus-visible {
  text-decoration: underline;
}

.cabecera__cifra--alerta .cabecera__cifra-valor {
  color: rgb(var(--v-theme-error));
}

.cabecera__cifra-valor--vacio {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-base);
  font-weight: var(--as-peso-normal);
  line-height: 1.6;
}
</style>
