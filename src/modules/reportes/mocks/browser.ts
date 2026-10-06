import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// El service worker (public/mockServiceWorker.js) ya existe en el proyecto (script msw:init)
export const worker = setupWorker(...handlers)
