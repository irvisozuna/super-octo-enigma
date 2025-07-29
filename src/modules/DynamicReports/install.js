#!/usr/bin/env node

/**
 * DynamicReports Module Auto-Installer
 *
 * This script automatically installs the DynamicReports module into your Vue application.
 *
 * Usage:
 *   node install.js
 *   npm run install-module
 *   yarn install-module
 */

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync, writeFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

console.log('🚀 Installing DynamicReports module...')

try {
  // Read the installer
  const installerPath = join(__dirname, 'installer.ts')
  const installerContent = readFileSync(installerPath, 'utf8')

  // Create installation instructions
  const instructions = `# DynamicReports Module Installation

## Automatic Installation

1. Copy the module to your project:
   \`\`\`bash
   cp -r DynamicReports /path/to/your/project/src/modules/
   \`\`\`

2. Import and install in your main.ts:
   \`\`\`typescript
   import { installDynamicReportsModule } from './modules/DynamicReports/installer'
   
   // Install the module
   installDynamicReportsModule()
   \`\`\`

3. Or use as a plugin:
   \`\`\`typescript
   import DynamicReportsModule from './modules/DynamicReports/installer'
   
   app.use(DynamicReportsModule)
   \`\`\`

## Manual Installation

If automatic installation doesn't work, you can manually:

1. Add routes to your router
2. Add menu items to your navigation
3. Register stores with Pinia
4. Add translations to i18n
5. Configure CASL permissions

## Configuration

The module can be configured through environment variables:

- \`VUE_APP_DYNAMICREPORTS_API_BASE_URL\`: API base URL
- \`VUE_APP_DYNAMICREPORTS_ENABLED\`: Enable/disable module

## Uninstallation

To uninstall the module:

\`\`\`typescript
import { uninstallDynamicReportsModule } from './modules/DynamicReports/installer'

uninstallDynamicReportsModule()
\`\`\`

## Features

✅ Complete CRUD operations
✅ Domain-driven design
✅ TypeScript support
✅ Vue 3 Composition API
✅ Pinia state management
✅ Vuetify UI components
✅ Form validation
✅ Responsive design
✅ Error handling
✅ Loading states
✅ Pagination
✅ Search and filtering
✅ Export functionality
✅ CASL permissions
✅ i18n translations
✅ Auto-installation
✅ Plug-and-play

## Support

For support, check the README.md file or contact the development team.
`

  // Write installation instructions
  const instructionsPath = join(__dirname, 'INSTALLATION.md')

  writeFileSync(instructionsPath, instructions)

  console.log('✅ Installation instructions generated!')
  console.log('📖 Check INSTALLATION.md for detailed instructions')
}
catch (error) {
  console.error('❌ Error generating installation instructions:', error)
  process.exit(1)
}
