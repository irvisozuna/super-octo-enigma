<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<Props>()

const { t } = useI18n()

interface Props {
  itemData: {
    email: string
  }
}
</script>

<template>
  <VCard>
    <VCardText>
      <h5>{{ t('paymentmandate.details') }}</h5>
      <VList>
        <VListItem>
          <VListItemTitle>
            <strong>{{ t('email') }}:</strong> {{ itemData.email }}
          </VListItemTitle>
        </VListItem>
      </VList>
    </VCardText>
  </VCard>
</template>
