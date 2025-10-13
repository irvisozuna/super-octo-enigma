import type { App } from 'vue'
import { installEmployeeModule } from '@/modules/EmployeeModule/installer'

export default function (app: App) {
  installEmployeeModule()
}
