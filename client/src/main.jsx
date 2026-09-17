import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { Toaster } from 'react-hot-toast'

const savedFontSize = localStorage.getItem('fontSize') || 'Medium'
const fontSizeValues = { Small: '14px', Medium: '16px', Large: '18px' }
document.documentElement.style.fontSize = fontSizeValues[savedFontSize] || fontSizeValues.Medium

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Provider store={store}>
      <App />
      <Toaster position="top-right" />
    </Provider>
  </BrowserRouter>
)