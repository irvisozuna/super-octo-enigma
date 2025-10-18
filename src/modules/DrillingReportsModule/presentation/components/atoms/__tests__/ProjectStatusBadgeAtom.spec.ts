import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ProjectStatusBadgeAtom from '../ProjectStatusBadgeAtom.vue'

describe('ProjectStatusBadgeAtom', () => {
  it('renders badge with correct status label', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'active',
      },
    })

    expect(wrapper.text()).toContain('Activo')
  })

  it('applies correct color for active status', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'active',
      },
    })

    const chip = wrapper.findComponent({ name: 'VChip' })

    expect(chip.props('color')).toBe('success')
  })

  it('applies correct color for suspended status', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'suspended',
      },
    })

    const chip = wrapper.findComponent({ name: 'VChip' })

    expect(chip.props('color')).toBe('warning')
  })

  it('applies correct color for cancelled status', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'cancelled',
      },
    })

    const chip = wrapper.findComponent({ name: 'VChip' })

    expect(chip.props('color')).toBe('error')
  })

  it('shows icon when showIcon is true', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'active',
        showIcon: true,
      },
    })

    const icon = wrapper.findComponent({ name: 'VIcon' })

    expect(icon.exists()).toBe(true)
  })

  it('hides icon when showIcon is false', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'active',
        showIcon: false,
      },
    })

    const icon = wrapper.findComponent({ name: 'VIcon' })

    expect(icon.exists()).toBe(false)
  })

  it('applies custom size prop', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'active',
        size: 'large',
      },
    })

    const chip = wrapper.findComponent({ name: 'VChip' })

    expect(chip.props('size')).toBe('large')
  })

  it('applies custom variant prop', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'active',
        variant: 'outlined',
      },
    })

    const chip = wrapper.findComponent({ name: 'VChip' })

    expect(chip.props('variant')).toBe('outlined')
  })

  it('handles all status types correctly', () => {
    const statuses: Array<'planned' | 'active' | 'completed' | 'suspended' | 'cancelled'> = [
      'planned',
      'active',
      'completed',
      'suspended',
      'cancelled',
    ]

    const expectedLabels = {
      planned: 'Planificado',
      active: 'Activo',
      completed: 'Completado',
      suspended: 'Suspendido',
      cancelled: 'Cancelado',
    }

    statuses.forEach(status => {
      const wrapper = mount(ProjectStatusBadgeAtom, {
        props: { status },
      })

      expect(wrapper.text()).toContain(expectedLabels[status])
    })
  })

  it('has correct CSS class', () => {
    const wrapper = mount(ProjectStatusBadgeAtom, {
      props: {
        status: 'active',
      },
    })

    expect(wrapper.classes()).toContain('project-status-badge')
    expect(wrapper.classes()).toContain('status-active')
  })
})
