import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DesktopWidget from './pages/DesktopWidget.tsx'

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

