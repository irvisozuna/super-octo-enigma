<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '../../stores/contractStore'
import { useNotification } from '@/helpers/notificationHelper'
import { useAppManager } from '@/composables/useAppManager'

const { t } = useI18n()
const { showSuccess, showError } = useNotification()
const contractStore = useContractStore()
const { closeDialog } = useAppManager()
const isLoading = ref(false)

// Get user data from cookie
const userData = useCookie('userData').value
const aquasoft_id = userData?.aquasoft_id
const token_dolibarr = useCookie('dolibarrToken').value

// Define types for better TypeScript support
interface Service {
  rowid: number
  name: string
  price: number
  tva_tx: number
}

interface Charge {
  id: number
  name: string
  tva_tx: number
  price: number
  quantity: number
  total: number
}

// Validation and Form
const { errors } = useForm({
  initialValues: {
    selectedService: null as Service | null,
    tva_tx: 16,
    price: '',
    quantity: 1,
  },
})

const { value: selectedService } = useField<Service | null>('selectedService')
const { value: tva_tx } = useField<number>('tva_tx')
const { value: price } = useField<string>('price')
const { value: quantity } = useField<number>('quantity')

// Options and State
const servicesOptions = ref<Service[]>([])
const addedCharges = ref<Charge[]>([])

const tableHeaders = [
  { title: 'Servicio', key: 'name' },
  { title: 'IVA', key: 'tva_tx' },
  { title: 'Precio', key: 'price' },
  { title: 'Cantidad', key: 'quantity' },
  { title: 'Total', key: 'total' },
  { title: 'Acción', key: 'action', sortable: false },
]

// Totals
const totalQuantity = computed(() =>
  addedCharges.value.reduce((sum, charge) => sum + charge.quantity, 0),
)

const totalCost = computed(() =>
  addedCharges.value.reduce((sum, charge) => sum + charge.total, 0),
)

// Methods
const resetFields = () => {
  selectedService.value = null
  tva_tx.value = 16
  price.value = ''
  quantity.value = 1
}

const addCharge = () => {
  if (selectedService.value && price.value && quantity.value) {
    const priceValue = Number.parseFloat(price.value)
    const quantityValue = Number.parseInt(quantity.value.toString(), 10)

    // Usar el valor real del IVA, incluso si es 0
    const tvaValue = tva_tx.value !== undefined ? tva_tx.value : 16

    addedCharges.value.push({
      id: selectedService.value.rowid,
      name: selectedService.value.name || 'N/A',
      tva_tx: tvaValue,
      price: Number.parseFloat((priceValue / (1 + (tvaValue / 100))).toFixed(2)),
      quantity: quantityValue,
      total: priceValue * quantityValue,
    })
    resetFields()
  }
}

const removeCharge = (item: Charge) => {
  addedCharges.value = addedCharges.value.filter(charge => charge !== item)
}

// Modify the onFormSubmit function
const onFormSubmit = async () => {
  // Validate if there are charges to save
  if (addedCharges.value.length === 0) {
    showError('Debe agregar al menos un cargo')

    return
  }

  try {
    isLoading.value = true
    if (!aquasoft_id) {
      showError(t('error_creating_note'))

      return
    }

    const payload = {
      charges: addedCharges.value,
      account: contractStore.item?.account,
      token: token_dolibarr,
      user_id: aquasoft_id,
    }

    const response = await contractStore.createItem(payload, '/charges')

    showSuccess(response.message || 'Cargos guardados correctamente')
    closeDialog()
  }
  catch (error: any) {
    showError(`Error al guardar los cargos: ${error.message || 'Error desconocido'}`)
    console.error('Error details:', error)
  }
  finally {
    isLoading.value = false
  }
}

const onServiceSelect = (service: Service | null) => {
  if (service) {
    // Asignar automáticamente el impuesto y precio del servicio seleccionado
    // Usar el valor real del servicio, incluso si es 0
    tva_tx.value = service.tva_tx !== undefined ? service.tva_tx : 16
    price.value = service.price?.toString() || ''
  }
  else {
    resetFields()
  }
}
</script>

<template>
  <DialogCloseBtn @click="closeDialog" />
  <VCard>
    <VForm
      class="mt-6"
      @submit.prevent="onFormSubmit"
    >
      <VCardTitle class="headline">
        {{ $t('support.add_charge') }}
      </VCardTitle>
      <VCardText>
        <VRow>
          <!-- Select Cargo -->
          <VCol
            cols="12"
            md="5"
          >
            <ApiDataSource
              api-path="supports/getServices"
              @loaded="(response) => servicesOptions = response"
            >
              <template #default="{ loading }">
                <VAutocomplete
                  v-model="selectedService"
                  :items="servicesOptions"
                  item-title="name"
                  item-value="rowid"
                  label="Cargo"
                  variant="outlined"
                  dense
                  return-object
                  clearable
                  :loading="loading"
                  :error="!!errors.selectedService"
                  :error-messages="errors.selectedService ? [errors.selectedService] : []"
                  @update:model-value="onServiceSelect"
                >
                  <template
                    v-if="loading"
                    #prepend-item
                  >
                    <span class="text-secondary text-caption">{{ $t('loading') }}...</span>
                  </template>
                </VAutocomplete>
              </template>
            </ApiDataSource>
          </VCol>
          <!-- tva_tx -->
          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="tva_tx"
              label="IVA (%)"
              variant="outlined"
              dense
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
          </VCol>
          <!-- Price -->
          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="price"
              label="Precio"
              variant="outlined"
              dense
              type="number"
              min="0"
              step="0.01"
            />
          </VCol>
          <!-- Quantity -->
          <VCol
            cols="12"
            md="2"
          >
            <VTextField
              v-model="quantity"
              label="Cantidad"
              type="number"
              min="1"
              variant="outlined"
              dense
            />
          </VCol>
          <!-- Add Button -->
          <VCol
            cols="12"
            md="1"
          >
            <VBtn
              color="secondary"
              class="mt-6"
              @click="addCharge"
            >
              Agregar
            </VBtn>
          </VCol>
        </VRow>
        <!-- Table of Added Charges -->
        <VDataTable
          :headers="tableHeaders"
          :items="addedCharges"
          hide-default-footer
          class="elevation-1 mt-6"
        >
          <template #item.tva_tx="{ item }">
            {{ item.tva_tx }}%
          </template>
          <template #item.price="{ item }">
            ${{ ((item.price || 0) / (1 + (item.tva_tx / 100))).toFixed(2) }}
          </template>
          <template #item.total="{ item }">
            ${{ item.total.toFixed(2) }}
          </template>
          <template #item.action="{ item }">
            <VBtn
              icon
              variant="text"
              color="error"
              @click="removeCharge(item)"
            >
              <VIcon icon="tabler-trash" />
            </VBtn>
          </template>
        </VDataTable>
        <!-- Totals -->
        <VRow class="mt-6">
          <VCol
            cols="9"
            class="text-right"
          >
            <strong>Totales:</strong>
          </VCol>
          <VCol cols="1">
            {{ totalQuantity }}
          </VCol>
          <VCol cols="2">
            ${{ totalCost.toFixed(2) }}
          </VCol>
        </VRow>
      </VCardText>
      <VCardActions class="justify-end">
        <VBtn
          variant="flat"
          color="secondary"
          :disabled="isLoading"
          :loading="isLoading"
          @click="closeDialog"
        >
          {{ $t('cancel') }}
        </VBtn>
        <VBtn
          variant="flat"
          color="primary"
          type="submit"
          :disabled="isLoading"
          :loading="isLoading"
        >
          {{ $t('save') }}
        </VBtn>
      </VCardActions>
    </VForm>
  </VCard>
</template>
