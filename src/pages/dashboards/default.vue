<script setup lang="ts">
import DefaultDashaBoard from '@/views/dashboards/default/DefaultDashaBoard.vue'
import PermissionDebugger from '@/components/PermissionDebugger.vue'

definePage({
  meta: {
    action: 'read',
    subject: 'Profile',
  },
})
</script>

<template>
  <div>
    <PermissionDebugger />
    <DefaultDashaBoard />
  </div>
</template>
