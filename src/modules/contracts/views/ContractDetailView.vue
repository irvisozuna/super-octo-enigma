<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ContractsApi } from '../services/contractsApi'
import type { ContractDetail } from '../types/Contract'

const route = useRoute()

const loading = ref(false)
const contract = ref<ContractDetail | null>(null)

const loadData = async () => {
  const id = route.params.id as string
  if (!id)
    return

  loading.value = true
  try {
    contract.value = await ContractsApi.getContractDetails(id)
  }
  catch (error) {
    console.error('Error loading contract data:', error)
  }
  finally {
    loading.value = false
  }
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(num || 0)
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div
    v-if="loading"
    class="d-flex justify-center align-center h-100"
  >
    <VProgressCircular
      indeterminate
      color="primary"
      size="64"
    />
  </div>

  <div
    v-else-if="contract"
    class="contract-detail-view"
  >
    <!-- Header Section -->
    <VCard class="mb-6 detail-card">
      <VCardText>
        <!-- Row 1: ID, Account, User, RFC, Entity, Actions, Status -->
        <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
          <div class="d-flex align-center gap-4 flex-wrap">
            <div>
              <div class="field-label">
                ID Contrato
              </div>
              <div class="text-h6 font-weight-bold text-medium-emphasis">
                {{ contract.contratid }}
              </div>
            </div>

            <VDivider
              vertical
              class="mx-2"
              style="height: 32px"
            />

            <div>
              <div class="field-label">
                Cuenta
              </div>
              <VChip
                color="primary"
                variant="flat"
                size="default"
                class="font-weight-bold"
              >
                {{ contract.account }}
              </VChip>
            </div>

            <VDivider
              vertical
              class="mx-2"
              style="height: 32px"
            />

            <div>
              <div class="field-label">
                Usuario
              </div>
              <div class="text-h6 font-weight-bold text-uppercase text-medium-emphasis">
                {{ contract.nameuser }}
              </div>
            </div>

            <VDivider
              vertical
              class="mx-2"
              style="height: 32px"
            />

            <div>
              <div class="field-label">
                RFC
              </div>
              <div class="text-h6 font-weight-bold text-uppercase text-medium-emphasis">
                {{ contract.rfc || 'N/A' }}
              </div>
            </div>

            <VDivider
              vertical
              class="mx-2"
              style="height: 32px"
            />

            <div>
              <div class="field-label">
                Entidad
              </div>
              <div class="text-h6 font-weight-bold text-uppercase text-medium-emphasis">
                {{ contract.entity || 'N/A' }}
              </div>
            </div>
          </div>

          <div class="d-flex align-center gap-3">
            <VChip
              :color="contract.status === 'ACTIVO' ? 'success' : 'error'"
              variant="tonal"
              size="default"
              class="font-weight-bold"
            >
              {{ contract.status }}
            </VChip>

            <VMenu>
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  color="primary"
                  variant="tonal"
                  append-icon="tabler-chevron-down"
                >
                  Acciones
                </VBtn>
              </template>
              <VList density="compact">
                <VListItem
                  value="sync"
                  @click="console.log('Sync')"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-refresh"
                      color="info"
                    />
                  </template>
                  <VListItemTitle>Sincronizar</VListItemTitle>
                </VListItem>
                <VListItem
                  value="edit"
                  @click="console.log('Edit')"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-pencil"
                      color="warning"
                    />
                  </template>
                  <VListItemTitle>Editar</VListItemTitle>
                </VListItem>
                <VListItem
                  value="delete"
                  @click="console.log('Delete')"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-trash"
                      color="error"
                    />
                  </template>
                  <VListItemTitle class="text-error">
                    Eliminar
                  </VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </div>
        </div>

        <VDivider class="mb-6" />

        <!-- Row 2: Address | System | Sector -->
        <VRow>
          <VCol
            cols="12"
            md="6"
            class="pb-2"
          >
            <div>
              <div class="field-label">
                Dirección
              </div>
              <div class="text-body-1">
                {{ contract.address }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Sistema
              </div>
              <div class="font-weight-medium">
                {{ contract.systems }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Sector
              </div>
              <div class="font-weight-medium">
                {{ contract.sector }}
              </div>
            </div>
          </VCol>
        </VRow>

        <!-- Row 3: Route | Trunk | Cadastral | Loc | Sequence -->
        <VRow class="mt-2">
          <VCol
            cols="12"
            md="2"
          >
            <div>
              <div class="field-label">
                Ruta
              </div>
              <div class="font-weight-medium">
                {{ contract.route || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <div>
              <div class="field-label">
                Troncal
              </div>
              <div class="font-weight-medium">
                {{ contract.trunks || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Clave Catastral
              </div>
              <div class="font-weight-medium">
                {{ contract.cadastral_number || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="2"
          >
            <div>
              <div class="field-label">
                Clave Loc
              </div>
              <div class="font-weight-medium">
                {{ contract.clave_loc || 'N/A' }}
              </div>
            </div>
          </VCol>

          <VCol
            cols="12"
            md="3"
          >
            <div>
              <div class="field-label">
                Secuencia
              </div>
              <div class="font-weight-medium">
                {{ contract.sequence || 'N/A' }}
              </div>
            </div>
          </VCol>
        </vrow>
      </vcardtext>
    </vcard>

    <VRow>
      <!-- Columna 1: Resumen Financiero (20% exacto) -->
      <VCol
        cols="12"
        class="col-custom-20"
      >
        <VCard class="h-100 detail-card">
          <VCardTitle class="text-subtitle-2 font-weight-bold pb-2 pt-3 px-4 text-secondary">
            Resumen Financiero
          </VCardTitle>
          <VDivider />
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Adeudo</span>
                <span class="text-body-2 font-weight-bold text-error">{{ formatCurrency(contract.lecture?.debt) }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Convenio</span>
                <span class="text-body-2 font-weight-bold text-error">{{ formatCurrency(contract.lecture?.amount_letters) }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Recargos</span>
                <span class="text-body-2 font-weight-bold text-error">{{ formatCurrency(contract.recharge) }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Ajuste Redondeo</span>
                <span class="text-body-2 font-weight-bold text-error">{{ formatCurrency(contract.round_charge) }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Meses Vencidos</span>
                <span class="text-body-2 font-weight-bold text-warning">{{ contract.lecture?.debt_months || '0' }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Saldo a Favor</span>
                <span class="text-body-2 font-weight-bold text-success">{{ formatCurrency(contract.positive_balance) }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Columna 2: Datos Generales (28% exacto) -->
      <VCol
        cols="12"
        class="col-custom-28"
      >
        <VCard class="h-100 detail-card">
          <VCardTitle class="text-subtitle-2 font-weight-bold pb-2 pt-3 px-4 text-secondary">
            Datos Generales
          </VCardTitle>
          <VDivider />
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Tipo de Contrato</span>
                <span class="text-body-2 font-weight-bold">{{ contract.type_contrat }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Tarifa</span>
                <span class="text-body-2 font-weight-bold">{{ contract.rate_type }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Tipo de Cobro</span>
                <span class="text-body-2 font-weight-bold">{{ contract.type_charge }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Diámetro de Toma</span>
                <span class="text-body-2 font-weight-bold">{{ contract.socket_diameter }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Actividad Comercial</span>
                <span class="text-body-2 font-weight-bold">{{ contract.business_activity || 'NO IDENTIFICADO' }}</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Columna 3: Datos de Lectura (28% exacto) -->
      <VCol
        cols="12"
        class="col-custom-28"
      >
        <VCard class="h-100 detail-card">
          <VCardTitle class="text-subtitle-2 font-weight-bold pb-2 pt-3 px-4 text-secondary">
            Datos de Lectura
          </VCardTitle>
          <VDivider />
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Medidor</span>
                <span class="text-body-2 font-weight-bold">{{ contract.measurer }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Última Lectura</span>
                <span class="text-body-2 font-weight-bold">{{ contract.lecture?.last_read || '0' }} m³</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Fecha Lectura</span>
                <span class="text-body-2 font-weight-bold text-uppercase">{{ contract.lecture?.last_date_read || 'N/A' }}</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Consumo Promedio</span>
                <span class="text-body-2 font-weight-bold">{{ contract.lecture?.average_consumption || '0' }} m³</span>
              </div>
              <VDivider style="border-style: dashed;" />
              <div class="d-flex flex-column gap-1">
                <span class="text-caption text-medium-emphasis">Ubicación (Lat, Lon)</span>
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="tabler-map-pin"
                    size="14"
                    color="primary"
                  />
                  <span class="text-caption font-weight-medium">
                    {{ contract.lecture?.last_latitude || '0.00' }}, {{ contract.lecture?.last_longitude || '0.00' }}
                  </span>
                </div>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>

      <!-- Columna 4: Descuentos y Cargos Especiales (24% exacto) -->
      <VCol
        cols="12"
        class="col-custom-24"
      >
        <VCard class="h-100 detail-card">
          <VCardText class="pt-3 px-4 pb-4">
            <div class="d-flex flex-column gap-3">
              <!-- Sección Descuentos -->
              <div class="text-caption font-weight-bold text-secondary mb-1">
                Descuentos
              </div>

              <!-- Pensión -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Pensión</span>
                <span class="text-body-2 font-weight-bold">{{ contract.pensionary === '1' ? 'SÍ' : 'NO' }}</span>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis ps-4">Vencimiento Pensión</span>
                <span class="text-caption font-weight-medium">{{ contract.due_date_pensioner || 'N/A' }}</span>
              </div>

              <VDivider style="border-style: dashed;" />

              <!-- Discapacitado -->
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Discapacitado</span>
                <span class="text-body-2 font-weight-bold">{{ contract.handicapped === '1' ? 'SÍ' : 'NO' }}</span>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis ps-4">Vencimiento Discap.</span>
                <span class="text-caption font-weight-medium">{{ contract.due_date_handicapped || 'N/A' }}</span>
              </div>

              <VDivider class="my-2" />

              <!-- Sección Cargos Especiales -->
              <div class="text-caption font-weight-bold text-secondary mb-1">
                Cargos Especiales
              </div>

              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Bomberos</span>
                <span class="text-body-2 font-weight-bold text-error">{{ formatCurrency(contract.firefighters) }}</span>
              </div>

              <VDivider style="border-style: dashed;" />

              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Cruz Roja</span>
                <span class="text-body-2 font-weight-bold">N/A</span>
              </div>

              <VDivider style="border-style: dashed;" />

              <div class="d-flex justify-space-between align-center">
                <span class="text-caption text-medium-emphasis">Ayuntamiento</span>
                <span class="text-body-2 font-weight-bold">N/A</span>
              </div>
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.contract-detail-view {
  padding-bottom: 2rem;
}

.detail-card {
  border: 1px solid rgba(var(--v-border-color), 0.12) !important;
  box-shadow: 0 2px 12px -2px rgba(var(--v-theme-on-surface), 0.08) !important;
  border-radius: 12px !important;
  background-color: rgb(var(--v-theme-surface));
}

.financial-card {
  border: 1px solid rgba(var(--v-border-color), 0.12);
  border-radius: 12px;
  transition: all 0.2s ease-in-out;
  background-color: rgb(var(--v-theme-surface));
}

.financial-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 18px -4px rgba(var(--v-theme-on-surface), 0.12);
  border-color: rgb(var(--v-theme-primary));
}

.action-placeholder {
  border-radius: 12px;
  height: 100%;
  border: 1px dashed rgba(var(--v-border-color), 0.2);
}

.data-list .v-list-item {
  padding-inline: 0 !important;
  margin-bottom: 8px;
}

.data-list .v-icon {
  opacity: 0.8;
  color: rgb(var(--v-theme-primary));
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--v-theme-secondary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

@media (min-width: 960px) {
  .col-custom-20 {
    flex: 0 0 20%;
    max-width: 20%;
  }
  .col-custom-28 {
    flex: 0 0 28%;
    max-width: 28%;
  }
  .col-custom-24 {
    flex: 0 0 24%;
    max-width: 24%;
  }
}
</style>
