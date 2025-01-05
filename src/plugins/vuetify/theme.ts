import type { ThemeDefinition } from 'vuetify'

export const staticPrimaryColor = '#4CAF50' // Verde Brillante
export const staticPrimaryDarkenColor = '#388E3C' // Verde Oscuro

export const staticSecondaryColor = '#FFC107' // Naranja Brillante
export const staticSecondaryDarkenColor = '#FFA000' // Naranja Oscuro

export const themes: Record<string, ThemeDefinition> = {
  light: {
    dark: false,
    colors: {
      'primary': staticPrimaryColor,
      'on-primary': '#fff',
      'primary-darken-1': staticPrimaryDarkenColor,
      'secondary': staticSecondaryColor, // Turquesa Oscuro
      'on-secondary': '#fff',
      'secondary-darken-1': staticSecondaryDarkenColor, // Turquesa Más Oscuro
      'success': '#28C76F', // Verde Éxito
      'on-success': '#fff',
      'success-darken-1': '#24B364',
      'info': '#00BCD4', // Turquesa Brillante
      'on-info': '#fff',
      'info-darken-1': '#0097A7', // Turquesa Más Oscuro
      'warning': '#FFC107', // Naranja Brillante
      'on-warning': '#fff',
      'warning-darken-1': '#FFA000', // Naranja Oscuro
      'error': '#F44336', // Rojo
      'on-error': '#fff',
      'error-darken-1': '#D32F2F', // Rojo Oscuro
      'background': '#F5F5F5', // Gris Claro
      'on-background': '#37474F', // Gris Oscuro
      'surface': '#FFFFFF', // Blanco
      'on-surface': '#004D40', // Verde Muy Oscuro
      'grey-50': '#FAFAFA',
      'grey-100': '#F5F5F5',
      'grey-200': '#EEEEEE',
      'grey-300': '#E0E0E0',
      'grey-400': '#BDBDBD',
      'grey-500': '#9E9E9E',
      'grey-600': '#757575',
      'grey-700': '#616161',
      'grey-800': '#424242',
      'grey-900': '#212121',
      'grey-light': '#FAFAFA',
      'perfect-scrollbar-thumb': '#DBDADE',
      'skin-bordered-background': '#FFFFFF',
      'skin-bordered-surface': '#FFFFFF',
      'expansion-panel-text-custom-bg': '#FAFAFA',
    },

    variables: {
      'code-color': '#d400ff',
      'overlay-scrim-background': '#2F2B3D',
      'tooltip-background': '#2F2B3D',
      'overlay-scrim-opacity': 0.5,
      'hover-opacity': 0.06,
      'focus-opacity': 0.1,
      'selected-opacity': 0.08,
      'activated-opacity': 0.16,
      'pressed-opacity': 0.14,
      'dragged-opacity': 0.1,
      'disabled-opacity': 0.4,
      'border-color': '#2F2B3D',
      'border-opacity': 0.12,
      'table-header-color': '#E0F2F1',
      'high-emphasis-opacity': 0.9,
      'medium-emphasis-opacity': 0.7,
      'switch-opacity': 0.2,
      'switch-disabled-track-opacity': 0.3,
      'switch-disabled-thumb-opacity': 0.4,
      'switch-checked-disabled-opacity': 0.3,
      'track-bg': '#F1F0F2',

      // Sombras
      'shadow-key-umbra-color': '#2F2B3D',
      'shadow-xs-opacity': 0.10,
      'shadow-sm-opacity': 0.12,
      'shadow-md-opacity': 0.14,
      'shadow-lg-opacity': 0.16,
      'shadow-xl-opacity': 0.18,
    },
  },
  dark: {
    dark: true,
    colors: {
      'primary': staticPrimaryColor,
      'on-primary': '#fff',
      'primary-darken-1': staticPrimaryDarkenColor,
      'secondary': '#00838F', // Turquesa Oscuro
      'on-secondary': '#fff',
      'secondary-darken-1': '#006064', // Turquesa Más Oscuro
      'success': '#28C76F', // Verde Éxito
      'on-success': '#fff',
      'success-darken-1': '#24B364',
      'info': '#00BCD4', // Turquesa Brillante
      'on-info': '#fff',
      'info-darken-1': '#0097A7', // Turquesa Más Oscuro
      'warning': '#FFC107', // Naranja Brillante
      'on-warning': '#fff',
      'warning-darken-1': '#FFA000', // Naranja Oscuro
      'error': '#F44336', // Rojo
      'on-error': '#fff',
      'error-darken-1': '#D32F2F', // Rojo Oscuro
      'background': '#1E1E1E', // Gris Oscuro
      'on-background': '#CFD8DC', // Gris Claro
      'surface': '#2C2C2C', // Gris Muy Oscuro
      'on-surface': '#CFD8DC', // Gris Claro
      'grey-50': '#2E2E2E',
      'grey-100': '#3C3C3C',
      'grey-200': '#4A4A4A',
      'grey-300': '#5E5E5E',
      'grey-400': '#737373',
      'grey-500': '#8E8E8E',
      'grey-600': '#A9A9A9',
      'grey-700': '#BEBEBE',
      'grey-800': '#D3D3D3',
      'grey-900': '#E8E8E8',
      'grey-light': '#3E3E3E',
      'perfect-scrollbar-thumb': '#565656',
      'skin-bordered-background': '#2C2C2C',
      'skin-bordered-surface': '#2C2C2C',
    },
    variables: {
      'code-color': '#d400ff',
      'overlay-scrim-background': '#000000',
      'tooltip-background': '#2E2E2E',
      'overlay-scrim-opacity': 0.6,
      'hover-opacity': 0.06,
      'focus-opacity': 0.1,
      'selected-opacity': 0.08,
      'activated-opacity': 0.16,
      'pressed-opacity': 0.14,
      'dragged-opacity': 0.1,
      'disabled-opacity': 0.4,
      'border-color': '#CFD8DC',
      'border-opacity': 0.12,
      'table-header-color': '#3C3C3C',
      'high-emphasis-opacity': 0.9,
      'medium-emphasis-opacity': 0.7,
      'switch-opacity': 0.4,
      'switch-disabled-track-opacity': 0.4,
      'switch-disabled-thumb-opacity': 0.8,
      'switch-checked-disabled-opacity': 0.3,
      'track-bg': '#3A3F57',

      // Sombras
      'shadow-key-umbra-color': '#000000',
      'shadow-xs-opacity': 0.16,
      'shadow-sm-opacity': 0.18,
      'shadow-md-opacity': 0.2,
      'shadow-lg-opacity': 0.22,
      'shadow-xl-opacity': 0.24,
    },
  },
}

export default themes
