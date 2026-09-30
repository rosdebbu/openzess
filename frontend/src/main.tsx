import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.tsx'
import DesktopWidget from './pages/DesktopWidget.tsx'

// ── Dynamic Network / Tablet / Cloud Host Resolver ──
if (typeof window !== 'undefined') {
  const getApiHost = () => {
    // If running in dev server (e.g. tablet on port 5173), route to port 8000 on the same host IP
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    // If deployed in production / Cloud Run, use the same origin
    return window.location.origin;
  };

  const apiHost = getApiHost();

  axios.interceptors.request.use((config) => {
    if (config.url && config.url.startsWith('http://localhost:8000')) {
      config.url = config.url.replace('http://localhost:8000', apiHost);
    }
    return config;
  });

  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === 'string' && input.startsWith('http://localhost:8000')) {
      input = input.replace('http://localhost:8000', apiHost);
    }
    return originalFetch(input, init);
  };
}

// ── Global Shielding & Safe Web Fallbacks ──
// Prevents console crashes if external scripts or DevTools test undefined electron APIs
if (typeof window !== 'undefined') {
  if (!(window as any).electronAPI) {
    (window as any).electronAPI = {
      isElectron: false,
      isWeb: true,
      onLoadVrm: () => {},
      onGlobalMouseMove: () => {},
      onAgentSpeak: () => {},
      companionSpeak: () => {},
      minimize: () => {},
      maximize: () => {},
      close: () => {},
    };
  }

  // Gracefully catch unhandled async network / fetch rejections to keep DevTools console clean
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (
      event.reason?.name === 'AbortError' ||
      msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') ||
      msg.includes('Load failed')
    ) {
      event.preventDefault(); // Prevents bright red uncaught promise rejection in DevTools
    }
  });
}

const isWidget = window.location.href.includes('desktop-widget')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isWidget ? <DesktopWidget /> : <App />}
  </StrictMode>,
)

