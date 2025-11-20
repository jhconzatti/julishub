import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

// 1. Importe apenas o arquivo para ele inicializar
import './lib/i18n'; 

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      {/* 2. Removemos o <LanguageProvider> antigo daqui */}
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)