<template>
  <VRow>
    <VCol class="d-flex flex-wrap ga-3">
      <VBtn variant="outlined">
        <VIcon icon="tabler-map-pin" class="me-2" />
      </VBtn>
      <VBtn variant="outlined">
        <VIcon icon="tabler-tool" class="me-2" />{{ $t('workorder') }}
      </VBtn>
      <VBtn variant="outlined">
        <VIcon icon="tabler-printer" class="me-2" />{{ $t('account_balance') }}
      </VBtn>
    </VCol>
  </VRow>
  <VRow>
    <VCol>
      <VBtn color="primary">
        <VIcon icon="tabler-plus" class="me-2" />{{ $t('add_charge') }}
      </VBtn>
    </VCol>
  </VRow>
</template>

<script setup lang="ts">
// Aquí puedes agregar lógica adicional si es necesario
</script>
