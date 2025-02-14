import navItemsFallback from '@/navigation/vertical/index'; // Importa los navItems locales
import { ApiService } from '@/services/apiService';
import type { VerticalNavItems } from '@layouts/types';
import { defineStore } from 'pinia';

export const useNavStore = defineStore('nav', {
  state: () => ({
    navItems: [] as VerticalNavItems, // Los navItems actuales
  }),
  actions: {
    async fetchNavItems() {
      try {
        const data = await ApiService.get('/nav-items');
        this.navItems = data as VerticalNavItems; // Usa los datos del backend
        localStorage.setItem('navItems', JSON.stringify(data)); // Almacena en localStorage
      } catch (error) {
        console.error('Error fetching nav items:', error);
        // Si hay un error, usa los navItems locales
        this.useFallbackNavItems();
      }
    },
    loadNavItemsFromStorage() {
      const storedNavItems = localStorage.getItem('navItems');
      if (storedNavItems) {
        this.navItems = JSON.parse(storedNavItems) as VerticalNavItems;
      } else {
        this.useFallbackNavItems(); // Si no hay datos en localStorage, usa los locales
      }
    },
    useFallbackNavItems() {
      this.navItems = navItemsFallback as VerticalNavItems; // Usa los navItems definidos en el archivo local
    },
  },
});
