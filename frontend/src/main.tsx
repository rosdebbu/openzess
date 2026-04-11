import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import DesktopWidget from './pages/DesktopWidget.tsx'

const isWidget = window.location.href.includes('desktop-widget')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isWidget ? <DesktopWidget /> : <App />}
  </StrictMode>,
)
