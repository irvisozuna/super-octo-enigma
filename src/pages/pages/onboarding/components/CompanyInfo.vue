<template>
  <div class="company-info-container">
    <h2 class="title">{{ $t('onboarding.companyInfoTitle') }}</h2>
    <p class="subtitle">{{ $t('onboarding.companyInfoSubtitle') }}</p>
    <CompanyInfoForm :formData="formData" :activities="activities" />
    <MapComponent
      :initialCenter="center"
      @updateAddress="updateAddressFromMarker"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CompanyInfoType } from '../../../../types/types';
import CompanyInfoForm from './CompanyInfoForm.vue';

const props = defineProps<{
  formData: CompanyInfoType;
}>();

const emit = defineEmits<{
  (e: "update:formData", value: CompanyInfoType): void;
  (e: 'complete', value: CompanyInfoType): void;
}>();
const { t } = useI18n();

const formData = ref<CompanyInfoType>({ ...props.formData });
const center = ref({ lat: 29.0718, lng: -110.9559 });
const activities = ref([
  'Comercio',
  'Servicios',
  'Industria',
  'Educación',
  'Salud',
  'Otro',
]);

const isComplete = computed(() => {
  return !!formData.value.companyName && !!formData.value.activity && !!formData.value.address && !!formData.value.location;
});

watch(isComplete, (newComplete) => {
  if (newComplete) {
    nextTick(() => {
      emit('complete', formData.value);
    });
  }
});

watch(formData, () => {
  emit('update:formData', formData.value);
});

const updateAddressFromMarker = async (address: string) => {
  formData.value.address = address;
};
</script>
<script lang="ts">
export default {
  name: 'CompanyInfo',
  // Otros opciones del componente si las tienes
}
</script>
<style scoped>
/* Tus estilos aquí */
</style>
