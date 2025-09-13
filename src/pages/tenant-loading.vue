<script setup lang="ts">
import TenantBootstrapLoader from '@/components/TenantBootstrapLoader.vue'

// Meta para que sea una ruta pública
definePageMeta({
  public: true,
  layout: 'blank',
})
</script>

<template>
  <div class="tenant-loading-page">
    <TenantBootstrapLoader />
  </div>
</template>

<style scoped>
.tenant-loading-page {
  block-size: 100vh;
  inline-size: 100%;
}
</style>
