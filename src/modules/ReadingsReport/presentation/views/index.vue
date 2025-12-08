<script setup lang="ts">
import { ref } from 'vue'
import ReadingsReportList from './ReadingsReportsList.vue'

const widgets = ref([])
</script>

<template>
  <ApiDataSource
    api-path="readings"
    @loaded="(response) => widgets = response"
  />
  <ReadingsReportList
    :title="$t('Reportes de Lecturas')"
    :description="$t('Lecturas registradas con la app')"
  />
</template>
