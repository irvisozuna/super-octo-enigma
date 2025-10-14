<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '../stores/employeeStore'
import type { UpdateEmployeeRequest } from '../../domain/entities/EmployeeEntity'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()

const loading = ref(false)
const form = ref<Partial<UpdateEmployeeRequest>>({})

async function loadEmployee() {
  const id = route.params.id as string

  loading.value = true

  try {
    await employeeStore.fetchById(id)

    const employee = employeeStore.currentItem
    if (employee) {
      form.value = {
        id: employee.id,
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name,
        date_of_birth: employee.date_of_birth,
        gender: employee.gender,
        tax_id: employee.tax_id,
        email: employee.email,
        primary_phone: employee.primary_phone,
        secondary_phone: employee.secondary_phone,
        address_line_1: employee.address_line_1,
        address_line_2: employee.address_line_2,
        city: employee.city,
        state: employee.state,
        postal_code: employee.postal_code,
        emergency_contact_name: employee.emergency_contact_name,
        emergency_contact_phone: employee.emergency_contact_phone,
        hire_date: employee.hire_date,
        position: employee.position,
        employment_type: employee.employment_type,
        department: employee.department,
        salary_amount: employee.salary_amount,
        salary_currency: employee.salary_currency,
        status: employee.status,
      }
    }
  }
  catch (error) {
    console.error('Error loading employee:', error)
    router.push({ name: 'employees-list' })
  }
  finally {
    loading.value = false
  }
}

async function submitForm() {
  if (!form.value.id)
    return

  loading.value = true

  try {
    await employeeStore.updateItem(form.value.id, form.value)
    router.push({ name: 'employees-detail', params: { id: form.value.id } })
  }
  catch (error) {
    console.error('Error updating employee:', error)
  }
  finally {
    loading.value = false
  }
}

function cancel() {
  router.back()
}

onMounted(() => {
  loadEmployee()
})
</script>

<template>
  <VCard>
    <VCardTitle>
      <div class="d-flex align-center justify-space-between">
        <h4 class="text-h4">
          {{ t('EmployeeModule.employee.actions.edit') }}
        </h4>
      </div>
    </VCardTitle>

    <VCardText>
      <VForm @submit.prevent="submitForm">
        <VRow>
          <!-- Basic Information -->
          <VCol cols="12">
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.employee.sections.basic_info') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.employee_code"
              :label="`${t('EmployeeModule.employee.fields.employee_code')} *`"
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
              :label="`${t('EmployeeModule.employee.fields.first_name')} *`"
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
              :label="`${t('EmployeeModule.employee.fields.last_name')} *`"
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
              :label="t('EmployeeModule.employee.fields.date_of_birth')"
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
              :label="t('EmployeeModule.employee.fields.gender')"
              :items="[
                { value: 'male', title: t('EmployeeModule.employee.gender.male') },
                { value: 'female', title: t('EmployeeModule.employee.gender.female') },
                { value: 'other', title: t('EmployeeModule.employee.gender.other') },
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
              :label="t('EmployeeModule.employee.fields.tax_id')"
              variant="outlined"
            />
          </VCol>

          <!-- Contact Information -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.employee.sections.contact_info') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.email"
              :label="t('EmployeeModule.employee.fields.email')"
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
              :label="t('EmployeeModule.employee.fields.primary_phone')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.secondary_phone"
              :label="t('EmployeeModule.employee.fields.secondary_phone')"
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
              :label="t('EmployeeModule.employee.fields.address_line_1')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.address_line_2"
              :label="t('EmployeeModule.employee.fields.address_line_2')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.city"
              :label="t('EmployeeModule.employee.fields.city')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.state"
              :label="t('EmployeeModule.employee.fields.state')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.postal_code"
              :label="t('EmployeeModule.employee.fields.postal_code')"
              variant="outlined"
            />
          </VCol>

          <!-- Emergency Contact -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.employee.sections.emergency_contact') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="form.emergency_contact_name"
              :label="t('EmployeeModule.employee.fields.emergency_contact_name')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="6"
          >
            <VTextField
              v-model="form.emergency_contact_phone"
              :label="t('EmployeeModule.employee.fields.emergency_contact_phone')"
              variant="outlined"
            />
          </VCol>

          <!-- Employment Information -->
          <VCol cols="12">
            <VDivider class="my-4" />
            <h6 class="text-h6 mb-4">
              {{ t('EmployeeModule.employee.sections.employment_info') }}
            </h6>
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VTextField
              v-model="form.hire_date"
              :label="`${t('EmployeeModule.employee.fields.hire_date')} *`"
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
              :label="`${t('EmployeeModule.employee.fields.position')} *`"
              :items="[
                { value: 'operator', title: t('EmployeeModule.employee.positions.operator') },
                { value: 'helper', title: t('EmployeeModule.employee.positions.helper') },
                { value: 'manager', title: t('EmployeeModule.employee.positions.manager') },
                { value: 'supervisor', title: t('EmployeeModule.employee.positions.supervisor') },
                { value: 'admin', title: t('EmployeeModule.employee.positions.admin') },
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
              :label="`${t('EmployeeModule.employee.fields.employment_type')} *`"
              :items="[
                { value: 'full_time', title: t('EmployeeModule.employee.employment_types.full_time') },
                { value: 'part_time', title: t('EmployeeModule.employee.employment_types.part_time') },
                { value: 'contractor', title: t('EmployeeModule.employee.employment_types.contractor') },
                { value: 'temporary', title: t('EmployeeModule.employee.employment_types.temporary') },
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
              :label="t('EmployeeModule.employee.fields.department')"
              variant="outlined"
            />
          </VCol>

          <VCol
            cols="12"
            md="4"
          >
            <VSelect
              v-model="form.status"
              :label="`${t('common.status')} *`"
              :items="[
                { value: 'active', title: t('EmployeeModule.employee.status.active') },
                { value: 'inactive', title: t('EmployeeModule.employee.status.inactive') },
                { value: 'vacation', title: t('EmployeeModule.employee.status.vacation') },
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
              v-model.number="form.salary_amount"
              :label="t('EmployeeModule.employee.fields.salary_amount')"
              type="number"
              variant="outlined"
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
                {{ t('common.save') }}
              </VBtn>
            </div>
          </VCol>
        </VRow>
      </VForm>
    </VCardText>
  </VCard>
</template>
