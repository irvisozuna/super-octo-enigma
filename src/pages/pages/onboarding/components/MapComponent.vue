<template>
  <div class="map-wrapper">
    <GMapMap
      v-if="mapsLoaded"
      :center="center"
      :zoom="15"
      map-type-id="roadmap"
      style="block-size: 300px; inline-size: 100%;"
      @click="handleMapClick"
      @maps-loaded="handleMapsLoaded"
    >
      <GMapMarker
        :position="markerPosition"
        :draggable="true"
        @dragend="handleMarkerDrag"
      />
    </GMapMap>
  </div>
</template>

<script setup lang="ts">
import { useMap } from '@/composables/useMap';

const props = defineProps<{
  initialCenter: { lat: number; lng: number };
}>();

const { mapsLoaded, center, markerPosition, handleMapClick, handleMarkerDrag, updateAddressFromMarker } = useMap(props.initialCenter);

const handleMapsLoaded = () => {
  mapsLoaded.value = true;
};
</script>

<script lang="ts">
export default {
  name: 'MapComponent',
};
</script>

<style scoped>
.map-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background-color: #f5f5f5;
  block-size: 300px; /* Ajusta según necesites */
  inline-size: 100%; /* Ajusta según necesites */
}
</style>
