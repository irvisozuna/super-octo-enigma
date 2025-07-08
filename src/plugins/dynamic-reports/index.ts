import type { App } from 'vue'
import { installDynamicReportsModule } from '@/modules/DynamicReports/installer'

export default function (app: App) {
  installDynamicReportsModule()
}
