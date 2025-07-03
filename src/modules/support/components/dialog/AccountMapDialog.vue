<template>
  <DialogCloseBtn @click="closeDialog" />
  <VCard>
    <VCardTitle class="headline">
      {{ $t('last_reading') }}
    </VCardTitle>
    <VCardText>
      <VRow>
        <VCol cols="12">
          <MapComponent
            :latitude="latitude"
            :longitude="longitude"
            :accessToken="token"
          />
        </VCol>
      </VRow>
    </VCardText>
    <VCardActions>
      <VBtn text @click="closeDialog">
        {{ $t('close') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useContractStore } from '../../stores/contractStore';
import MapComponent from '../MapComponent.vue';
const { closeDialog } = useAppManager();
const contractStore = useContractStore()

// Coordenadas de ejemplo
const latitude = ref(contractStore.item?.latitude ?? 25.794954054583986); 
const longitude = ref(contractStore.item?.longitude ?? -108.9922718067938); 

// Token de acceso de Mapbox desde las variables de entorno
const token = ref(import.meta.env.VITE_MAPBOX_KEY);
</script>
