import type { App } from 'vue'
import { installTransportModule } from '@/modules/TransportModule/installer'

export default function (app: App) {
  installTransportModule()
}
