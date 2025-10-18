<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

// Props
interface Props {
  modelValue: string
  width?: number
  height?: number
  backgroundColor?: string
  penColor?: string
  penWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  width: 400,
  height: 200,
  backgroundColor: '#ffffff',
  penColor: '#000000',
  penWidth: 2,
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// State
const canvasRef = ref<HTMLCanvasElement>()
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// Computed
const hasSignature = computed(() => !!props.modelValue)

// Methods
const startDrawing = (event: MouseEvent | TouchEvent) => {
  isDrawing.value = true

  const canvas = canvasRef.value
  if (!canvas)
    return

  const rect = canvas.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  lastX.value = clientX - rect.left
  lastY.value = clientY - rect.top
}

const draw = (event: MouseEvent | TouchEvent) => {
  if (!isDrawing.value)
    return

  const canvas = canvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  const rect = canvas.getBoundingClientRect()
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY

  const currentX = clientX - rect.left
  const currentY = clientY - rect.top

  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(currentX, currentY)
  ctx.strokeStyle = props.penColor
  ctx.lineWidth = props.penWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()

  lastX.value = currentX
  lastY.value = currentY
}

const stopDrawing = () => {
  isDrawing.value = false
}

const clearSignature = () => {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = props.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  emit('update:modelValue', '')
}

const saveSignature = () => {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const dataURL = canvas.toDataURL('image/png')

  emit('update:modelValue', dataURL)
}

const initializeCanvas = () => {
  const canvas = canvasRef.value
  if (!canvas)
    return

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  // Set canvas size
  canvas.width = props.width
  canvas.height = props.height

  // Set background
  ctx.fillStyle = props.backgroundColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Set drawing properties
  ctx.strokeStyle = props.penColor
  ctx.lineWidth = props.penWidth
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const loadExistingSignature = () => {
  if (props.modelValue) {
    const canvas = canvasRef.value
    if (!canvas)
      return

    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    const img = new Image()

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }
    img.src = props.modelValue
  }
}

// Watchers
watch(() => props.modelValue, newValue => {
  if (newValue)
    loadExistingSignature()
  else
    clearSignature()
})

// Lifecycle
onMounted(() => {
  initializeCanvas()
  loadExistingSignature()
})

onUnmounted(() => {
  // Cleanup if needed
})
</script>

<template>
  <div class="signature-canvas-container">
    <div class="signature-header">
      <h3 class="signature-title">
        Firma Digital
      </h3>
      <p class="signature-description">
        Por favor, firma en el área de abajo usando tu mouse o touchpad
      </p>
    </div>

    <div class="signature-canvas-wrapper">
      <canvas
        ref="canvasRef"
        :width="width"
        :height="height"
        class="signature-canvas"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="startDrawing"
        @touchmove="draw"
        @touchend="stopDrawing"
      />

      <div
        v-if="!hasSignature"
        class="signature-placeholder"
      >
        <VIcon
          icon="mdi-signature"
          size="48"
          class="text-grey"
        />
        <p class="text-grey">
          Firma aquí
        </p>
      </div>
    </div>

    <div class="signature-actions">
      <VBtn
        color="grey"
        variant="outlined"
        size="small"
        @click="clearSignature"
      >
        <VIcon
          icon="mdi-eraser"
          class="me-2"
        />
        Limpiar
      </VBtn>

      <VBtn
        color="primary"
        variant="outlined"
        size="small"
        :disabled="!hasSignature"
        @click="saveSignature"
      >
        <VIcon
          icon="mdi-content-save"
          class="me-2"
        />
        Guardar Firma
      </VBtn>
    </div>

    <div
      v-if="hasSignature"
      class="signature-preview"
    >
      <h4 class="preview-title">
        Vista Previa:
      </h4>
      <div class="preview-container">
        <img
          :src="signatureData"
          alt="Firma guardada"
          class="preview-image"
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.signature-canvas-container {
  margin-block: 0;
  margin-inline: auto;
  max-inline-size: 500px;
}

.signature-header {
  margin-block-end: 16px;
  text-align: center;
}

.signature-title {
  font-size: 18px;
  font-weight: 600;
  margin-block: 0 8px;
  margin-inline: 0;
}

.signature-description {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.signature-canvas-wrapper {
  position: relative;
  overflow: hidden;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.signature-canvas {
  display: block;
  background-color: white;
  cursor: crosshair;
}

.signature-placeholder {
  position: absolute;
  z-index: 1;
  inset-block-start: 50%;
  inset-inline-start: 50%;
  pointer-events: none;
  text-align: center;
  transform: translate(-50%, -50%);
}

.signature-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-block-start: 16px;
}

.signature-preview {
  padding: 16px;
  border-radius: 8px;
  background-color: #f5f5f5;
  margin-block-start: 24px;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  margin-block: 0 12px;
  margin-inline: 0;
}

.preview-container {
  text-align: center;
}

.preview-image {
  border: 1px solid #ddd;
  border-radius: 4px;
  max-block-size: 100px;
  max-inline-size: 200px;
}

@media (max-width: 768px) {
  .signature-canvas-container {
    max-inline-size: 100%;
  }

  .signature-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
