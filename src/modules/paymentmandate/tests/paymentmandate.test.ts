// Prueba para el composable
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { usePaymentmandateHelpers } from '../composables/usePaymentmandateHelpers'

// Pruebas para los componentes
import PaymentmandateAddDialog from '../components/PaymentmandateAddDialog.vue'
import PaymentmandateEditDialog from '../components/PaymentmandateEditDialog.vue'
import PaymentmandateTable from '../components/PaymentmandateTable.vue'

describe('Paymentmandate Helpers', () => {
  it('debería formatear nombres correctamente', () => {
    const { formatPaymentmandateName } = usePaymentmandateHelpers()
    const result = formatPaymentmandateName(' ejemplo ')

    expect(result).toBe('EJEMPLO')
  })

  it('debería devolver el Paymentmandate por defecto', () => {
    const { getDefaultPaymentmandate } = usePaymentmandateHelpers()
    const result = getDefaultPaymentmandate()

    expect(result).toEqual({
      id: '',
      name: '',
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    })
  })
})

describe('Paymentmandate Components', () => {
  it('PaymentmandateAddDialog debería renderizar correctamente', () => {
    const wrapper = mount(PaymentmandateAddDialog)

    expect(wrapper.html()).toContain('Add Paymentmandate')
  })

  it('PaymentmandateEditDialog debería renderizar correctamente', () => {
    const wrapper = mount(PaymentmandateEditDialog, {
      props: { user: { id: '1', name: 'Test User' } },
    })

    expect(wrapper.html()).toContain('Edit Paymentmandate')
  })

  it('PaymentmandateTable debería renderizar columnas correctamente', () => {
    const wrapper = mount(PaymentmandateTable, {
      props: {
        headers: [{ title: 'Name', key: 'name' }],
        items: [{ id: '1', name: 'Test Item' }],
      },
    })

    expect(wrapper.html()).toContain('Name')
    expect(wrapper.html()).toContain('Test Item')
  })
})
