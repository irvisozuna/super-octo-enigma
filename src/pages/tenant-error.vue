<script setup lang="ts">
import TenantErrorScreen from '@/components/TenantErrorScreen.vue'

// Meta para que sea una ruta pública
definePageMeta({
  public: true,
  layout: 'blank',
})
</script>

<template>
  <div class="tenant-error-page">
    <TenantErrorScreen />
  </div>
</template>

<style scoped>
.tenant-error-page {
  block-size: 100vh;
  inline-size: 100%;
}
</style>
