<script setup lang="ts">
import { ref } from 'vue'
import TemplateList from './TemplateList.vue'

const widgets = ref([])
</script>

<template>
  <ApiDataSource
    api-path="template/get_data_widget"
    @loaded="(response) => widgets = response"
  >
    <template #default="{ loading }">
      <WidgetCard
        v-if="widgets.length > 0"
        :widget-data="widgets"
      />
    </template>
  </ApiDataSource>
  <TemplateList
    :title="$t('template.templates_list')"
    :description="$t('template.templates_list_description')"
  />
</template>
