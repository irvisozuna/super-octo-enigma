/**
 * Contract Module Configuration
 */

export const CONTRACT_CONFIG = {
  name: 'contracts',
  api: {
    baseUrl: '/contracts',
    endpoints: {
      list: '/',
      detail: '/:id',
      update: '/:id',
      delete: '/:id',
      validate: '/validate',
      catalogs: '/catalog/:type',
    },
  },
}
