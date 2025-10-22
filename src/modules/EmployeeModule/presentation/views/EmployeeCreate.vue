<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '../stores/employeeStore'
import type { CreateEmployeeRequest } from '../../domain/entities/EmployeeEntity'

const { t } = useI18n()
const router = useRouter()
const employeeStore = useEmployeeStore()

const loading = ref(false)

const form = ref<CreateEmployeeRequest>({
  employee_code: '',
  first_name: '',
  last_name: '',
  hire_date: new Date().toISOString().split('T')[0],
  position: 'operator',
  employment_type: 'full_time',
  status: 'active',
})

async function submitForm() {
  loading.value = true

  try {
    await employeeStore.createItem(form.value)
    router.push({ name: 'employees-list' })
  }
  catch (error) {
    console.error('Error creating employee:', error)
  }
  finally {
    loading.value = false
  }
}

function cancel() {
  router.back()
}
</script>

<template>
  <VCard>
    <VCardTitle>
      <div class="d-flex align-center justify-space-between">
        <h4 class="text-h4">
          {{ t('EmployeeModule.actions.create') }}
        </h4>
      </div>
    </VCardTitle>

    <VCardText>
      <VForm @submit.prevent="submitForm">
        <VRow>
          <!-- Basic Information -->
          <VCol cols="12">
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.sections.basic_info') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.employee_code"
              :label="`${t('EmployeeModule.fields.employee_code')} *`"
              variant="outlined"
              required
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.first_name"
              :label="`${t('EmployeeModule.fields.first_name')} *`"
              variant="outlined"
              required
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.last_name"
              :label="`${t('EmployeeModule.fields.last_name')} *`"
              variant="outlined"
              required
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.date_of_birth"
              :label="t('EmployeeModule.fields.date_of_birth')"
              type="date"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="form.gender"
              :label="t('EmployeeModule.fields.gender')"
              :items="[
                { value: 'male', title: t('EmployeeModule.gender.male') },
                { value: 'female', title: t('EmployeeModule.gender.female') },
                { value: 'other', title: t('EmployeeModule.gender.other') },
              ]"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.tax_id"
              :label="t('EmployeeModule.fields.tax_id')"
              variant="outlined"
            />
          </VCol>

          <!-- Contact Information -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.sections.contact_info') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.email"
              :label="t('EmployeeModule.fields.email')"
              type="email"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.primary_phone"
              :label="t('EmployeeModule.fields.primary_phone')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.secondary_phone"
              :label="t('EmployeeModule.fields.secondary_phone')"
              variant="outlined"
            />
          </VCol>

          <!-- Address -->
          <VCol
            cols="12"
            md="8"
          >
            <VTextField
              v-model="form.address_line_1"
              :label="t('EmployeeModule.fields.address_line_1')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.address_line_2"
              :label="t('EmployeeModule.fields.address_line_2')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.city"
              :label="t('EmployeeModule.fields.city')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.state"
              :label="t('EmployeeModule.fields.state')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.postal_code"
              :label="t('EmployeeModule.fields.postal_code')"
              variant="outlined"
            />
          </VCol>

          <!-- Emergency Contact -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.sections.emergency_contact') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="form.emergency_contact_name"
              :label="t('EmployeeModule.fields.emergency_contact_name')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="form.emergency_contact_phone"
              :label="t('EmployeeModule.fields.emergency_contact_phone')"
              variant="outlined"
            />
          </VCol>

          <!-- Employment Information -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.sections.employment_info') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.hire_date"
              :label="`${t('EmployeeModule.fields.hire_date')} *`"
              type="date"
              variant="outlined"
              required
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="form.position"
              :label="`${t('EmployeeModule.fields.position')} *`"
              :items="[
                { value: 'operator', title: t('EmployeeModule.positions.operator') },
                { value: 'helper', title: t('EmployeeModule.positions.helper') },
                { value: 'manager', title: t('EmployeeModule.positions.manager') },
                { value: 'supervisor', title: t('EmployeeModule.positions.supervisor') },
                { value: 'admin', title: t('EmployeeModule.positions.admin') },
              ]"
              variant="outlined"
              required
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="form.employment_type"
              :label="`${t('EmployeeModule.fields.employment_type')} *`"
              :items="[
                { value: 'full_time', title: t('EmployeeModule.employment_types.full_time') },
                { value: 'part_time', title: t('EmployeeModule.employment_types.part_time') },
                { value: 'contractor', title: t('EmployeeModule.employment_types.contractor') },
                { value: 'temporary', title: t('EmployeeModule.employment_types.temporary') },
              ]"
              variant="outlined"
              required
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.department"
              :label="t('EmployeeModule.fields.department')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model.number="form.salary_amount"
              :label="t('EmployeeModule.fields.salary_amount')"
              type="number"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.salary_currency"
              :label="t('EmployeeModule.fields.salary_currency')"
              variant="outlined"
              placeholder="MXN"
            />
          </VCol>
        </VRow>

        <!-- Actions -->
        <VRow class="mt-4">
          <VCol cols="12">
            <div class="d-flex gap-4 justify-end">
              <VBtn
                variant="outlined"
                @click="cancel"
              >
                {{ t('common.cancel') }}
              </VBtn>

              <VBtn
                type="submit"
                color="primary"
                :loading="loading"
              >
                {{ t('EmployeeModule.common.save') }}
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>
