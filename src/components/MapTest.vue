<script setup lang="ts">
import { computed, ref } from 'vue'
import MapComponent from './MapComponent.vue'

const latitude = ref(19.4326)
const longitude = ref(-99.1332)

const mapboxToken = computed(() =>
  import.meta.env.VITE_MAPBOX_KEY || '',
)
</script>

<template>
  <VCard>
    <VCardTitle>
      <VIcon class="me-2">
        tabler-map
      </VIcon>
      Test de Mapa
    </VCardTitle>
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model.number="latitude"
            label="Latitud"
            type="number"
            step="0.000001"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <VTextField
            v-model.number="longitude"
            label="Longitud"
            type="number"
            step="0.000001"
          />
        </VCol>
      </VRow>

      <VAlert
        v-if="!mapboxToken"
        type="warning"
        class="mt-4"
      >
        <template #prepend>
          <VIcon>tabler-alert-triangle</VIcon>
        </template>
        <div>
          <strong>Token de Mapbox no configurado</strong><br>
          Configura VITE_MAPBOX_KEY en tu archivo .env
        </div>
      </VAlert>

      <VAlert
        v-else
        type="success"
        class="mt-4"
      >
        <template #prepend>
          <VIcon>tabler-check</VIcon>
        </template>
        Token de Mapbox configurado correctamente
      </VAlert>
    </VCardText>

    <VCardText class="pt-0">
      <div style=" border: 1px solid #ccc; border-radius: 8px;block-size: 500px;">
        <MapComponent
          :latitude="latitude"
          :longitude="longitude"
          :access-token="mapboxToken"
          :zoom="18"
          height="500px"
        />
      </div>
    </VCardText>
  </VCard>
</template>
