<script setup lang="ts">
import { computed } from 'vue'
import MapComponent from './MapComponent.vue'

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
      Test Simple de Mapa
    </VCardTitle>
    <VCardText>
      <VAlert
        v-if="!mapboxToken"
        type="warning"
        class="mb-4"
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
        class="mb-4"
      >
        <template #prepend>
          <VIcon>tabler-check</VIcon>
        </template>
        Token de Mapbox configurado correctamente
      </VAlert>

      <div style=" border: 1px solid #ccc; border-radius: 8px;block-size: 500px;">
        <MapComponent
          :latitude="19.4326"
          :longitude="-99.1332"
          :access-token="mapboxToken"
          :zoom="18"
          height="500px"
        />
      </div>
    </VCardText>
  </VCard>
</template>
