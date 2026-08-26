import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "OpenZess",
  description: "The Autonomous, Self-Growing AI Workspace & Cyberpunk Terminal Matrix — Built for Builders.",
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#16a34a' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'OpenZess Documentation — Lizard Matrix Core' }],
    ['meta', { property: 'og:description', content: 'Autonomous AI coding assistant, hybrid Python/Rust engine, self-growing habit learner, and Hermes-grade cyberpunk terminal TUI.' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'OpenZess',
    
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Features', link: '/features/terminal-cli' },
      { text: 'API Reference', link: '/api/rest-api' },
      {
        text: 'v2.0.0',
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
            { text: 'Hybrid Python/Rust Engine', link: '/guide/hybrid-engine' },
            { text: 'Database (Neon PostgreSQL)', link: '/guide/database' },
            { text: 'Security & Sandboxing', link: '/guide/security' }
          ]
        }
      ],
      '/features/': [
        {
          text: '📟 Terminal & Intelligence',
          items: [
            { text: 'Cyberpunk Terminal CLI', link: '/features/terminal-cli' },
            { text: 'Habit Learner & Self-Growth', link: '/features/habit-learner' },
            { text: 'Agent Core & LLM Routing', link: '/features/agent-core' },
            { text: 'Native Tool System', link: '/features/tools' },
            { text: 'Memory Vault (ChromaDB)', link: '/features/memory-vault' },
          ]
        },
        {
          text: '⚡ Advanced Ecosystem',
          items: [
            { text: 'MCP Plugin System', link: '/features/mcp-plugins' },
            { text: 'Custom Python Plugins', link: '/features/custom-plugins' },
            { text: 'PaperBanana Visualizations', link: '/features/paperbanana' },
            { text: 'Swarm / War Room', link: '/features/swarm' },
            { text: 'Tavern & Personas', link: '/features/tavern' },
            { text: 'Matrix Viewer (X11)', link: '/features/matrix-viewer' },
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
      message: 'Released under the MIT License · Built with Lizard Matrix Core 🦎',
      copyright: 'Copyright © 2024-present Debjit Das (@rosdebbu)'
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3]
    }
  }
})
