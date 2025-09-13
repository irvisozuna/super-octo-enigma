<script setup lang="ts">
import { useTenantStore } from '@/stores/tenant.store'

const tenantStore = useTenantStore()
</script>

<template>
  <div
    id="tenant-bootstrap-loader"
    class="tenant-loader"
  >
    <div class="tenant-loader-content">
      <!-- Logo del tenant si está disponible -->
      <div
        v-if="tenantStore.data?.assets?.logo"
        class="tenant-logo"
      >
        <img
          :src="tenantStore.data.assets.logo"
          :alt="tenantStore.data.name"
          class="tenant-logo-image"
        >
      </div>

      <!-- Logo por defecto si no hay logo del tenant -->
      <div
        v-else
        class="default-logo"
      >
        <svg
          width="86"
          height="48"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
            fill="var(--initial-loader-color)"
            stroke="none"
          >
            <path
              d="M397 5104 c-97 -23 -167 -63 -242 -139 -77 -77 -116 -145 -140 -247
            -22 -95 -22 -4221 0 -4316 24 -102 63 -170 140 -247 77 -77 145 -116 247 -140
            95 -22 4221 -22 4316 0 102 24 170 63 247 140 77 77 116 145 140 247 22 95 22
            4221 0 4316 -24 102 -63 170 -140 247 -77 77 -145 116 -247 140 -92 22 -4231
            21 -4321 -1z m2266 -1256 c261 -209 564 -498 747 -712 548 -644 741 -1206 591
            -1724 -16 -54 -34 -119 -41 -146 -7 -26 -22 -56 -33 -66 -19 -18 -20 -16 -76
            93 -221 433 -647 920 -1188 1355 -55 45 -104 82 -107 82 -3 0 -6 -8 -6 -18 0
            -11 -56 -65 -142 -138 -509 -428 -899 -875 -1118 -1279 -45 -83 -75 -121 -84
            -106 -18 29 -78 204 -102 297 -26 99 -29 125 -28 274 0 187 18 293 80 471 168
            490 654 1097 1269 1588 66 53 122 99 123 104 6 12 10 10 115 -75z"
            />
          </g>
        </svg>
      </div>

      <!-- Nombre de la compañía -->
      <div
        v-if="tenantStore.data?.name"
        class="tenant-name"
      >
        {{ tenantStore.data.name }}
      </div>

      <!-- Spinner de carga -->
      <div class="loading-spinner">
        <div class="effect-1 effects" />
        <div class="effect-2 effects" />
        <div class="effect-3 effects" />
      </div>

      <!-- Mensaje de estado -->
      <div class="loading-message">
        <span v-if="tenantStore.isLoading">Cargando configuración...</span>
        <span v-else-if="tenantStore.hasError">Error al cargar configuración</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tenant-loader {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--initial-loader-bg, #fff);
  block-size: 100%;
  inline-size: 100%;
  inset-block-start: 0;
  inset-inline-start: 0;
}

.tenant-loader-content {
  padding: 2rem;
  max-inline-size: 400px;
  text-align: center;
}

.tenant-logo,
.default-logo {
  margin-block-end: 1.5rem;
}

.tenant-logo-image {
  max-block-size: 60px;
  max-inline-size: 120px;
  object-fit: contain;
}

.tenant-name {
  color: var(--initial-loader-color, #7367f0);
  font-size: 1.5rem;
  font-weight: 600;
  margin-block-end: 2rem;
}

.loading-spinner {
  position: relative;
  block-size: 60px;
  inline-size: 60px;
  margin-block: 0 1rem;
  margin-inline: auto;
}

.effects {
  position: absolute;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  transform: translate(-50%, -50%);
}

.effect-1 {
  animation-duration: 1s;
  block-size: 60px;
  border-block-start-color: var(--initial-loader-color, #7367f0);
  inline-size: 60px;
}

.effect-2 {
  animation-direction: reverse;
  animation-duration: 1.5s;
  block-size: 45px;
  border-inline-end-color: var(--initial-loader-color, #7367f0);
  inline-size: 45px;
}

.effect-3 {
  animation-duration: 2s;
  block-size: 30px;
  border-block-end-color: var(--initial-loader-color, #7367f0);
  inline-size: 30px;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.loading-message {
  color: #666;
  font-size: 0.9rem;
  margin-block-start: 1rem;
}

/* Modo oscuro */
.dark .tenant-loader {
  background: var(--initial-loader-bg, #1a1a1a);
}

.dark .loading-message {
  color: #ccc;
}
</style>
