<script setup lang="ts">
import { useField, useForm } from 'vee-validate'
import { computed, ref } from 'vue'
import { useContractStore } from '../../stores/contractStore'
import { useNotification } from '@/helpers/notificationHelper'

// Types
interface Service {
  rowid: string | number
  name: string
  tva_tx: number
  price: number
}

interface Charge {
  id: string | number
  name: string
  tva_tx: number
  price: number
  quantity: number
  total: number
}

const { showSuccess, showError } = useNotification()
const contractStore = useContractStore()
const { closeDialog } = useAppManager()
const isLoading = ref(false)
const { aquasoft_id, name } = useCookie('userData').value

// Validation and Form
const { handleSubmit, errors } = useForm({
  initialValues: {
    selectedService: null,
    tva_tx: 16,
    price: '',
    quantity: 1,
  },
})

const token_dolibarr = useCookie('dolibarrToken').value
const { value: selectedService } = useField<Service | null>('selectedService')
const { value: tva_tx } = useField<number>('tva_tx')
const { value: price } = useField<string>('price')
const { value: quantity } = useField<number>('quantity')

// Options and State
const servicesOptions = ref<Service[]>([])
const addedCharges = ref<Charge[]>([])

const tableHeaders = [
  { title: 'Servicio', key: 'name' },
  { title: 'iva', key: 'tva_tx' },
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
const addCharge = () => {
  if (selectedService.value && price.value && quantity.value) {
    const priceBase = Number.parseFloat(String(price.value || '0'))
    const quantityValue = Number.parseInt(String(quantity.value), 10)
    const ivaRate = (tva_tx.value ?? 16) / 100
    
    // El precio ingresado es el precio base (sin IVA)
    // El total debe incluir el IVA: precio base * (1 + IVA) * cantidad
    const totalWithIva = priceBase * (1 + ivaRate) * quantityValue
    
    addedCharges.value.push({
      id: selectedService.value.rowid,
      name: selectedService.value.name || 'N/A',
      tva_tx: tva_tx.value ?? 16,
      price: priceBase, // precio base sin IVA
      quantity: quantityValue,
      total: totalWithIva, // total con IVA incluido
    })
    resetFields()
  }
}

const removeCharge = (item: Charge) => {
  addedCharges.value = addedCharges.value.filter(charge => charge !== item)
}

const resetFields = () => {
  selectedService.value = null
  tva_tx.value = 16
  price.value = ''
  quantity.value = 1
}

// Modify the onFormSubmit function
const onFormSubmit = async () => {
  // Validate if there are charges to save
  if (addedCharges.value.length === 0) {
    showError('Debe agregar al menos un cargo')

    return
  }

  try {
    if (!aquasoft_id) {
      showError('Error creando nota')
      return
    }
    isLoading.value = true

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
    showError(`Error al guardar los cargos: ${error?.message || 'Error desconocido'}`)
    console.error('Error details:', error)
  }
  finally {
    isLoading.value = false
  }
}

const onServiceSelect = (service: any) => {
  if (service) {
    tva_tx.value = service.tva_tx ?? 16
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
                  item-value="id"
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
              label="IVA"
              variant="outlined"
              dense
              readonly
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
          <template #item.price="{ item }">
            ${{ (item.price || 0).toFixed(2) }}
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
