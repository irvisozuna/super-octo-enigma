import { Client } from '@googlemaps/google-maps-services-js';
import { Loader } from '@googlemaps/js-api-loader';
import { onMounted, ref } from 'vue';

export function useMap(initialCenter: { lat: number; lng: number }) {
  const apiKey = '';//import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('API KEY:', apiKey); // eslint-disable-line no-console
  debugger
  const mapsLoaded = ref(false);
  const map = ref<google.maps.Map | null>(null);
  const center = ref(initialCenter);
  const markerPosition = ref(initialCenter);
  const client = new Client({});

  onMounted(async () => {
    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });

    await loader.load();

    const mapWrapper = document.querySelector('.map-wrapper') as HTMLElement | null;
    if (mapWrapper) {
      map.value = new google.maps.Map(mapWrapper, {
        center: center.value,
        zoom: 15,
      });

      mapsLoaded.value = true;

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            center.value = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            markerPosition.value = center.value;
          },
          (error) => {
            console.error('Error obteniendo la ubicación:', error);
          }
        );
      }
    } else {
      console.error('No se encontró el elemento .map-wrapper');
    }
  });

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      markerPosition.value = event.latLng.toJSON();
      updateAddressFromMarker();
    }
  };

  const handleMarkerDrag = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      markerPosition.value = event.latLng.toJSON();
      updateAddressFromMarker();
    }
  };

  const updateAddressFromMarker = async () => {
    const response = await client.reverseGeocode({
      params: {
        latlng: markerPosition.value,
        key: apiKey,
      },
    });
    return response.data.results[0].formatted_address;
  };

  return {
    mapsLoaded,
    map,
    center,
    markerPosition,
    handleMapClick,
    handleMarkerDrag,
    updateAddressFromMarker,
  };
}
