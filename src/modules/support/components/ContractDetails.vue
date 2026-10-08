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
import { entero, fecha, moneda, texto } from '@/utils/formato'

/*
 * Información general del contrato: identidad y ubicación, acciones (cargo, nota, orden, estado de cuenta, documentos,
 * mapa), indicadores de saldo y los datos generales, del servicio y fiscales. Los diálogos propios van sobre AsDialogo;
 * el de documentos es del módulo de reportes y se abre con el gestor de diálogos hasta que ese módulo migre.
 */
interface Dato {
  etiqueta: string
  valor: string
  num?: boolean
}

const { t } = useI18n()
const ability = useAbility()
const store = useContractStore()
const { openDialog } = useAppManager()

const contrato = computed<Account | null>(() => store.item)
const dialogos = reactive({ mapa: false, orden: false, saldo: false, cargo: false, nota: false, fiscales: false })
const puedeDocumentos = computed(() => ability.can('generate', 'documentos'))

const ubicacion = computed<Dato[]>(() => {
  const c = contrato.value

  return [
    { etiqueta: t('support.ficha.comunidad'), valor: texto(c?.community ?? c?.source_entity) },
    { etiqueta: t('support.ficha.sistema'), valor: texto(c?.c_system) },
    { etiqueta: t('support.ficha.sector'), valor: texto(c?.sector) },
    ...(c?.route ? [{ etiqueta: t('support.ficha.ruta'), valor: c.route }] : []),
    ...(c?.clave_loc ? [{ etiqueta: t('support.ficha.claveLoc'), valor: c.clave_loc, num: true }] : []),
  ]
})

const datosGenerales = computed<Dato[]>(() => {
  const c = contrato.value

  return [
    { etiqueta: t('support.ficha.tipoContrato'), valor: texto(c?.code_type_contrat) },
    { etiqueta: t('support.ficha.fechaContrato'), valor: fecha(c?.date_created), num: true },
    { etiqueta: t('support.ficha.estadoContrato'), valor: texto(c?.status) },
    { etiqueta: t('support.ficha.medidor'), valor: texto(c?.measurer), num: true },
    { etiqueta: t('support.ficha.tarifa'), valor: texto(c?.rate_type) },
    { etiqueta: t('support.ficha.actividad'), valor: texto(c?.business_activity) },
    { etiqueta: t('support.ficha.pensionado'), valor: texto(c?.pensionary) },
    { etiqueta: t('support.ficha.vigenciaPensionado'), valor: fecha(c?.due_date_pensioner), num: true },
    { etiqueta: t('support.ficha.discapacitado'), valor: texto(c?.handicapped) },
    { etiqueta: t('support.ficha.vigenciaDiscapacitado'), valor: fecha(c?.due_date_handicapped), num: true },
    ...(c?.lps && c.lps.total > 0 ? [{ etiqueta: t('support.ficha.lps'), valor: `${entero(c.lps.total)} · ${texto(c.lps.lps_contratados)}`, num: true }] : []),
  ]
})

const servicio = computed<Dato[]>(() => [
  { etiqueta: t('support.ficha.metrica'), valor: texto(contrato.value?.type_charge) },
  { etiqueta: t('support.ficha.servicios'), valor: texto(contrato.value?.type_services) },
])

const fiscales = computed<Dato[]>(() => {
  const s = contrato.value?.societe

  return [
    { etiqueta: t('support.ficha.razonSocial'), valor: texto(s?.sat_cname) },
    { etiqueta: t('support.ficha.rfc'), valor: texto(s?.sat_taxid), num: true },
    { etiqueta: t('support.ficha.codigoPostal'), valor: texto(s?.sat_zip), num: true },
    { etiqueta: t('support.ficha.regimen'), valor: texto(s?.fiscal_regime) },
    { etiqueta: t('support.ficha.usoCfdi'), valor: texto(s?.usecfdi) },
    { etiqueta: t('support.ficha.correo'), valor: texto(s?.emails) },
    { etiqueta: t('support.ficha.telefono'), valor: texto(s?.phone), num: true },
  ]
})

const ultimasLecturas = computed(() => (contrato.value?.readings?.rows ?? []).slice(0, 3))
const mesesAdeudo = computed(() => Number(contrato.value?.months_debt) || 0)

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
    <header class="ficha__cabecera">
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
        <div class="ficha__direccion d-flex align-start gap-1 mt-2">
          <VIcon
            icon="tabler-map-pin"
            size="16"
            class="text-medium-emphasis mt-1"
          />
          <span>{{ texto(contrato.address) }}</span>
        </div>
        <dl class="as-datos ficha__ubicacion mt-3 mb-0">
          <div
            v-for="d in ubicacion"
            :key="d.etiqueta"
            class="as-dato"
          >
            <dt class="as-etiqueta">
              {{ d.etiqueta }}
            </dt>
            <dd
              class="as-valor mb-0"
              :class="{ 'as-num': d.num }"
            >
              {{ d.valor }}
            </dd>
          </div>
        </dl>
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
        <AsBtnTerciario
          prepend-icon="tabler-map-pin"
          @click="dialogos.mapa = true"
        >
          {{ t('support.ficha.ubicacion') }}
        </AsBtnTerciario>
      </div>
    </header>

    <VRow
      dense
      class="mt-1"
    >
      <VCol
        cols="6"
        md="4"
        lg
      >
        <AsIndicador
          :etiqueta="t('support.ficha.saldoVencido')"
          :valor="moneda(contrato.debt)"
          icono="tabler-alert-circle"
          :estado="mesesAdeudo > 0 ? 'alerta' : 'normal'"
        />
      </VCol>
      <VCol
        cols="6"
        md="4"
        lg
      >
        <AsIndicador
          :etiqueta="t('support.ficha.saldoFavor')"
          :valor="moneda(contrato.positive_balance)"
          icono="tabler-coin"
        />
      </VCol>
      <VCol
        cols="6"
        md="4"
        lg
      >
        <AsIndicador
          :etiqueta="t('support.ficha.mesesAdeudo')"
          :valor="mesesAdeudo"
          formato="entero"
          icono="tabler-calendar-due"
          :estado="mesesAdeudo > 0 ? 'advertencia' : 'normal'"
        />
      </VCol>
      <VCol
        cols="6"
        md="6"
        lg
      >
        <AsIndicador
          :etiqueta="t('support.ficha.convenioActivo')"
          :valor="contrato.ref_agreement || null"
          :apoyo="contrato.ref_agreement ? undefined : t('support.ficha.sinConvenio')"
          icono="tabler-file-like"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
        lg
      >
        <AsIndicador
          :etiqueta="t('support.ficha.ordenTrabajo')"
          :valor="contrato.ref || null"
          :apoyo="contrato.ref ? undefined : t('support.ficha.sinOrden')"
          icono="tabler-clipboard"
        />
      </VCol>
    </VRow>

    <VRow
      dense
      class="mt-1"
    >
      <VCol
        cols="12"
        lg="5"
      >
        <VCard
          variant="flat"
          class="as-tarjeta ficha__tarjeta h-100"
        >
          <h2 class="as-seccion">
            {{ t('support.ficha.datosGenerales') }}
          </h2>
          <dl class="as-datos mb-0">
            <div
              v-for="d in datosGenerales"
              :key="d.etiqueta"
              class="as-dato"
            >
              <dt class="as-etiqueta">
                {{ d.etiqueta }}
              </dt>
              <dd
                class="as-valor mb-0"
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
        lg="3"
      >
        <VCard
          variant="flat"
          class="as-tarjeta ficha__tarjeta h-100"
        >
          <h2 class="as-seccion">
            {{ t('support.ficha.resumenServicio') }}
          </h2>
          <dl class="as-datos mb-0">
            <div
              v-for="d in servicio"
              :key="d.etiqueta"
              class="as-dato"
            >
              <dt class="as-etiqueta">
                {{ d.etiqueta }}
              </dt>
              <dd class="as-valor mb-0">
                {{ d.valor }}
              </dd>
            </div>
          </dl>

          <h2 class="as-seccion">
            {{ t('support.ficha.consumo') }}
          </h2>
          <dl class="as-datos mb-0">
            <div class="as-dato">
              <dt class="as-etiqueta">
                {{ t('support.ficha.consumoPromedio') }}
              </dt>
              <dd class="as-valor as-num mb-0">
                {{ contrato.average_consumption ? `${texto(contrato.average_consumption)} m³` : '—' }}
              </dd>
            </div>
            <div
              v-if="ultimasLecturas.length"
              class="as-dato"
            >
              <dt class="as-etiqueta">
                {{ t('support.ficha.ultimasLecturas') }}
              </dt>
              <dd class="mb-0">
                <ul class="ficha__lecturas">
                  <li
                    v-for="l in ultimasLecturas"
                    :key="l.Periodo"
                    class="d-flex justify-space-between gap-2"
                  >
                    <span class="as-secundario">{{ l.Periodo }}</span>
                    <span class="as-valor as-num">{{ entero(l.Consumo) }} m³</span>
                  </li>
                </ul>
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
          <h2 class="as-seccion">
            <span>{{ t('support.ficha.datosFiscales') }}</span>
            <AsBtnTerciario
              size="small"
              prepend-icon="tabler-edit"
              @click="dialogos.fiscales = true"
            >
              {{ t('support.ficha.editarFiscales') }}
            </AsBtnTerciario>
          </h2>
          <dl class="as-datos mb-0">
            <div
              v-for="d in fiscales"
              :key="d.etiqueta"
              class="as-dato"
            >
              <dt class="as-etiqueta">
                {{ d.etiqueta }}
              </dt>
              <dd
                class="as-valor mb-0"
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

.ficha__cabecera {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--as-sp-4);
  margin-block-end: var(--as-sp-3);
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

.ficha__ubicacion {
  grid-template-columns: repeat(auto-fit, minmax(140px, max-content));
}

.ficha__acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--as-sp-2);
}

.ficha__tarjeta {
  padding-block: var(--as-sp-3) var(--as-sp-4);
  padding-inline: var(--as-sp-4);
}

.ficha__lecturas {
  display: flex;
  flex-direction: column;
  gap: var(--as-sp-1);
  list-style: none;
  padding-inline-start: 0;
}
</style>
