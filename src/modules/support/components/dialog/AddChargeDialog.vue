<template>
  <VCard>
    <VForm class="mt-6" :onSubmit="handleSubmit(onFormSubmit)">
      <VCardTitle class="headline">
        {{ $t('support.add_charge') }}
      </VCardTitle>
      <VCardText>
        <VRow>
          <!-- Select Cargo -->
          <VCol cols="12" md="5">
            <api-data-source api-path="supports/getServices" @loaded="(response) => servicesOptions = response">
              <template v-slot="{ loading }">
                <VSelect
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
                >
                  <template #prepend-item v-if="loading">
                    <span class="text-secondary text-caption">{{ $t('loading') }}...</span>
                  </template>
                </VSelect>
              </template>
            </api-data-source>
          </VCol>
          <!-- tva_tx -->
          <VCol cols="12" md="2">
            <VTextField
              v-model="tva_tx"
              label="IVA"
              variant="outlined"
              dense
              readonly
            />
          </VCol>
          <!-- Price -->
          <VCol cols="12" md="2">
            <VTextField
              v-model="price"
              label="Precio"
              variant="outlined"
              dense
            />
          </VCol>
          <!-- Quantity -->
          <VCol cols="12" md="2">
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
          <VCol cols="12" md="1">
            <VBtn color="secondary" class="mt-6" @click="addCharge">
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
          <template #item.action="{ item }">
            <VBtn icon @click="removeCharge(item)" variant="text" color="error">
              <VIcon icon="tabler-trash"></VIcon>
            </VBtn>
          </template>
        </VDataTable>
        <!-- Totals -->
        <VRow class="mt-6">
          <VCol cols="9" class="text-right">
            <strong>Totales:</strong>
          </VCol>
          <VCol cols="1">{{ totalQuantity }}</VCol>
          <VCol cols="2">${{ totalCost.toFixed(2) }}</VCol>
        </VRow>
      </VCardText>
      <VCardActions class="justify-end">
        <VBtn  variant="flat" color="secondary" @click="closeDialog" :disabled="isLoading" :loading="isLoading">
          {{ $t('cancel') }}
        </VBtn>
        <VBtn variant="flat" color="primary" type="submit" :disabled="isLoading" :loading="isLoading">
          {{ $t('save') }}
        </VBtn>
      </VCardActions>
    </VForm>
  </VCard>
</template>

<script setup lang="ts">
import { useNotification } from '@/helpers/notificationHelper';
import { useField, useForm } from 'vee-validate';
import { computed, ref } from 'vue';
import { useContractStore } from '../../stores/contractStore';

const { showSuccess, showError } = useNotification();
const contractStore = useContractStore();
const { closeDialog } = useAppManager();
const isLoading = ref(false);

// Validation and Form
const { handleSubmit, errors } = useForm({
  initialValues: {
    selectedService: null,
    tva_tx: 16,
    price: '',
    quantity: 1,
  },
});
const token_dolibarr = useCookie('dolibarrToken').value;
const { value: selectedService } = useField('selectedService');
const { value: tva_tx } = useField('tva_tx');
const { value: price } = useField('price');
const { value: quantity } = useField('quantity');

// Options and State
const servicesOptions = ref([]);
const addedCharges = ref([]);
const tableHeaders = [
  { title: 'Servicio', key: 'name' },
  { title: 'iva', key: 'tva_tx' },
  { title: 'Precio', key: 'price' },
  { title: 'Cantidad', key: 'quantity' },
  { title: 'Total', key: 'total' },
  { title: 'Acción', key: 'action', sortable: false },
];

// Totals
const totalQuantity = computed(() =>
  addedCharges.value.reduce((sum, charge) => sum + charge.quantity, 0)
);
const totalCost = computed(() =>
  addedCharges.value.reduce((sum, charge) => sum + charge.total, 0)
);

// Methods
const addCharge = () => {
  if (selectedService.value && price.value && quantity.value) {
    addedCharges.value.push({
      id: selectedService.value.rowid,
      name: selectedService.value.name || 'N/A',
      tva_tx: tva_tx.value || 16,
      price: parseFloat(price.value),
      quantity: parseInt(quantity.value, 10),
      total: parseFloat(price.value) * parseInt(quantity.value, 10),
    });
    resetFields();
  }
};

const removeCharge = (item) => {
  addedCharges.value = addedCharges.value.filter((charge) => charge !== item);
};

const resetFields = () => {
  selectedService.value = null;
  tva_tx.value = 16;
  price.value = '';
  quantity.value = 1;
};

const onFormSubmit = async () => {
  try {
    isLoading.value = true;
    const payload = {
      charges: addedCharges.value,
      account: contractStore.item.account,
      token: token_dolibarr
    };
    const response = await contractStore.createItem(payload, '/charges');
    showSuccess(response.message);
    closeDialog();
    isLoading.value = false;
  } catch (error) {
    showError('Error al guardar los cargos');
    console.error(error);
    isLoading.value = false;
  }
};
</script>
