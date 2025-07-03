import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { useAppManager } from '../useAppManager'

describe('useAppManager', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should open and close dialog', async () => {
    const { openDialog, closeDialog } = useAppManager()

    const TestComponent = { template: '<div>Test</div>' }
    const result = openDialog(TestComponent, { test: true }, { width: '500px' })

    expect(result).toBeTruthy()

    closeDialog('submit')

    // Add assertions for dialog state
  })

  it('should navigate to route', async () => {
    const { navigateTo } = useAppManager()

    await navigateTo('/test', { id: 1 }, { query: 'test' })

    // Add assertions for router state
  })

  it('should make API calls', async () => {
    const { makeApiCall } = useAppManager()

    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ data: 'test' }),
      }),
    ) as any

    const result = await makeApiCall('/api/test', 'GET')

    expect(result).toEqual({ data: 'test' })
  })
})
