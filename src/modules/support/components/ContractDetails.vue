<script setup lang="ts">
import { useContractStore } from '@/modules/support/stores/contractStore'
import { computed } from 'vue'
import AccountBalanceDialog from './dialog/AccountBalanceDialog.vue'
import AccountMapDialog from './dialog/AccountMapDialog.vue'
import AddChargeDialog from './dialog/AddChargeDialog.vue'
import AddNoteDialog from './dialog/AddNoteDialog.vue'
import AddWorkOrderDialog from './dialog/AddWorkOrderDialog.vue'

const contractStore = useContractStore()
const contract = computed<Account | null>(() => contractStore.item)
const { openDialog } = useAppManager()

// Envuélvelo en computed
const statisticsHorizontal = computed(() => {
  return [
    {
      title: 'Convenio Activo',
      color: 'primary',
      icon: 'tabler-edit',
      stats: contract.value?.ref_agreement || 'N/A',
    },
    {
      title: 'Orden de trabajo',
      color: 'secondary',
      icon: 'tabler-clipboard',
      stats: contract.value?.ref || 'N/A', // o lo que necesites
    },
  ]
})

// Función para abrir el diálogo de Orden de Trabajo
function openAddWorkOrderDialog() {
  openDialog(AddWorkOrderDialog, {}, { width: '100%', persistent: true }).then(result => {
    if (result === 'submit')
      console.log('Work order completed')
  })
}

// Función para abrir el diálogo de estado de cuenta
function openAccountBalanceDialog() {
  openDialog(AccountBalanceDialog, {}, { width: '100%', persistent: true }).then(result => {
    if (result === 'submit')
      console.log('AccountBalanceDialog completed')
  })
}

// Función para abrir el diálogo nuevo cargo
function openAddChargeDialog() {
  openDialog(AddChargeDialog, {}, { width: '100%', persistent: true }).then(result => {
    if (result === 'submit')
      console.log('AddChargeDialog completed')
  })
}

// Función para abrir el diálogo ubicación
function openShowLocationDialog() {
  openDialog(AccountMapDialog, {}, { width: '100%', persistent: true }).then(result => {
    if (result === 'submit')
      console.log('AccountMapDialog completed')
  })
}

// Función para abrir el diálogo ubicación
function openAddNoteDialog() {
  openDialog(AddNoteDialog, {}, { width: '50%', persistent: true }).then(result => {
    if (result === 'submit')
      console.log('Nota creada, refrescando datos...')
  })
}
</script>

<template>
  <div>
    <!-- Información del contrato -->
    <VRow>
      <VCol>
        <VCard>
          <VCardTitle>
            <VSheet class="d-flex mb-6">
              <VSheet class="ma-2 pa-2 me-auto">
                <span class="text-h6">{{ $t('account') }}:</span>
                <span class="text-h6 ms-2">
                  <VChip color="primary">{{ contract?.account }}</VChip></span>
                <span class="text-h6 ms-4">{{ $t('user') }}:</span>
                <span class="text-h6 ms-2 "><VChip color="primary">{{ contract?.nameuser }}</VChip></span>
              </VSheet>
              <VSheet class="ma-2 pa-2">
                <VChip :style="{ color: `${contract?.color_hex} !important` }">
                  {{ contract?.status }}
                </VChip>
              </VSheet>
            </VSheet>
          </VCardTitle>
          <VCardText>
            <VRow>
              <!-- Dirección y datos de comunidad -->
              <VCol align-self="end">
                <div>
                  <span class="text-h6 font-weight-500">
                    <VIcon
                      icon="tabler-map-pin"
                      class="me-2"
                    />{{ $t('address') }}:
                  </span>
                  {{ contract?.address }}
                </div>
                <div class="d-flex flex-wrap mt-2">
                  <span class="flex-1-1-100">
                    <span class="text-h6 font-weight-500">
                      <VIcon
                        icon="tabler-map-2"
                        class="me-2"
                      />{{ $t('community') }}:
                    </span>
                    {{ contract?.community ?? contract?.source_entity }}
                  </span>
                  <span class="flex-1-0">
                    <span class="text-h6 font-weight-500">
                      <VIcon
                        icon="tabler-map-2"
                        class="me-2"
                      />{{ $t('system') }}:
                    </span>
                    {{ contract?.c_system }}
                    <span class="text-h6 font-weight-500">{{ $t('sector') }}:</span>
                    {{ contract?.sector }}
                  </span>
                  <span
                    v-if="contract?.route"
                    class="flex-1-0"
                  >
                    <span class="text-h6 font-weight-500">
                      <VIcon
                        icon="tabler-route-2"
                        class="me-2"
                      />{{ $t('route') }}:
                    </span>
                    {{ contract?.route }}
                  </span>
                </div>
              </VCol>

              <!-- Botones de acciones -->
              <VCol align-self="end">
                <VRow>
                  <VCol class="d-flex flex-wrap ga-3">
                    <VBtn
                      variant="outlined"
                      @click="openShowLocationDialog"
                    >
                      <VIcon
                        icon="tabler-map-pin"
                        class="me"
                      />
                    </VBtn>
                    <VBtn
                      variant="outlined"
                      @click="openAddWorkOrderDialog"
                    >
                      <VIcon
                        icon="tabler-tool"
                        class="me-2"
                      />{{ $t('workorder') }}
                    </VBtn>
                    <VBtn
                      variant="outlined"
                      @click="openAccountBalanceDialog"
                    >
                      <VIcon
                        icon="tabler-printer"
                        class="me-2"
                      />{{ $t('account_balance') }}
                    </VBtn>
                    <VBtn
                      color="primary"
                      @click="openAddChargeDialog"
                    >
                      <VIcon
                        icon="tabler-plus"
                        class="me-2"
                      />{{ $t('add_charge') }}
                    </VBtn>
                    <VBtn
                      color="secondary"
                      variant="outlined"
                      prepend-icon="tabler-note"
                      @click="openAddNoteDialog"
                    >
                      {{ $t('add_note') }}
                    </VBtn>
                  </VCol>
                </VRow>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Estadísticas y detalles -->
    <VRow>
      <VCol
        cols="12"
        md="4"
      >
        <VRow>
          <VCol>
            <VCard>
              <VCardText>
                <VRow class="d-flex justify-center align-center">
                  <VCol
                    cols="12"
                    sm="6"
                    md="4"
                    class="d-flex justify-center align-center"
                  >
                    <div
                      class="border border-dashed d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-3"
                      style="aspect-ratio: 1; inline-size: 100%;"
                      @click="toggle"
                    >
                      <h6 class="text-base mb-0">
                        {{ contract?.debt }}
                      </h6>
                      <h6 class="text-base text-center font-weight-light mb-0">
                        {{ $t('balance_due') }}
                      </h6>
                    </div>
                  </VCol>
                  <VCol
                    cols="12"
                    sm="6"
                    md="4"
                    class="d-flex justify-center align-center"
                  >
                    <div
                      class="border border-dashed d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-3"
                      style="aspect-ratio: 1; inline-size: 100%;"
                      @click="toggle"
                    >
                      <h6 class="text-base mb-0">
                        {{ contract?.positive_balance }}
                      </h6>
                      <h6 class="text-base text-center font-weight-light mb-0">
                        {{ $t('positive_balance') }}
                      </h6>
                    </div>
                  </VCol>
                  <VCol
                    cols="12"
                    sm="12"
                    md="4"
                    class="d-flex justify-center align-center"
                  >
                    <div
                      class="border border-dashed d-flex flex-column justify-center align-center cursor-pointer rounded py-4 px-3"
                      style="aspect-ratio: 1; inline-size: 100%;"
                      @click="toggle"
                    >
                      <h6 class="text-base mb-0">
                        {{ contract?.months_debt }}
                      </h6>
                      <h6 class="text-base text-center font-weight-light mb-0">
                        {{ $t('months_due') }}
                      </h6>
                    </div>
                  </VCol>
                </VRow>
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
        <VRow>
          <VCol>
            <VCard>
              <VCardText>
                <div class="d-flex justify-space-between mb-1">
                  <div class="text-base">
                    {{ contract?.average || '0 / 0' }} {{ $t('level_completed') }}
                  </div>

                  <div class="text-disabled text-sm">
                    <VIcon
                      color="success"
                      icon="tabler-checkbox"
                    />
                  </div>
                </div>

                <VProgressLinear
                  :model-value="(contract?.average || 0) * 20"
                  color="info"
                  height="8"
                  rounded
                />
              </VCardText>
            </VCard>
          </VCol>
        </VRow>
        <VRow>
          <VCol
            v-for="statistics in statisticsHorizontal"
            :key="statistics.title"
            cols="12"
            sm="6"
            md="6"
          >
            <CardStatisticsVerticalSimple v-bind="statistics" />
          </VCol>
        </VRow>
      </VCol>

      <VCol>
        <VCard class="pa-4">
          <VCardTitle class="text-h6">
            {{ $t('contract_general_data') }}
          </VCardTitle>
          <VCardText>
            <VList dense>
              <VListItem>
                <VIcon
                  icon="tabler-droplet"
                  class="me-2"
                />{{ $t('contract_type') }}: {{ contract?.code_type_contrat }}
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-calendar"
                  class="me-2"
                />{{ $t('contract_date') }}: {{ contract?.date_created }}
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-activity"
                  class="me-2"
                />{{ $t('contract_status') }}: {{ contract?.status }}
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-hash"
                  class="me-2"
                />{{ $t('meter_number') }}: {{ contract?.measurer }}
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-percentage"
                  class="me-2"
                />{{ $t('pensionary') }}: N/A
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-clock"
                  class="me-2"
                />{{ $t('validity') }}:
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-users"
                  class="me-2"
                />{{ $t('handicapped') }}: N/A
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-toggle-left"
                  class="me-2"
                />{{ $t('validity') }}:
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-bookmark"
                  class="me-2"
                />{{ $t('business_activity') }}: {{ contract?.business_activity }}
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-tag"
                  class="me-2"
                />{{ $t('rate') }}: {{ contract?.rate_type }}
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        md="4"
      >
        <VCard class="pa-4">
          <!-- Resumen de servicios -->
          <VCardTitle class="text-h6">
            {{ $t('service_summary') }}
          </VCardTitle>
          <VCardText>
            <VList dense>
              <VListItem>
                <VIcon
                  icon="tabler-star"
                  class="me-2"
                />{{ $t('metric') }}: {{ contract?.type_charge }}
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-calendar"
                  class="me-2"
                />{{ $t('services') }}: {{ contract?.type_services }}
              </VListItem>
            </VList>
          </VCardText>

          <!-- Datos fiscales -->
          <VCardTitle class="text-h6 mt-4">
            {{ $t('fiscal_data') }}
          </VCardTitle>
          <VCardText>
            <VList dense>
              <VListItem>
                <VIcon
                  icon="tabler-star"
                  class="me-2"
                />{{ $t('business_name') }}:
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-devices-2"
                  class="me-2"
                />{{ $t('tax_id') }}:
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-activity"
                  class="me-2"
                />{{ $t('postal_code') }}:
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-calendar"
                  class="me-2"
                />{{ $t('cfdi_use') }}:
                <VBtn
                  icon
                  variant="plain"
                  class="ms-2"
                >
                  <VIcon icon="tabler-edit-3" />
                </VBtn>
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-calendar"
                  class="me-2"
                />{{ $t('email') }}:
                <VBtn
                  icon
                  variant="plain"
                  class="ms-2"
                >
                  <VIcon icon="tabler-edit-3" />
                </VBtn>
              </VListItem>
              <VListItem>
                <VIcon
                  icon="tabler-calendar"
                  class="me-2"
                />{{ $t('phone') }}:
                <VBtn
                  icon
                  variant="plain"
                  class="ms-2"
                >
                  <VIcon icon="tabler-edit-3" />
                </VBtn>
              </VListItem>
            </VList>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
