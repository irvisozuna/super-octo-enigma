import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { useAppStore } from '../appStore'

describe('AppStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should manage dialog state', () => {
    const store = useAppStore()
    const testComponent = { template: '<div>Test</div>' }

    store.openDialog({
      component: testComponent,
      props: { test: true },
      width: '500px',
    })

    expect(store.dialogState.show).toBe(true)
    expect(store.dialogState.options).toBeTruthy()

    store.closeDialog('submit')
    expect(store.dialogState.show).toBe(false)
  })
})
