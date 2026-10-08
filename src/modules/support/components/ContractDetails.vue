<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Account } from '../types/Contract'
import FiscalDataDialog from './dialog/FiscalDataDialog.vue'
import { useContractStore } from '@/modules/support/stores/contractStore'
import { entero, fecha, texto } from '@/utils/formato'

/*
 * Pestaña "Información general": tres tarjetas del mismo ancho (datos generales, servicio y consumo, fiscales) con una
 * fila por dato: icono, etiqueta en gris y valor en oscuro. La identidad del contrato, las acciones y las cifras clave
 * viven en ContractHeader, visible en todas las pestañas.
 */
interface Dato {
  etiqueta: string
  valor: string
  icono: string
  num?: boolean
}

const { t } = useI18n()
const store = useContractStore()

const contrato = computed<Account | null>(() => store.item)
const fiscalesAbierto = ref(false)

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
    <VRow dense>
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
              @click="fiscalesAbierto = true"
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

    <FiscalDataDialog
      v-model:abierto="fiscalesAbierto"
      @guardado="recargar"
    />
  </div>
</template>

<style scoped>
.ficha {
  padding: var(--as-sp-4);
}

.ficha__tarjeta {
  padding-block: var(--as-sp-3) var(--as-sp-4);
  padding-inline: var(--as-sp-5);
}

.ficha__icono {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  margin-block-start: 2px;
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

.ficha__fila-etiqueta,
.ficha__fila-valor {
  min-inline-size: 0;
}

.ficha__fila-etiqueta {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
  font-size: var(--as-fs-sm);
  line-height: 1.5;
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
