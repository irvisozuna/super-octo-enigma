import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppDialog from '../AppDialog.vue'

describe('AppDialog', () => {
  it('renders properly', () => {
    const wrapper = mount(AppDialog, {
      props: {
        show: true,
        title: 'Test Dialog',
        width: '500px',
      },
    })

    expect(wrapper.text()).toContain('Test Dialog')
  })

  it('emits close event', async () => {
    const wrapper = mount(AppDialog, {
      props: {
        show: true,
      },
    })

    await wrapper.find('.close-button').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
