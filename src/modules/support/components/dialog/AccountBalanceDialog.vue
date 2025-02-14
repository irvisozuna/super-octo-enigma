<template>
  <DialogCloseBtn @click="closeDialog" />
  <VCard>
    <VCardTitle class="headline">
      {{ $t('account_balance') }}
    </VCardTitle>
    <VCardText>
      <VRow>
        <VCol cols="12" >
          <!-- Mostrar un spinner mientras carga el PDF -->
           <div class="text-center" v-if="loading">
              <VProgressCircular
              
              indeterminate
              color="primary"
              size="50"
            />
           </div>


          <!-- Una vez cargado, mostrar el PDF dentro de un iframe (o tu método preferido) -->
          <iframe
            v-else
            :src="pdfSrc"
            width="100%"
            height="600px"
          ></iframe>
        </VCol>
      </VRow>
    </VCardText>
    <VCardActions>
      <VBtn
        text
        @click="closeDialog"
      >
        {{ $t('close') }}
      </VBtn>
    </VCardActions>
  </VCard>
</template>

<script setup lang="ts">
import { useAppManager } from '@/composables/useAppManager'
import { onMounted, ref } from 'vue'
// Asumiendo que tienes un store "contractStore" con la función getPdFBalance
import { useContractStore } from '../../stores/contractStore'

const { closeDialog } = useAppManager()
const contractStore = useContractStore()

// Prop o variable que identifique tu "account"
const account = contractStore.item?.account

const loading = ref(true)
const pdfSrc = ref('') // contendrá la URL o el base64 del PDF

onMounted(async () => {
  try {
    // Obtiene la URL o base64 desde tu store
    const pdfUrl = await contractStore.getPdFBalance(account)
    // Si es URL (e.g. 'https://...' o algo similar)
    // pdfSrc.value = pdfUrl

    // O si recibes un base64, concatenar con 'data:application/pdf;base64,'
    pdfSrc.value = 'data:application/pdf;base64,' + pdfUrl

  } catch (error) {
    console.error('Error al cargar PDF:', error)
  } finally {
    loading.value = false
  }
})
</script>
