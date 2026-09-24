import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { readStorage } from './utils/storage';

// Apply the saved theme before the first paint to avoid a light/dark flash.
document.documentElement.classList.toggle('dark', readStorage('theme') !== 'light');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
