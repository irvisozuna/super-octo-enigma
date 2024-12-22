<template>
  <VForm>
    <VRow>
      <VCol cols="12">
        <AppTextField
          v-model="formData.companyName"
          :label="$t('onboarding.companyName')"
          placeholder="Tu nombre comercial, marca o del negocio"
        />
      </VCol>

      <VCol cols="12">
        <AppSelect
          v-model="formData.activity"
          :label="$t('onboarding.activity')"
          :items="activities"
          placeholder="Selecciona la actividad"
        />
      </VCol>

      <VCol cols="12">
        <AppTextField
          v-model="formData.address"
          :label="$t('onboarding.address')"
          placeholder="Calle, # exterior, Colonia, Ciudad, Estado"
        />
      </VCol>
    </VRow>
  </VForm>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { CompanyInfoType } from '../../../../types/types';

const props = defineProps<{
  formData: CompanyInfoType;
  activities: string[];
}>();

const { t } = useI18n();
</script>

<script lang="ts">
export default {
  name: 'CompanyInfoForm',
  // Otros opciones del componente si las tienes
}
</script>
