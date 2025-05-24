<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useContractStore } from '@/modules/support/stores/contractStore'

interface ContractImage {
  tipo: string
  imagenUrl: string
  fecha: string
}

const props = defineProps<{
  isDialogVisible: boolean
  contractId: string
  periodId: string
}>()

const emit = defineEmits<{
  (e: 'update:isDialogVisible', value: boolean): void
}>()

const { t } = useI18n()
const contractStore = useContractStore()
const images = ref<ContractImage[]>([])
const loading = ref(false)
const error = ref('')
const currentSlide = ref(0)
const zoomDialog = ref(false)
const zoomedImageUrl = ref<string>('')

const dialogVisible = computed({
  get: () => props.isDialogVisible,
  set: value => emit('update:isDialogVisible', value),
})

const fetchImages = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await contractStore.getContractImages(props.contractId, props.periodId)
    if (response.success) {
      images.value = response.data
      currentSlide.value = 0
    }
    else {
      error.value = response.message
    }
  }
  catch (err) {
    error.value = t('error_loading_images')
  }
  finally {
    loading.value = false
  }
}

// Watch for dialog open and prop changes, and cleanup on close
watch(
  [dialogVisible, () => props.contractId, () => props.periodId],
  ([visible, contractId, periodId]) => {
    if (visible && contractId && periodId)
      fetchImages()

    if (!visible) {
      images.value = []
      error.value = ''
      loading.value = false
    }
  },
)

// Force fetch on mount if dialog is already visible and props are ready
onMounted(() => {
  if (dialogVisible.value && props.contractId && props.periodId)
    fetchImages()
})

function openZoom(imageUrl: string) {
  zoomedImageUrl.value = imageUrl
  zoomDialog.value = true
}

function closeZoom() {
  zoomDialog.value = false
  zoomedImageUrl.value = ''
}
</script>

<template>
  <VDialog
    v-model="dialogVisible"
    max-width="800px"
  >
    <DialogCloseBtn @click="dialogVisible = false" />
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center">
        {{ t('reading_evidence') }}
        <VBtn
          icon
          variant="text"
          @click="dialogVisible = false"
        >
          <VIcon>mdi-close</VIcon>
        </VBtn>
      </VCardTitle>

      <VCardText>
        <div
          v-if="loading"
          class="d-flex justify-center align-center py-4"
        >
          <VProgressCircular
            indeterminate
            color="primary"
          />
        </div>

        <div
          v-else-if="error"
          class="text-center py-4 text-error"
        >
          {{ error }}
        </div>

        <div
          v-else-if="images.length === 0"
          class="text-center py-4"
        >
          {{ t('no_images_available') }}
        </div>

        <div
          v-else
          class="d-flex flex-column gap-4"
        >
          <VCarousel
            v-model="currentSlide"
            :show-arrows="images.length > 1"
            hide-delimiter-background
            delimiter-icon="mdi-circle"
            height="400"
            class="rounded"
          >
            <VCarouselItem
              v-for="(image, index) in images"
              :key="index"
            >
              <div class="d-flex flex-column gap-2">
                <div class="text-subtitle-1 text-center">
                  {{ image.tipo }} - {{ image.fecha }}
                </div>
                <VImg
                  :src="image.imagenUrl"
                  :alt="image.tipo"
                  height="350"
                  contain
                  class="rounded"
                  style="cursor: zoom-in;"
                  @click="openZoom(image.imagenUrl)"
                />
              </div>
            </VCarouselItem>
          </VCarousel>
        </div>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Zoom modal -->
  <VDialog
    v-model="zoomDialog"
    max-width="90vw"
  >
    <VCard
      class="pa-2"
      style="background: transparent; box-shadow: none;"
    >
      <VImg
        v-if="zoomedImageUrl"
        :src="zoomedImageUrl"
        max-width="90vw"
        max-height="80vh"
        style=" background: #222; cursor: zoom-out;object-fit: contain;"
        @click="closeZoom"
      />
    </VCard>
  </VDialog>
</template>
