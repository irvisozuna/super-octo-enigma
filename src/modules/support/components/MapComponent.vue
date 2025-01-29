<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<script setup lang="ts">
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { onMounted, onUnmounted, ref, watch } from 'vue';

// Definición de las propiedades que el componente acepta
const props = defineProps<{
  latitude: number;
  longitude: number;
  accessToken: string;
}>();

// Referencia al contenedor del mapa
const mapContainer = ref<HTMLElement | null>(null);
let map: mapboxgl.Map | null = null;
let marker: mapboxgl.Marker | null = null;

onMounted(() => {
  if (mapContainer.value) {
    // Asignación del token de acceso de Mapbox
    mapboxgl.accessToken = props.accessToken;

    // Inicialización del mapa
    map = new mapboxgl.Map({
      container: mapContainer.value,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [props.longitude, props.latitude],
      zoom: 16,
      pitch: 45,
      bearing: 0, // Dirección inicial (0 = norte)
      antialias: true // Suaviza los bordes
    });

    map.addControl(new mapboxgl.AttributionControl({
        compact: true,
        customAttribution: 'Mapa diseñado por Aquasoft'
    }), 'bottom-right');
    // Agregar controles de navegación (zoom y rotación)
    const nav = new mapboxgl.NavigationControl({ showCompass: true, showZoom: true });
    map.addControl(nav, 'top-right'); // Posición del control

    // Agregar control de escala
    const scale = new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'metric' // Puede ser 'imperial' o 'metric'
    });
    map.addControl(scale, 'bottom-left');

    // Creación y adición del marcador al mapa
    // marker = new mapboxgl.Marker()
    //   .setLngLat([props.longitude, props.latitude])
    //   .addTo(map);
        // Crear un elemento HTML personalizado para el marcador
    const markerElement = document.createElement('div');
    markerElement.style.backgroundImage = 'url(https://docs.mapbox.com/mapbox-gl-js/assets/custom_marker.png)';
    markerElement.style.width = '30px';
    markerElement.style.height = '38px';
    markerElement.style.backgroundSize = '100%';

    // Agregar el marcador al mapa con el elemento personalizado
    marker = new mapboxgl.Marker({ element: markerElement })
      .setLngLat([props.longitude, props.latitude])
      .addTo(map);
  }
});

onUnmounted(() => {
  // Eliminación del mapa al desmontar el componente
  if (map) {
    map.remove();
  }
});

// Observador para detectar cambios en las coordenadas y actualizar el mapa y el marcador
watch(
  () => [props.latitude, props.longitude],
  ([newLat, newLng]) => {
    if (map) {
      map.setCenter([newLng, newLat]);
    }
    if (marker) {
      marker.setLngLat([newLng, newLat]);
    }
  }
);
</script>

<style scoped>
/* Estilos para el contenedor del mapa */
.map-container {
  block-size: 80vh; /* Ajusta la altura según tus necesidades */
  inline-size: 100%;
}
</style>
