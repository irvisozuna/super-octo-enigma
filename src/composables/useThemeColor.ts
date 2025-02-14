// src/composables/useThemeColor.ts
import { cookieRef } from '@layouts/stores/config';
import { useDebounceFn, useStorage } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import { useTheme } from 'vuetify';

export function useThemeColor() {
  const vuetifyTheme = useTheme();

  const customPrimaryColor = ref('#663131');
  const customSecondaryColor = ref('#FFB400'); // Color secundario por defecto

  const colors = [
    { main: '#675DD8', darken: '#5755D8' },
    { main: '#0D9394', darken: '#0C8485' },
    { main: '#FFB400', darken: '#E6A200' },
    { main: '#FF4C51', darken: '#E64449' },
    { main: '#16B1FF', darken: '#149FE6' },
  ];

  const setPrimaryColor = useDebounceFn((color: { main: string; darken: string }) => {
    vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.primary = color.main;
    vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['primary-darken-1'] = color.darken;

    // Guardar en cookies
    cookieRef<string | null>(`${vuetifyTheme.name.value}ThemePrimaryColor`, null).value = color.main;
    cookieRef<string | null>(`${vuetifyTheme.name.value}ThemePrimaryDarkenColor`, null).value = color.darken;

    // Actualizar el color del cargador inicial
    useStorage<string | null>('initial-loader-color', null).value = color.main;
  }, 100);

  const setSecondaryColor = useDebounceFn((color: { main: string; darken: string }) => {
    vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.secondary = color.main;
    vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['secondary-darken-1'] = color.darken;

    // Guardar en cookies
    cookieRef<string | null>(`${vuetifyTheme.name.value}ThemeSecondaryColor`, null).value = color.main;
    cookieRef<string | null>(`${vuetifyTheme.name.value}ThemeSecondaryDarkenColor`, null).value = color.darken;
  }, 100);

  // Monitorear cambios en los colores personalizados
  watch(() => customPrimaryColor.value, () => {
    setPrimaryColor({ main: customPrimaryColor.value, darken: customPrimaryColor.value });
  });

  watch(() => customSecondaryColor.value, () => {
    setSecondaryColor({ main: customSecondaryColor.value, darken: customSecondaryColor.value });
  });

  return {
    colors: computed(() => colors),
    customPrimaryColor,
    customSecondaryColor,
    setPrimaryColor,
    setSecondaryColor,
  };
}
