<script setup lang="ts">
import { useAbility } from '@casl/vue'
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Account } from '../types/Contract'
import AccountBalanceDialog from './dialog/AccountBalanceDialog.vue'
import AccountMapDialog from './dialog/AccountMapDialog.vue'
import AddChargeDialog from './dialog/AddChargeDialog.vue'
import AddNoteDialog from './dialog/AddNoteDialog.vue'
import AddWorkOrderDialog from './dialog/AddWorkOrderDialog.vue'
import FiscalDataDialog from './dialog/FiscalDataDialog.vue'
import { useAppManager } from '@/composables/useAppManager'
import DocumentosDialogo from '@/modules/reportes/components/documentos/DocumentosDialogo.vue'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { colorEstadoContrato } from '@/utils/estados'
import { aNumero, entero, fecha, moneda, texto } from '@/utils/formato'

/*
 * Información general del contrato. Jerarquía: identidad (cuenta, estado, titular, ubicación con etiqueta en negrita e
 * icono) → acciones (una sola primaria) → cifras clave en una franja compacta → tres tarjetas de datos con una fila por
 * dato (icono, etiqueta en gris, valor en oscuro). Los diálogos propios van sobre AsDialogo; el de documentos es del
 * módulo de reportes y se abre con el gestor global hasta que ese módulo migre.
 */
interface Dato {
  etiqueta: string
  valor: string
  icono: string
  num?: boolean
}

const { t } = useI18n()
const ability = useAbility()
const store = useContractStore()
const { openDialog } = useAppManager()

const contrato = computed<Account | null>(() => store.item)
const dialogos = reactive({ mapa: false, orden: false, saldo: false, cargo: false, nota: false, fiscales: false })
const puedeDocumentos = computed(() => ability.can('generate', 'documentos'))

/** Ubicación administrativa bajo la dirección: etiqueta en negrita y valor, con icono, como en la ficha anterior. */
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

const datosGenerales = computed<Dato[]>(() => {
  const c = contrato.value

  return [
    { icono: 'tabler-droplet', etiqueta: t('support.ficha.tipoContrato'), valor: texto(c?.code_type_contrat) },
    { icono: 'tabler-calendar', etiqueta: t('support.ficha.fechaContrato'), valor: fecha(c?.date_created), num: true },
    { icono: 'tabler-activity', etiqueta: t('support.ficha.estadoContrato'), valor: texto(c?.status) },
    { icono: 'tabler-hash', etiqueta: t('support.ficha.medidor'), valor: texto(c?.measurer), num: true },
    { icono: 'tabler-tag', etiqueta: t('support.ficha.tarifa'), valor: texto(c?.rate_type) },
    { icono: 'tabler-bookmark', etiqueta: t('support.ficha.actividad'), valor: texto(c?.business_activity) },
    { icono: 'tabler-percentage', etiqueta: t('support.ficha.pensionado'), valor: texto(c?.pensionary) },
    { icono: 'tabler-clock', etiqueta: t('support.ficha.vigenciaPensionado'), valor: fecha(c?.due_date_pensioner), num: true },
    { icono: 'tabler-users', etiqueta: t('support.ficha.discapacitado'), valor: texto(c?.handicapped) },
    { icono: 'tabler-clock', etiqueta: t('support.ficha.vigenciaDiscapacitado'), valor: fecha(c?.due_date_handicapped), num: true },
    ...(c?.lps && c.lps.total > 0 ? [{ icono: 'tabler-droplets', etiqueta: t('support.ficha.lps'), valor: `${entero(c.lps.total)} · ${texto(c.lps.lps_contratados)}`, num: true }] : []),
  ]
})

const servicio = computed<Dato[]>(() => [
  { icono: 'tabler-ruler-measure', etiqueta: t('support.ficha.metrica'), valor: texto(contrato.value?.type_charge) },
  { icono: 'tabler-tool', etiqueta: t('support.ficha.servicios'), valor: texto(contrato.value?.type_services) },
])

const fiscales = computed<Dato[]>(() => {
  const s = contrato.value?.societe

  return [
    { icono: 'tabler-building', etiqueta: t('support.ficha.razonSocial'), valor: texto(s?.sat_cname) },
    { icono: 'tabler-id', etiqueta: t('support.ficha.rfc'), valor: texto(s?.sat_taxid), num: true },
    { icono: 'tabler-mailbox', etiqueta: t('support.ficha.codigoPostal'), valor: texto(s?.sat_zip), num: true },
    { icono: 'tabler-file-certificate', etiqueta: t('support.ficha.regimen'), valor: texto(s?.fiscal_regime) },
    { icono: 'tabler-file-invoice', etiqueta: t('support.ficha.usoCfdi'), valor: texto(s?.usecfdi) },
    { icono: 'tabler-mail', etiqueta: t('support.ficha.correo'), valor: texto(s?.emails) },
    { icono: 'tabler-phone', etiqueta: t('support.ficha.telefono'), valor: texto(s?.phone), num: true },
  ]
})

const ultimasLecturas = computed(() => (contrato.value?.readings?.rows ?? []).slice(0, 3))

function abrirDocumentos() {
  openDialog(DocumentosDialogo, { contrato: String(contrato.value?.account ?? ''), nombre: contrato.value?.nameuser ?? undefined }, { width: '1100px' })
}

async function recargar() {
  if (store.item?.account)
    await store.getContract(store.item.account)
}
</script>

<template>
  <div
    v-if="contrato"
    class="ficha"
  >
    <!-- Identidad, acciones y cifras clave -->
    <VCard
      variant="flat"
      class="as-tarjeta ficha__tarjeta"
    >
      <div class="ficha__cabecera">
        <div class="ficha__identidad">
          <div class="as-sobrelinea">
            {{ t('support.ficha.cuenta') }}
          </div>
          <div class="d-flex align-center flex-wrap gap-2">
            <span class="ficha__cuenta as-num">{{ contrato.account }}</span>
            <VChip
              size="small"
              label
              variant="tonal"
              :color="colorEstadoContrato(contrato.status)"
            >
              {{ contrato.status }}
            </VChip>
          </div>
          <div class="ficha__titular">
            {{ contrato.nameuser }}
          </div>

          <ul class="ficha__meta">
            <li
              v-for="d in ubicacion"
              :key="d.etiqueta"
              class="ficha__meta-fila"
            >
              <VIcon
                :icon="d.icono"
                size="16"
                class="ficha__icono"
              />
              <span class="ficha__meta-etiqueta">{{ d.etiqueta }}:</span>
              <span
                class="ficha__meta-valor"
                :class="{ 'as-num': d.num }"
              >{{ d.valor }}</span>
            </li>
          </ul>
        </div>

        <div
          class="ficha__acciones"
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

      <dl class="ficha__cifras">
        <div
          class="ficha__cifra"
          :class="{ 'ficha__cifra--alerta': adeuda }"
        >
          <dt class="ficha__cifra-etiqueta">
            {{ t('support.ficha.saldoVencido') }}
          </dt>
          <dd class="ficha__cifra-valor as-num">
            {{ moneda(contrato.debt) }}
          </dd>
        </div>
        <div class="ficha__cifra">
          <dt class="ficha__cifra-etiqueta">
            {{ t('support.ficha.saldoFavor') }}
          </dt>
          <dd class="ficha__cifra-valor as-num">
            {{ moneda(contrato.positive_balance) }}
          </dd>
        </div>
        <div
          class="ficha__cifra"
          :class="{ 'ficha__cifra--alerta': mesesAdeudo > 0 }"
        >
          <dt class="ficha__cifra-etiqueta">
            {{ t('support.ficha.mesesAdeudo') }}
          </dt>
          <dd class="ficha__cifra-valor as-num">
            {{ entero(mesesAdeudo) }}
          </dd>
        </div>
        <div class="ficha__cifra">
          <dt class="ficha__cifra-etiqueta">
            {{ t('support.ficha.convenioActivo') }}
          </dt>
          <dd
            class="ficha__cifra-valor as-num"
            :class="{ 'ficha__cifra-valor--vacio': !contrato.ref_agreement }"
          >
            {{ contrato.ref_agreement || t('support.ficha.sinConvenio') }}
          </dd>
        </div>
        <div class="ficha__cifra">
          <dt class="ficha__cifra-etiqueta">
            {{ t('support.ficha.ordenTrabajo') }}
          </dt>
          <dd
            class="ficha__cifra-valor as-num"
            :class="{ 'ficha__cifra-valor--vacio': !contrato.ref }"
          >
            {{ contrato.ref || t('support.ficha.sinOrden') }}
          </dd>
        </div>
      </dl>
    </VCard>

    <!-- Datos generales, servicio y consumo, fiscales -->
    <VRow
      dense
      class="mt-2"
    >
      <VCol
        cols="12"
        lg="4"
      >
        <VCard
          variant="flat"
          class="as-tarjeta ficha__tarjeta h-100"
        >
          <h2 class="ficha__titulo">
            {{ t('support.ficha.datosGenerales') }}
          </h2>
          <dl class="ficha__filas">
            <div
              v-for="d in datosGenerales"
              :key="d.etiqueta"
              class="ficha__fila"
            >
              <VIcon
                :icon="d.icono"
                size="16"
                class="ficha__icono"
              />
              <dt class="ficha__fila-etiqueta">
                {{ d.etiqueta }}
              </dt>
              <dd
                class="ficha__fila-valor"
                :class="{ 'as-num': d.num }"
              >
                {{ d.valor }}
              </dd>
            </div>
          </dl>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="6"
        lg="4"
      >
        <VCard
          variant="flat"
          class="as-tarjeta ficha__tarjeta h-100"
        >
          <h2 class="ficha__titulo">
            {{ t('support.ficha.resumenServicio') }}
          </h2>
          <dl class="ficha__filas ficha__filas--apiladas">
            <div
              v-for="d in servicio"
              :key="d.etiqueta"
              class="ficha__fila"
            >
              <VIcon
                :icon="d.icono"
                size="16"
                class="ficha__icono"
              />
              <dt class="ficha__fila-etiqueta">
                {{ d.etiqueta }}
              </dt>
              <dd class="ficha__fila-valor">
                {{ d.valor }}
              </dd>
            </div>
          </dl>

          <h2 class="ficha__titulo mt-4">
            {{ t('support.ficha.consumo') }}
          </h2>
          <dl class="ficha__filas ficha__filas--apiladas">
            <div class="ficha__fila">
              <VIcon
                icon="tabler-droplet"
                size="16"
                class="ficha__icono"
              />
              <dt class="ficha__fila-etiqueta">
                {{ t('support.ficha.consumoPromedio') }}
              </dt>
              <dd class="ficha__fila-valor as-num">
                {{ contrato.average_consumption ? `${texto(contrato.average_consumption)} m³` : '—' }}
              </dd>
            </div>
            <div
              v-for="l in ultimasLecturas"
              :key="l.Periodo"
              class="ficha__fila"
            >
              <VIcon
                icon="tabler-gauge"
                size="16"
                class="ficha__icono"
              />
              <dt class="ficha__fila-etiqueta">
                {{ l.Periodo }}
              </dt>
              <dd class="ficha__fila-valor as-num">
                {{ entero(l.Consumo) }} m³
              </dd>
            </div>
          </dl>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        md="6"
        lg="4"
      >
        <VCard
          variant="flat"
          class="as-tarjeta ficha__tarjeta h-100"
        >
          <h2 class="ficha__titulo">
            <span>{{ t('support.ficha.datosFiscales') }}</span>
            <AsBtnTerciario
              size="small"
              prepend-icon="tabler-edit"
              @click="dialogos.fiscales = true"
            >
              {{ t('support.ficha.editarFiscales') }}
            </AsBtnTerciario>
          </h2>
          <dl class="ficha__filas">
            <div
              v-for="d in fiscales"
              :key="d.etiqueta"
              class="ficha__fila"
            >
              <VIcon
                :icon="d.icono"
                size="16"
                class="ficha__icono"
              />
              <dt class="ficha__fila-etiqueta">
                {{ d.etiqueta }}
              </dt>
              <dd
                class="ficha__fila-valor"
                :class="{ 'as-num': d.num }"
              >
                {{ d.valor }}
              </dd>
            </div>
          </dl>
        </VCard>
      </VCol>
    </VRow>

    <AccountMapDialog v-model:abierto="dialogos.mapa" />
    <AddWorkOrderDialog v-model:abierto="dialogos.orden" />
    <AccountBalanceDialog v-model:abierto="dialogos.saldo" />
    <AddChargeDialog
      v-model:abierto="dialogos.cargo"
      @guardado="recargar"
    />
    <AddNoteDialog v-model:abierto="dialogos.nota" />
    <FiscalDataDialog
      v-model:abierto="dialogos.fiscales"
      @guardado="recargar"
    />
  </div>
</template>

<style scoped>
.ficha {
  padding: var(--as-sp-4);
}

.ficha__tarjeta {
  padding-block: var(--as-sp-4);
  padding-inline: var(--as-sp-5);
}

.ficha__cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--as-sp-5);
}

.ficha__identidad {
  flex: 1 1 var(--as-panel-md);
  min-inline-size: 0;
}

.ficha__cuenta {
  font-size: var(--as-fs-2xl);
  font-weight: var(--as-peso-semi);
  line-height: 1.2;
}

.ficha__titular {
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-medio);
  line-height: 1.4;
}

.ficha__icono {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block-start: 2px;
}

/* Ubicación: etiqueta en negrita, valor en gris, con icono (lo que ya se leía bien) */
.ficha__meta {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-1);
  list-style: none;
  margin-block: var(--as-sp-3) 0;
  padding-inline-start: 0;
}

.ficha__meta-fila {
  display: flex;
  align-items: flex-start;
  gap: var(--as-sp-2);
  line-height: 1.45;
}

.ficha__meta-etiqueta {
  flex-shrink: 0;
  font-weight: var(--as-peso-semi);
}

.ficha__meta-valor {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  overflow-wrap: break-word;
}

.ficha__acciones {
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--as-sp-2);
  max-inline-size: 600px;
}

/* Cifras clave: franja compacta bajo la identidad */
.ficha__cifras {
  display: flex;
  flex-wrap: wrap;
  border-block-start: var(--as-borde);
  gap: var(--as-sp-3) var(--as-sp-8);
  margin-block: var(--as-sp-4) 0;
  padding-block-start: var(--as-sp-3);
}

.ficha__cifra {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-inline-size: 140px;
}

.ficha__cifra-etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  line-height: 1.3;
}

.ficha__cifra-valor {
  font-size: var(--as-fs-xl);
  font-weight: var(--as-peso-semi);
  line-height: 1.3;
  margin-block-end: 0;
}

.ficha__cifra--alerta .ficha__cifra-valor {
  color: rgb(var(--v-theme-error));
}

.ficha__cifra-valor--vacio {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-base);
  font-weight: var(--as-peso-normal);
  line-height: 1.6;
}

/* Tarjetas de datos: título alineado y una fila por dato */
.ficha__titulo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--as-fs-md);
  font-weight: var(--as-peso-semi);
  gap: var(--as-sp-2);
  line-height: 1.4;
  margin-block-end: var(--as-sp-2);
  min-block-size: 36px;
}

.ficha__filas {
  display: flex;
  flex-direction: column;
  margin-block-end: 0;
}

.ficha__fila {
  display: grid;
  align-items: start;
  border-block-end: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6));
  gap: var(--as-sp-2);
  grid-template-columns: 20px minmax(120px, 42%) 1fr;
  padding-block: var(--as-sp-2);
}

.ficha__fila:last-child {
  border-block-end: 0;
}

.ficha__fila-etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  line-height: 1.5;
}

.ficha__fila-etiqueta,
.ficha__fila-valor {
  min-inline-size: 0;
}

.ficha__fila-valor {
  font-weight: var(--as-peso-medio);
  line-height: 1.5;
  margin-block-end: 0;
  overflow-wrap: anywhere;
}

/* Tarjeta angosta: la etiqueta arriba y el valor debajo, a todo el ancho */
.ficha__filas--apiladas .ficha__fila {
  grid-template-columns: 20px 1fr;
  row-gap: 0;
}

.ficha__filas--apiladas .ficha__fila-valor {
  grid-column: 2;
}
</style>
