import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "OpenZess",
  description: "The Open Source Autonomous Agent Matrix — Build, deploy, and orchestrate AI agents with native tool access, multi-provider LLM routing, and a sandboxed Linux environment.",
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#f97316' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'OpenZess Documentation' }],
    ['meta', { property: 'og:description', content: 'The open source autonomous agent matrix with native tool access, multi-provider routing, and a sandboxed Linux environment.' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'OpenZess',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/features/agent-core' },
      { text: 'API Reference', link: '/api/rest-api' },
      {
        text: 'v1.1.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'Contributing', link: '/contributing' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: '🚀 Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation & Setup', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' }
          ]
        },
        {
          text: '🏗️ Architecture',
          items: [
            { text: 'System Overview', link: '/guide/architecture' },
            { text: 'Database (Neon PostgreSQL)', link: '/guide/database' },
            { text: 'Security & Sandboxing', link: '/guide/security' }
          ]
        }
      ],
      '/features/': [
        {
          text: '🧠 Core Features',
          items: [
            { text: 'Agent Core & LLM Routing', link: '/features/agent-core' },
            { text: 'Native Tool System', link: '/features/tools' },
            { text: 'Matrix Viewer (X11)', link: '/features/matrix-viewer' },
            { text: 'Memory Vault (ChromaDB)', link: '/features/memory-vault' },
          ]
        },
        {
          text: '⚡ Advanced Features',
          items: [
            { text: 'MCP Plugin System', link: '/features/mcp-plugins' },
            { text: 'Custom Python Plugins', link: '/features/custom-plugins' },
            { text: 'Swarm / War Room', link: '/features/swarm' },
            { text: 'Tavern & Personas', link: '/features/tavern' },
            { text: 'Channels (Telegram & Discord)', link: '/features/channels' },
            { text: 'Cron Jobs & Watchdogs', link: '/features/automation' },
          ]
        }
      ],
      '/api/': [
        {
          text: '📡 API Reference',
          items: [
            { text: 'REST API', link: '/api/rest-api' },
            { text: 'OpenAI-Compatible API', link: '/api/openai-compat' },
            { text: 'WebSocket (Matrix)', link: '/api/websocket' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/rosdebbu/openzess' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Debjit Das'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    }
  }
})
