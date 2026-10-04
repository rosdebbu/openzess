export const SITE_URL = 'https://openzess.vercel.app';
export const SITE_NAME = 'Openzess';
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface RouteSeo {
  title: string;
  description: string;
}

export const ROUTE_SEO: Record<string, RouteSeo> = {
  '/': {
    title: 'Openzess — Autonomous AI Workspace & Terminal Agent',
    description:
      'Run autonomous AI agents in your browser or terminal. Connect any LLM, automate real tasks, and grow a self-learning memory vault. Start building free.',
  },
  '/doc': {
    title: 'Openzess Documentation — Guides, Features & API Reference',
    description:
      'Step-by-step Openzess guides covering installation, configuration, architecture, and the full REST and WebSocket API. Start mastering your AI workspace.',
  },
  '/faq': {
    title: 'Openzess FAQ — Setup, Privacy & Troubleshooting Tips',
    description:
      'Answers to common Openzess questions on installation, provider setup, API keys, privacy, and troubleshooting. Get unstuck fast and keep building with AI.',
  },
  '/changelog': {
    title: 'Openzess Changelog — Releases, Fixes & New Features',
    description:
      'Track every Openzess release across the terminal, web workspace, and hybrid engine. See what changed, what shipped, and update your workspace today.',
  },
  '/sessions': {
    title: 'Chat Sessions & Conversation History Vault — Openzess',
    description:
      'Browse, search, and resume every AI conversation you have had with Openzess. Keep your agent context flowing and pick up any thread in one click.',
  },
  '/tools': {
    title: 'AI Tool Arsenal: Terminal, Files & Web Access — Openzess',
    description:
      'Enable terminal commands, file creation, code editing, and web scraping for your Openzess agent. Fine-tune exactly what your AI can do on your machine.',
  },
  '/brain': {
    title: 'Brain Evolution: Watch Your AI Self-Grow — Openzess',
    description:
      'Watch your Openzess agent evolve with habit learning, preference detection, and long-term memory growth rendered as a living timeline. Explore your AI brain.',
  },
  '/evolution': {
    title: 'Brain Evolution: Watch Your AI Self-Grow — Openzess',
    description:
      'Watch your Openzess agent evolve with habit learning, preference detection, and long-term memory growth rendered as a living timeline. Explore your AI brain.',
  },
  '/channels': {
    title: 'Telegram & Discord Channels for Your AI — Openzess',
    description:
      'Link Telegram and Discord channels to your Openzess agent and chat with your AI from anywhere. Manage connections, bindings, and routing in one place.',
  },
  '/cron-jobs': {
    title: 'Cron Jobs & Watchdogs: Automate Your AI — Openzess',
    description:
      'Schedule recurring AI tasks, cron jobs, and system watchdogs that run without you. Let Openzess automate maintenance, reports, and checks around the clock.',
  },
  '/matrix': {
    title: 'Matrix Viewer: Screen Stream & Mouse Control — Openzess',
    description:
      'Stream your desktop into Openzess at 60FPS and drive mouse and keyboard injection securely. A visual sandbox for hands-on AI computer control.',
  },
  '/debate': {
    title: 'Warroom Debate Arena: Multi-Model Consensus — Openzess',
    description:
      'Make multiple AI models argue, critique, and synthesize decisions before a line of code is written. Reach consensus with the Openzess Debate Arena.',
  },
  '/skills': {
    title: 'AI Skills & Hot-Loaded Python Plugin Registry — Openzess',
    description:
      'Discover, hot-load, and synthesize Python skill plugins for your agent in real time. Extend Openzess capabilities without restarting a single process.',
  },
  '/mcp': {
    title: 'Connect MCP Servers (Model Context Protocol) — Openzess',
    description:
      'Connect any Model Context Protocol server to your Openzess agent with instant reload. Manage stdio and SSE MCP integrations from one visual grid.',
  },
  '/marketplace': {
    title: 'AI Plugin Marketplace & One-Click Imports — Openzess',
    description:
      'Browse and import verified community plugins, persona cards, and agent skills in one click. Expand your Openzess workspace from the marketplace.',
  },
  '/tavern': {
    title: 'Tavern — AI Persona Cards & The Commons — Openzess',
    description:
      'Import PNG and JSON persona cards, meet them in the Commons, and give every agent a distinct identity. Manage your AI cast from the Openzess Tavern.',
  },
  '/memory': {
    title: 'ChromaDB Memory Vault & Semantic Search — Openzess',
    description:
      "Inspect your agent's long-term ChromaDB memory with semantic similarity search. See exactly what your AI remembers and why, all in one vault.",
  },
  '/canvas': {
    title: 'Knowledge Canvas — Notes, Docs & Templates — Openzess',
    description:
      'Draft notes, capture knowledge, and build reusable templates on the Openzess canvas. Turn scattered ideas into a structured, searchable knowledge base.',
  },
  '/companion': {
    title: 'Desktop Companion & Always-On AI Widget — Openzess',
    description:
      'Keep a floating AI companion on your desktop with widget mode. Quick chat, instant answers, and always-on assistance from your Openzess agent.',
  },
  '/swarm': {
    title: 'Swarm WarRoom — Multi-Agent Collaboration — Openzess',
    description:
      'Orchestrate distributed agent swarms and collaboration rooms where multiple AI agents plan, execute, and review work together in the Openzess Swarm WarRoom.',
  },
  '/graphify': {
    title: 'Graphify — Live Codebase Knowledge Graph — Openzess',
    description:
      'Rebuild your codebase into a live, interactive dependency graph. See module relationships and architecture at a glance with Openzess Graphify.',
  },
  '*': {
    title: 'Page Not Found — Openzess',
    description:
      'The page you are looking for does not exist. Head back to the Openzess workspace, browse the documentation, or check the FAQ to find what you need.',
  },
};

const FALLBACK_SEO = ROUTE_SEO['*'];

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function applySeo(pathname: string): void {
  const seo = ROUTE_SEO[pathname] || FALLBACK_SEO;
  const url = `${SITE_URL}${pathname}`;

  document.title = seo.title;
  upsertMeta('name', 'description', seo.description);
  upsertMeta('name', 'robots', 'index, follow');
  upsertMeta('property', 'og:title', seo.title);
  upsertMeta('property', 'og:description', seo.description);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:image', OG_IMAGE);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', seo.title);
  upsertMeta('name', 'twitter:description', seo.description);
  upsertMeta('name', 'twitter:image', OG_IMAGE);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}
