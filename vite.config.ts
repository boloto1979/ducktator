import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx, defineManifest } from '@crxjs/vite-plugin'

const manifest = defineManifest({
  manifest_version: 3,
  name: 'DuckTator',
  version: '1.0.0',
  description: 'A dictator duck that watches your productivity. If you procrastinate, it uses local AI to humiliate you until you get back to work.',
  permissions: ['storage', 'tabs', 'alarms', 'scripting'],
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: {
      "16": "images/duck.png",
      "48": "images/duck.png",
      "128": "images/duck.png"
    }
  },
  icons: {
    "16": "images/duck.png",
    "48": "images/duck.png",
    "128": "images/duck.png"
  },
  options_page: 'src/options/index.html',
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['images/duck.png', 'assets/*'],
      matches: ['<all_urls>']
    }
  ],
})

export default defineConfig({
  plugins: [react(), crx({ manifest })],
})
