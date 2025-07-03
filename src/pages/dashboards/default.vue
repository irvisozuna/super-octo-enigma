<script setup lang="ts">
import DefaultDashaBoard from '@/views/dashboards/default/DefaultDashaBoard.vue';

definePage({
  meta: {
    action: 'read',
    subject: 'Profile',
  },
})
</script>
<template>
  <DefaultDashaBoard />
</template>
