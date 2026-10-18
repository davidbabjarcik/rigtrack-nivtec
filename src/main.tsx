import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { watchErrors } from './lib/lastError'
import './index.css'

watchErrors()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
