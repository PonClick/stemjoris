import './style.css';
import { mountApp } from './ui/app';

const root = document.getElementById('app');
if (root) mountApp(root);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('Service worker niet geregistreerd', err));
  });
}
