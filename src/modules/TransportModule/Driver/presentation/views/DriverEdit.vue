<script setup lang="ts">

// Implementation pending
</script>

<template>
  <div class="driver-edit">
    <VContainer>
      <VRow>
        <VCol cols="12">
          <div class="d-flex align-center mb-6">
            <VBtn
              icon
              variant="text"
              @click="$router.go(-1)"
            >
              <VIcon>tabler-arrow-left</VIcon>
            </VBtn>
            <h1 class="text-h4 ml-4">
              Edit Driver
            </h1>
          </div>
        </VCol>
      </VRow>

      <VRow>
        <VCol cols="12">
          <VCard>
            <VCardText>
              <VAlert
                type="info"
                variant="tonal"
              >
                Driver edit form will be implemented here.
              </VAlert>
            </VCardText>
          </VCard>
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
