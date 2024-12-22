import type { VerticalNavItems } from '@layouts/types'
import schedule from './schedule'
import clients from './clients'

export default [...schedule, ...clients] as VerticalNavItems
