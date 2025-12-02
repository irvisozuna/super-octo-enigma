<script setup lang="ts">
import { ref, watch } from 'vue'
import { ContractsApi } from '../services/contractsApi'
import type { ContractDebtSummary, ContractDetail } from '../types/Contract'

interface ContractDetailModalProps {
  modelValue: boolean
  contratid: string | null
}

interface ContractDetailModalEmits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<ContractDetailModalProps>()
const emit = defineEmits<ContractDetailModalEmits>()

const loading = ref(false)
const contractDetail = ref<ContractDetail | null>(null)
const debtSummary = ref<ContractDebtSummary | null>(null)
const activeTab = ref('details')

// Cargar datos cuando se abre el modal
watch(() => props.modelValue, async isOpen => {
  if (isOpen && props.contratid)
    await loadContractData()
}, { immediate: true })

const loadContractData = async () => {
  if (!props.contratid)
    return

  loading.value = true
  try {
    const [detail, debt] = await Promise.all([
      ContractsApi.getContractById(props.contratid),
      ContractsApi.getDebtSummary(props.contratid),
    ])

    contractDetail.value = detail
    debtSummary.value = debt
  }
  catch (error) {
    console.error('Error loading contract data:', error)
  }
  finally {
    loading.value = false
  }
}

const closeModal = () => {
  emit('update:modelValue', false)
  activeTab.value = 'details'
  contractDetail.value = null
  debtSummary.value = null
}

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount

  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(num)
}
</script>

<template>
  <VDialog
    :model-value="modelValue"
    max-width="1000"
    @update:model-value="closeModal"
  >
    <VCard class="contract-modal">
      <!-- Header con gradiente -->
      <VCardTitle class="modal-header">
        <div class="d-flex align-center justify-space-between w-100">
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="tabler-file-text"
              size="28"
              color="white"
            />
            <div>
              <div class="text-h5 font-weight-bold">
                Detalle del Contrato
              </div>
              <div
                v-if="contractDetail"
                class="text-caption header-subtitle"
              >
                {{ contractDetail.account }} - {{ contractDetail.nameuser }}
              </div>
            </div>
          </div>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="white"
            size="small"
            @click="closeModal"
          />
        </div>
      </VCardTitle>

      <VDivider />

      <VCardText v-if="loading">
        <div class="d-flex justify-center align-center py-10">
          <VProgressCircular
            indeterminate
            color="primary"
            size="64"
          />
        </div>
      </VCardText>

      <VCardText
        v-else-if="contractDetail && debtSummary"
        class="pa-0"
      >
        <VTabs
          v-model="activeTab"
          bg-color="grey-lighten-4"
          color="primary"
          class="tabs-container"
        >
          <VTab
            value="details"
            class="text-none font-weight-medium"
          >
            <VIcon
              start
              icon="tabler-info-circle"
            />
            Información General
          </VTab>
          <VTab
            value="debt"
            class="text-none font-weight-medium"
          >
            <VIcon
              start
              icon="tabler-currency-dollar"
            />
            Resumen de Adeudo
          </VTab>
        </VTabs>

        <VWindow
          v-model="activeTab"
          class="pa-5"
        >
          <!-- Tab: Información General -->
          <VWindowItem value="details">
            <VRow>
              <!-- Datos del Contrato -->
              <VCol
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  color="primary"
                  class="info-card"
                >
                  <VCardTitle class="section-title">
                    <VIcon
                      start
                      icon="tabler-file-description"
                      size="20"
                    />
                    Datos del Contrato
                  </VCardTitle>
                  <VCardText>
                    <div class="info-grid">
                      <div class="info-row">
                        <span class="info-label">ID Contrato</span>
                        <span class="info-value primary-text">{{ contractDetail.contratid }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Cuenta</span>
                        <span class="info-value primary-text">{{ contractDetail.account }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Cliente</span>
                        <span class="info-value">{{ contractDetail.nameuser }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Tipo</span>
                        <VChip
                          size="small"
                          color="info"
                          variant="flat"
                        >
                          {{ contractDetail.type_contrat }}
                        </VChip>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Estado</span>
                        <VChip
                          size="small"
                          :color="contractDetail.status === 'ACTIVO' ? 'success' : 'error'"
                          variant="flat"
                        >
                          <VIcon
                            start
                            size="16"
                            :icon="contractDetail.status === 'ACTIVO' ? 'tabler-check' : 'tabler-x'"
                          />
                          {{ contractDetail.status }}
                        </VChip>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Ubicación -->
              <VCol
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  color="secondary"
                  class="info-card"
                >
                  <VCardTitle class="section-title">
                    <VIcon
                      start
                      icon="tabler-map-pin"
                      size="20"
                    />
                    Ubicación
                  </VCardTitle>
                  <VCardText>
                    <div class="info-grid">
                      <div class="info-row full-width">
                        <span class="info-label">Dirección</span>
                        <span class="info-value text-wrap">{{ contractDetail.address }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Sistema</span>
                        <span class="info-value secondary-text">{{ contractDetail.systems }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Sector</span>
                        <span class="info-value">{{ contractDetail.sector }}</span>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Información Técnica -->
              <VCol
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  color="info"
                  class="info-card"
                >
                  <VCardTitle class="section-title">
                    <VIcon
                      start
                      icon="tabler-settings"
                      size="20"
                    />
                    Información Técnica
                  </VCardTitle>
                  <VCardText>
                    <div class="info-grid">
                      <div class="info-row">
                        <span class="info-label">Tarifa</span>
                        <span class="info-value">{{ contractDetail.rate_type }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Tipo de Cargo</span>
                        <span class="info-value">{{ contractDetail.type_charge }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Diámetro Toma</span>
                        <VChip
                          size="small"
                          color="info"
                          variant="outlined"
                        >
                          {{ contractDetail.socket_diameter }}
                        </VChip>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Medidor</span>
                        <span class="info-value info-text">{{ contractDetail.measurer }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Actividad</span>
                        <span class="info-value">{{ contractDetail.business_activity }}</span>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Datos Adicionales -->
              <VCol
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  color="warning"
                  class="info-card"
                >
                  <VCardTitle class="section-title">
                    <VIcon
                      start
                      icon="tabler-clipboard-list"
                      size="20"
                    />
                    Datos Adicionales
                  </VCardTitle>
                  <VCardText>
                    <div class="info-grid">
                      <div class="info-row">
                        <span class="info-label">RFC</span>
                        <span class="info-value">{{ contractDetail.rfc || 'N/A' }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Número Catastral</span>
                        <span class="info-value">{{ contractDetail.cadastral_number }}</span>
                      </div>
                      <div class="info-row full-width">
                        <span class="info-label mb-2">Descuentos y Cargos Especiales</span>
                        <div class="benefits-list">
                          <div class="benefit-item">
                            <VIcon
                              :icon="contractDetail.pensionary === '1' ? 'tabler-check' : 'tabler-x'"
                              :color="contractDetail.pensionary === '1' ? 'success' : 'error'"
                              size="18"
                            />
                            <span class="benefit-label">Pensionado:</span>
                            <span class="benefit-value">{{ contractDetail.pensionary === '1' ? 'Sí' : 'No' }}</span>
                          </div>
                          <div class="benefit-item">
                            <VIcon
                              :icon="contractDetail.handicapped === '1' ? 'tabler-check' : 'tabler-x'"
                              :color="contractDetail.handicapped === '1' ? 'success' : 'error'"
                              size="18"
                            />
                            <span class="benefit-label">Discapacitado:</span>
                            <span class="benefit-value">{{ contractDetail.handicapped === '1' ? 'Sí' : 'No' }}</span>
                          </div>
                          <div class="benefit-item">
                            <VIcon
                              :icon="contractDetail.firefighters === '1' ? 'tabler-check' : 'tabler-x'"
                              :color="contractDetail.firefighters === '1' ? 'success' : 'error'"
                              size="18"
                            />
                            <span class="benefit-label">Bomberos:</span>
                            <span class="benefit-value">{{ contractDetail.firefighters === '1' ? 'Sí' : 'No' }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VWindowItem>

          <!-- Tab: Resumen de Adeudo -->
          <VWindowItem value="debt">
            <VRow>
              <VCol cols="12">
                <VAlert
                  :type="debtSummary.has_debt ? 'warning' : 'success'"
                  variant="tonal"
                  prominent
                  class="mb-5"
                >
                  <template #prepend>
                    <VIcon
                      :icon="debtSummary.has_debt ? 'tabler-alert-circle' : 'tabler-circle-check'"
                      size="28"
                    />
                  </template>
                  <VAlertTitle class="text-h6 mb-1">
                    {{ debtSummary.has_debt ? '⚠️ Contrato con Adeudo' : '✅ Contrato al Corriente' }}
                  </VAlertTitle>
                  <template v-if="debtSummary.has_debt">
                    Este contrato tiene <strong>{{ debtSummary.debt_months }}</strong> {{ parseInt(debtSummary.debt_months) === 1 ? 'mes' : 'meses' }} de adeudo pendiente.
                  </template>
                  <template v-else>
                    Este contrato no presenta adeudos pendientes. ¡Todo está al corriente!
                  </template>
                </VAlert>
              </VCol>

              <!-- Tarjetas de Resumen -->
              <VCol
                cols="12"
                md="4"
              >
                <VCard
                  class="stat-card"
                  color="error"
                  variant="tonal"
                >
                  <VCardText class="text-center pa-5">
                    <VIcon
                      icon="tabler-cash"
                      size="40"
                      color="error"
                      class="mb-2"
                    />
                    <div class="text-caption text-medium-emphasis mb-1">
                      Adeudo Total
                    </div>
                    <div class="text-h4 font-weight-bold text-error">
                      {{ formatCurrency(debtSummary.debt) }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol
                cols="12"
                md="4"
              >
                <VCard
                  class="stat-card"
                  color="warning"
                  variant="tonal"
                >
                  <VCardText class="text-center pa-5">
                    <VIcon
                      icon="tabler-calendar"
                      size="40"
                      color="warning"
                      class="mb-2"
                    />
                    <div class="text-caption text-medium-emphasis mb-1">
                      Meses de Adeudo
                    </div>
                    <div class="text-h4 font-weight-bold text-warning">
                      {{ debtSummary.debt_months }}
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol
                cols="12"
                md="4"
              >
                <VCard
                  class="stat-card"
                  color="info"
                  variant="tonal"
                >
                  <VCardText class="text-center pa-5">
                    <VIcon
                      icon="tabler-droplet"
                      size="40"
                      color="info"
                      class="mb-2"
                    />
                    <div class="text-caption text-medium-emphasis mb-1">
                      Consumo Promedio
                    </div>
                    <div class="text-h4 font-weight-bold text-info">
                      {{ debtSummary.average_consumption }} m³
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <!-- Última Lectura y Pago -->
              <VCol
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  color="success"
                  class="info-card"
                >
                  <VCardTitle class="section-title">
                    <VIcon
                      start
                      icon="tabler-gauge"
                      size="20"
                    />
                    Última Lectura
                  </VCardTitle>
                  <VCardText>
                    <div class="info-grid">
                      <div class="info-row">
                        <span class="info-label">Lectura</span>
                        <VChip
                          color="success"
                          variant="flat"
                        >
                          <VIcon
                            start
                            icon="tabler-droplet"
                          />
                          {{ debtSummary.last_read }} m³
                        </VChip>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Fecha</span>
                        <span class="info-value success-text">{{ debtSummary.last_date_read }}</span>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <VCard
                  variant="tonal"
                  color="primary"
                  class="info-card"
                >
                  <VCardTitle class="section-title">
                    <VIcon
                      start
                      icon="tabler-receipt"
                      size="20"
                    />
                    Información de Pago
                  </VCardTitle>
                  <VCardText>
                    <div class="info-grid">
                      <div class="info-row">
                        <span class="info-label">Monto en Letras</span>
                        <span class="info-value primary-text font-weight-bold">{{ formatCurrency(debtSummary.amount_letters) }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Estado</span>
                        <VChip
                          size="small"
                          :color="debtSummary.status === 'ACTIVO' ? 'success' : 'error'"
                          variant="flat"
                        >
                          {{ debtSummary.status }}
                        </VChip>
                      </div>
                    </div>
                  </VCardText>
                </VCard>
              </VCol>
            </VRow>
          </VWindowItem>
        </VWindow>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.contract-modal {
  border-radius: 10px;
  overflow: hidden;
}

.modal-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgb(var(--v-theme-secondary)) 100%);
  color: white;
  padding: 19px;
}

.header-subtitle {
  color: rgba(20, 20, 20, 1) !important;
  font-weight: 600;
}

.tabs-container {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.info-card {
  height: 100%;
  border-radius: 10px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  padding: 13px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.12);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px dashed rgba(var(--v-border-color), 0.08);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.full-width {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.info-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.7;
}

.info-value {
  font-weight: 500;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  text-align: right;
}

.primary-text {
  color: rgb(var(--v-theme-primary));
  font-weight: 700;
}

.secondary-text {
  color: rgb(var(--v-theme-secondary));
  font-weight: 700;
}

.info-text {
  color: rgb(var(--v-theme-info));
  font-weight: 700;
}

.success-text {
  color: rgb(var(--v-theme-success));
  font-weight: 700;
}

.stat-card {
  border-radius: 10px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: scale(1.05);
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 6px;
  border: 1px solid rgba(var(--v-border-color), 0.12);
}

.benefit-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.8;
}

.benefit-value {
  font-weight: 700;
  font-size: 0.875rem;
  margin-left: auto;
}
</style>
